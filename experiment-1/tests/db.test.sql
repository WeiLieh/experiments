-- =============================================================================
-- experiment-1/tests/db.test.sql: tests for Experiment 1's database (schema exp1)
--
-- What it checks: that experiment-1/sql/001_exp1.sql builds the tables agreed in
-- SPEC.md section 6, and that the database itself enforces the rules: who may
-- do what (test 17), the reset (16), the start line (22), the results view
-- leaving testers out (21), test-mode "send now" (15), no duplicates, and the
-- app's narrow edits. Runs on a throwaway local database, never on Supabase:
-- see run-db-tests.sh. Each block prints PASS or stops with FAIL.
-- =============================================================================

\set ON_ERROR_STOP on
\pset tuples_only on

-- Copy a Supabase default: the app's role skips row level security, so only
-- its permissions limit it (as on the real project).
alter role service_role bypassrls;

\i experiment-1/sql/001_exp1.sql

-- Helper: run one statement and expect the database to refuse it.
create or replace function pg_temp.expect_refused(label text, statement text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    raise notice 'PASS: refused %', label;
    return;
  end;
  raise exception 'FAIL: % SHOULD HAVE BEEN REFUSED', label;
end $$;

-- Helper: check a condition and say what it means.
create or replace function pg_temp.expect(label text, ok boolean) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS: %', label;
end $$;

-- Three parents: two real ones and one facilitator (tester).
insert into exp1.parents (parent_name, child_name, telegram_handle, morning_time, evening_time, is_tester) values
  ('Alex', 'Sam', 'alexdemo', '07:00', '19:00', false),
  ('Bea', 'Kai', '@BeaDemo', '08:00', '20:00', false),
  ('Tess', 'Toby', 'tester1', '09:00', '21:00', true);

-- ---------------------------------------------------------------------------
-- The table rules
-- ---------------------------------------------------------------------------
select pg_temp.expect_refused('a morning time other than 7, 8 or 9 am',
  $$insert into exp1.parents (parent_name, child_name, telegram_handle, morning_time, evening_time) values ('X', 'Y', 'x1', '07:30', '19:00')$$);
select pg_temp.expect_refused('an evening time other than 7, 8 or 9 pm',
  $$insert into exp1.parents (parent_name, child_name, telegram_handle, morning_time, evening_time) values ('X', 'Y', 'x2', '07:00', '22:00')$$);
select pg_temp.expect_refused('the same handle twice, even with other capitals or an @',
  $$insert into exp1.parents (parent_name, child_name, telegram_handle, morning_time, evening_time) values ('X', 'Y', '@ALEXDEMO', '07:00', '19:00')$$);
select pg_temp.expect('row level security is on for every table',
  (select bool_and(relrowsecurity) from pg_class where relnamespace = 'exp1'::regnamespace and relkind = 'r'));

-- ---------------------------------------------------------------------------
-- [17] Who may do what
-- ---------------------------------------------------------------------------
set role anon;
select pg_temp.expect_refused('the public reading the parents', 'select * from exp1.parents');
select pg_temp.expect_refused('the public running an app function', $$select exp1.app_agree(1)$$);
reset role;
set role authenticated;
select pg_temp.expect_refused('a signed-in web user reading the results', 'select * from exp1.results');
reset role;

set role service_role;
select pg_temp.expect('the app can read the tables and the results view',
  (select count(*) from exp1.parents) = 3 and (select count(*) from exp1.results) = 2 and (select count(*) from exp1.settings) = 1);
select pg_temp.expect_refused('the app adding a parent directly',
  $$insert into exp1.parents (parent_name, child_name, telegram_handle, morning_time, evening_time) values ('X', 'Y', 'x3', '07:00', '19:00')$$);
select pg_temp.expect_refused('the app changing a parent directly', $$update exp1.parents set child_name = 'Z'$$);
select pg_temp.expect_refused('the app deleting events directly', 'delete from exp1.events');
select pg_temp.expect('the app has no permission to run any owner command',
  not has_function_privilege('service_role', 'exp1.start(date)', 'execute')
  and not has_function_privilege('service_role', 'exp1.reset_test_data()', 'execute')
  and not has_function_privilege('service_role', 'exp1.test_mode(boolean)', 'execute')
  and not has_function_privilege('service_role', 'exp1.send_now(text, text)', 'execute'));
select pg_temp.expect('the public and web users have no permission to run any app function',
  not exists (select 1 from pg_proc where pronamespace = 'exp1'::regnamespace
    and (has_function_privilege('anon', oid, 'execute') or has_function_privilege('authenticated', oid, 'execute'))));
select pg_temp.expect_refused('the app starting the experiment', $$select exp1.start(current_date)$$);
select pg_temp.expect_refused('the app resetting test data', $$select exp1.reset_test_data()$$);
select pg_temp.expect_refused('the app switching test mode', $$select exp1.test_mode(true)$$);
select pg_temp.expect_refused('the app sending a test Nudge', $$select exp1.send_now('alexdemo', 'morning')$$);
reset role;

-- ---------------------------------------------------------------------------
-- The app's narrow edits (run as the app)
-- ---------------------------------------------------------------------------
set role service_role;
select pg_temp.expect('/start links a parent by handle, ignoring capitals and @',
  (exp1.app_link_parent('beademo', 222)->>'parent_name') = 'Bea');
select pg_temp.expect('a second Telegram account cannot take a linked handle',
  exp1.app_link_parent('BEADEMO', 999) is null);
select pg_temp.expect('an unknown handle links nobody', exp1.app_link_parent('nobody', 333) is null);
select exp1.app_link_parent('alexdemo', 111);
select exp1.app_link_parent('tester1', 444);
select pg_temp.expect('I agree is recorded', (exp1.app_agree(111)->>'agreed_at') is not null);
create temp table first_agree as select agreed_at from exp1.parents where telegram_user_id = 111;
select exp1.app_agree(111);
select pg_temp.expect('I agree is recorded once: a second tap keeps the first time',
  (select agreed_at from exp1.parents where telegram_user_id = 111) = (select agreed_at from first_agree));
select exp1.app_agree(222);
select exp1.app_agree(444);

-- One Nudge per parent, day and slot.
select exp1.app_create_nudge(1, date '2026-11-09', 'morning', timestamptz '2026-11-09 07:00+08', 'waiting');
select exp1.app_create_nudge(1, date '2026-11-09', 'morning', timestamptz '2026-11-09 07:00+08', 'waiting');
select pg_temp.expect('creating the same Nudge twice keeps one', (select count(*) from exp1.nudges where parent_id = 1) = 1);

\set z_morning '(select id from exp1.nudges where parent_id = 1 and slot = ''morning'')'
select pg_temp.expect('the app can claim a Nudge for sending once only',
  exp1.app_claim_nudge_send(:z_morning) and not exp1.app_claim_nudge_send(:z_morning));
select exp1.app_mark_nudge_sent(:z_morning, timestamptz '2026-11-09 07:00+08', 501);
select pg_temp.expect('a tap from another Telegram account changes nothing',
  not exp1.app_record_done(:z_morning, 222, timestamptz '2026-11-09 07:10+08', 'acted_on_nudge'));
select pg_temp.expect('the first ✅ Done is recorded',
  exp1.app_record_done(:z_morning, 111, timestamptz '2026-11-09 07:12:30+08', 'acted_on_nudge'));
select pg_temp.expect('a second ✅ Done changes nothing',
  not exp1.app_record_done(:z_morning, 111, timestamptz '2026-11-09 07:20+08', 'acted_on_nudge'));
select pg_temp.expect('minutes to ✅ Done are worked out by the database',
  (select minutes_to_done from exp1.nudges where id = :z_morning) = 12.5);
select pg_temp.expect_refused('the app setting a made-up status',
  $$select exp1.app_record_done((select id from exp1.nudges where parent_id = 1 and slot = 'morning'), 111, now(), 'excellent')$$);

-- A Nudge that closes as "did not act", then gets a tap before midnight.
select exp1.app_create_nudge(2, date '2026-11-09', 'morning', timestamptz '2026-11-09 08:00+08', 'waiting');
\set q_morning '(select id from exp1.nudges where parent_id = 2 and slot = ''morning'')'
select exp1.app_claim_nudge_send(:q_morning);
select exp1.app_mark_nudge_sent(:q_morning, timestamptz '2026-11-09 08:00+08', 502);
select pg_temp.expect('the app can close a waiting Nudge as "did not act"', exp1.app_set_status(:q_morning, 'waiting', 'no_action'));
select pg_temp.expect_refused('the app turning a finished Nudge back to waiting',
  $$select exp1.app_set_status((select id from exp1.nudges where parent_id = 2 and slot = 'morning'), 'no_action', 'waiting')$$);
select pg_temp.expect('a late tap can turn "did not act" into "acted late"',
  exp1.app_record_done(:q_morning, 222, timestamptz '2026-11-09 21:00+08', 'acted_late'));

-- /stop: the waiting Nudge becomes "stopped".
select exp1.app_create_nudge(1, date '2026-11-09', 'evening', timestamptz '2026-11-09 19:00+08', 'waiting');
select pg_temp.expect('/stop records the time', (exp1.app_stop(111)->>'stopped_at') is not null);
select pg_temp.expect('/stop ends the waiting Nudge as "stopped"',
  (select status from exp1.nudges where parent_id = 1 and slot = 'evening') = 'stopped');
select pg_temp.expect('the end message is claimed once only',
  exp1.app_claim_end_message(2) and not exp1.app_claim_end_message(2));

-- Events: one per Telegram update.
select exp1.app_log_event('start', 1, null, 9001, 111, '{}');
select exp1.app_log_event('start', 1, null, 9001, 111, '{}');
select pg_temp.expect('the same Telegram update is logged once', (select count(*) from exp1.events where telegram_update_id = 9001) = 1);
reset role;

-- ---------------------------------------------------------------------------
-- [21] The results view leaves out testers and test Nudges
-- ---------------------------------------------------------------------------
select pg_temp.expect('the results view lists the 2 real parents, not the tester',
  (select array_agg(parent_name order by parent_name) from exp1.results) = array['Alex', 'Bea']);
select pg_temp.expect('the results view counts each status',
  (select acted_on_nudge = 1 and stopped = 1 from exp1.results where parent_name = 'Alex')
  and (select acted_late = 1 from exp1.results where parent_name = 'Bea'));

-- ---------------------------------------------------------------------------
-- [15] Test mode and "send now" (run as the owner)
-- ---------------------------------------------------------------------------
select pg_temp.expect_refused('send now while test mode is off', $$select exp1.send_now('tester1', 'morning')$$);
select exp1.test_mode(true);
select pg_temp.expect('test mode is on', (select test_mode from exp1.settings));
select pg_temp.expect_refused('send now to a handle not on the list', $$select exp1.send_now('nobody', 'morning')$$);
select pg_temp.expect_refused('send now to a parent who has stopped', $$select exp1.send_now('alexdemo', 'morning')$$);
select exp1.send_now('tester1', 'morning');
select exp1.send_now('tester1', 'morning');
select pg_temp.expect('send now queues a waiting test Nudge, and can be repeated',
  (select count(*) from exp1.nudges n join exp1.parents p on p.id = n.parent_id where p.telegram_handle = 'tester1' and n.is_test and n.status = 'waiting') = 2);
select pg_temp.expect('test Nudges never appear in the results', (select sum(nudges) from exp1.results) = 3);

-- ---------------------------------------------------------------------------
-- [16] Reset: clears test data, keeps the parent list and real parents' joining
-- ---------------------------------------------------------------------------
select exp1.reset_test_data();
select pg_temp.expect('reset clears every Nudge and event',
  (select count(*) from exp1.nudges) = 0 and (select count(*) from exp1.events) = 0);
select pg_temp.expect('reset keeps the parent list', (select count(*) from exp1.parents) = 3);
select pg_temp.expect('reset clears the tester''s joining, so they can /start again',
  (select telegram_user_id is null and agreed_at is null and stopped_at is null from exp1.parents where telegram_handle = 'tester1'));
select pg_temp.expect('reset keeps real parents joined',
  (select telegram_user_id = 222 and agreed_at is not null from exp1.parents where parent_name = 'Bea'));

-- ---------------------------------------------------------------------------
-- [22] Start: one line, test mode off, test data cleared, date set; never twice
-- ---------------------------------------------------------------------------
select exp1.send_now('beademo', 'evening');
select exp1.start(date '2099-01-05');
select pg_temp.expect('start sets the date and turns test mode off',
  (select start_date = date '2099-01-05' and not test_mode and started_at is not null from exp1.settings));
select pg_temp.expect('start clears the test data', (select count(*) from exp1.nudges) = 0);
select pg_temp.expect_refused('starting a second time', $$select exp1.start(date '2099-01-06')$$);
select pg_temp.expect_refused('resetting after the start (it would wipe real data)', $$select exp1.reset_test_data()$$);
update exp1.settings set started_at = null;
select pg_temp.expect_refused('a start date in the past', $$select exp1.start(date '2020-01-01')$$);

\echo 'ALL DATABASE TESTS PASSED'
