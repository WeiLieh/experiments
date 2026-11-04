-- =============================================================================
-- experiment-1/sql/001_exp1.sql: Experiment 1's database (schema "exp1")
--
-- What it does: builds Experiment 1's own drawer ("schema") in the shared
-- "experiments" Supabase project: the tables in SPEC.md section 6, the narrow
-- functions the app may use, the owner's one-line commands (start, reset, test
-- mode, send now) and the locks. Run it ONCE in the Supabase SQL Editor (see
-- GO-LIVE.md). Discarding the experiment later: `drop schema exp1 cascade;`.
--
-- The locks, in plain English: the public and signed-in web users get nothing.
-- The app (Supabase's "service_role") may read the tables and run only the
-- app_* functions, each of which makes one narrow, checked change. Only the
-- owner, in the SQL Editor, can start, reset, switch test mode or send now.
-- Tests: experiment-1/tests/db.test.sql.
-- =============================================================================

create schema exp1;
comment on schema exp1 is 'Experiment 1: hug Nudges on Telegram (10 parents, 7 days). Drop the schema to discard it.';

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row of settings: when the experiment starts, and test mode.
create table exp1.settings (
  id integer primary key default 1 check (id = 1),
  start_date date,
  test_mode boolean not null default false,
  started_at timestamptz
);
comment on table exp1.settings is 'One row: the start date (set by exp1.start) and test mode (set by exp1.test_mode).';
comment on column exp1.settings.start_date is 'Day 1 of the 7 days, a Singapore date. Empty = not started.';
comment on column exp1.settings.test_mode is 'On: 2-minute windows and "send now" for testing with facilitators.';
comment on column exp1.settings.started_at is 'When the owner ran exp1.start. Set once.';
insert into exp1.settings (id) values (1);

-- Who takes part. Typed in by the owner (personal data: never in Git).
create table exp1.parents (
  id bigint generated always as identity primary key,
  parent_name text not null check (btrim(parent_name) <> ''),
  child_name text not null check (btrim(child_name) <> ''),
  telegram_handle text not null check (btrim(telegram_handle) <> ''),
  telegram_user_id bigint unique,
  -- The allowed times also live in src/settings.ts; a test keeps the two equal.
  morning_time time not null check (morning_time in ('07:00', '08:00', '09:00')),
  evening_time time not null check (evening_time in ('19:00', '20:00', '21:00')),
  is_tester boolean not null default false,
  agreed_at timestamptz,
  stopped_at timestamptz,
  end_message_sent_at timestamptz,
  created_at timestamptz not null default now()
);
-- One row per handle, ignoring capitals and a leading @.
create unique index parents_one_per_handle on exp1.parents (lower(ltrim(btrim(telegram_handle), '@')));
comment on table exp1.parents is 'The parents (and testers) in Experiment 1. Added by the owner in the Table Editor.';
comment on column exp1.parents.parent_name is 'First name, e.g. Alex.';
comment on column exp1.parents.child_name is 'Child''s first name or nickname, e.g. Sam.';
comment on column exp1.parents.telegram_handle is 'Public Telegram nickname, e.g. alexdemo (with or without @). Used once, at /start, to find the parent.';
comment on column exp1.parents.telegram_user_id is 'Telegram''s permanent number for the account. Filled at /start; every message goes here.';
comment on column exp1.parents.morning_time is '07:00, 08:00 or 09:00 (Singapore time).';
comment on column exp1.parents.evening_time is '19:00, 20:00 or 21:00 (Singapore time).';
comment on column exp1.parents.is_tester is 'Ticked for a facilitator. Testers never appear in exp1.results; reset lets them /start again.';
comment on column exp1.parents.agreed_at is 'When the parent tapped I agree. Empty = no Nudges.';
comment on column exp1.parents.stopped_at is 'When the parent typed /stop. Set = no more Nudges.';
comment on column exp1.parents.end_message_sent_at is 'When the end-of-7-days message went. Set once.';

-- The 7-day data collection table: one row per parent, day and Nudge.
create table exp1.nudges (
  id bigint generated always as identity primary key,
  parent_id bigint not null references exp1.parents (id) on delete cascade,
  day date not null,
  slot text not null check (slot in ('morning', 'evening')),
  scheduled_for timestamptz not null,
  is_test boolean not null default false,
  nudge_attempted_at timestamptz,
  nudge_sent_at timestamptz,
  nudge_message_id bigint,
  reminder_attempted_at timestamptz,
  reminder_sent_at timestamptz,
  done_at timestamptz,
  minutes_to_done numeric generated always as (round(extract(epoch from (done_at - nudge_sent_at)) / 60.0, 1)) stored,
  status text not null check (status in (
    'waiting', 'acted_on_nudge', 'acted_on_reminder', 'acted_late', 'no_action', 'not_started', 'not_delivered', 'stopped')),
  created_at timestamptz not null default now()
);
-- No duplicates: one real Nudge per parent, day and slot (test Nudges may repeat).
create unique index nudges_one_per_slot on exp1.nudges (parent_id, day, slot) where not is_test;
comment on table exp1.nudges is 'One row per Nudge: 10 parents x 7 days x 2 = 140 rows. Test Nudges are marked is_test.';
comment on column exp1.nudges.day is 'The Singapore date of the Nudge.';
comment on column exp1.nudges.slot is 'morning or evening.';
comment on column exp1.nudges.scheduled_for is 'When the Nudge was due.';
comment on column exp1.nudges.is_test is 'Sent by hand with exp1.send_now in test mode. Never counted in exp1.results.';
comment on column exp1.nudges.nudge_attempted_at is 'When the app started sending it (stops two scheduler runs sending it twice).';
comment on column exp1.nudges.nudge_sent_at is 'When Telegram accepted the Nudge. The 30 and 60 minutes count from here.';
comment on column exp1.nudges.reminder_sent_at is 'When the reminder went. Empty = not needed, or refused (see exp1.events).';
comment on column exp1.nudges.done_at is 'The first ✅ Done tap. Empty = no tap.';
comment on column exp1.nudges.minutes_to_done is 'Minutes from the Nudge to ✅ Done, worked out by the database.';
comment on column exp1.nudges.status is 'waiting, or: acted_on_nudge (1), acted_on_reminder (2), acted_late (3), no_action (4), not_started (5), not_delivered (6), stopped (7). See SPEC.md rule E1.6.';

-- The raw log: every message, tap and send, in order (add-only).
create table exp1.events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  kind text not null,
  parent_id bigint references exp1.parents (id) on delete cascade,
  nudge_id bigint references exp1.nudges (id) on delete cascade,
  telegram_update_id bigint unique,
  telegram_user_id bigint,
  detail jsonb not null default '{}'
);
comment on table exp1.events is 'Every /start, I agree, tap, typed message, Nudge, reminder and refusal. Typed words are not stored.';
comment on column exp1.events.kind is 'What happened, e.g. start, agree, done, nudge_sent, reminder_failed.';
comment on column exp1.events.telegram_update_id is 'Telegram''s number for the message; unique, so nothing is counted twice.';

-- The owner's summary: one line per real parent (testers and test Nudges left out).
create view exp1.results with (security_invoker = true) as
select
  p.id as parent_id,
  p.parent_name,
  p.child_name,
  count(n.id) as nudges,
  count(n.id) filter (where n.status = 'acted_on_nudge') as acted_on_nudge,
  count(n.id) filter (where n.status = 'acted_on_reminder') as acted_on_reminder,
  count(n.id) filter (where n.status = 'acted_late') as acted_late,
  count(n.id) filter (where n.status = 'no_action') as no_action,
  count(n.id) filter (where n.status = 'not_started') as not_started,
  count(n.id) filter (where n.status = 'not_delivered') as not_delivered,
  count(n.id) filter (where n.status = 'stopped') as stopped,
  count(n.id) filter (where n.status = 'waiting') as waiting,
  round(avg(n.minutes_to_done) filter (where n.status in ('acted_on_nudge', 'acted_on_reminder', 'acted_late')), 1) as avg_minutes_to_done
from exp1.parents p
left join exp1.nudges n on n.parent_id = p.id and not n.is_test
where not p.is_tester
group by p.id, p.parent_name, p.child_name
order by p.parent_name;
comment on view exp1.results is 'One line per real parent: how many Nudges ended in each status, and the average minutes to ✅ Done.';

-- ---------------------------------------------------------------------------
-- The app's functions: each makes one narrow, checked change
-- ("security definer" = it runs with the owner's rights, but only does this one thing)
-- ---------------------------------------------------------------------------

-- /start: link a Telegram account to the parent with this handle (capitals and @ ignored).
-- Returns the parent, or nothing if the handle isn't listed or belongs to another account.
create function exp1.app_link_parent(p_handle text, p_user_id bigint) returns jsonb
language sql security definer set search_path = exp1, pg_temp as $$
  update exp1.parents set telegram_user_id = p_user_id
  where lower(ltrim(btrim(telegram_handle), '@')) = lower(ltrim(btrim(p_handle), '@'))
    and (telegram_user_id is null or telegram_user_id = p_user_id)
  returning to_jsonb(parents.*);
$$;

-- I agree: recorded once (a second tap keeps the first time).
create function exp1.app_agree(p_user_id bigint) returns jsonb
language sql security definer set search_path = exp1, pg_temp as $$
  update exp1.parents set agreed_at = coalesce(agreed_at, now())
  where telegram_user_id = p_user_id
  returning to_jsonb(parents.*);
$$;

-- /stop: recorded once; a Nudge still waiting ends as "stopped".
create function exp1.app_stop(p_user_id bigint) returns jsonb
language plpgsql security definer set search_path = exp1, pg_temp as $$
declare stopped_parent exp1.parents;
begin
  update exp1.parents set stopped_at = coalesce(stopped_at, now())
  where telegram_user_id = p_user_id
  returning * into stopped_parent;
  if not found then return null; end if;
  update exp1.nudges set status = 'stopped'
  where parent_id = stopped_parent.id and status = 'waiting' and done_at is null;
  return to_jsonb(stopped_parent);
end $$;

-- Add a due Nudge (does nothing if it already exists).
create function exp1.app_create_nudge(p_parent_id bigint, p_day date, p_slot text, p_scheduled_for timestamptz, p_status text) returns void
language sql security definer set search_path = exp1, pg_temp as $$
  insert into exp1.nudges (parent_id, day, slot, scheduled_for, status)
  values (p_parent_id, p_day, p_slot, p_scheduled_for, p_status)
  on conflict (parent_id, day, slot) where not is_test do nothing;
$$;

-- Claim a Nudge for sending: true for the first caller only.
create function exp1.app_claim_nudge_send(p_id bigint) returns boolean
language sql security definer set search_path = exp1, pg_temp as $$
  with claimed as (
    update exp1.nudges set nudge_attempted_at = now()
    where id = p_id and status = 'waiting' and nudge_attempted_at is null
    returning 1
  )
  select exists (select 1 from claimed);
$$;

-- Telegram accepted the Nudge: record when, and its message number.
create function exp1.app_mark_nudge_sent(p_id bigint, p_at timestamptz, p_message_id bigint) returns void
language sql security definer set search_path = exp1, pg_temp as $$
  update exp1.nudges set nudge_sent_at = p_at, nudge_message_id = p_message_id
  where id = p_id and nudge_attempted_at is not null and nudge_sent_at is null;
$$;

-- Close or give up on a waiting Nudge. Only these two changes are allowed.
create function exp1.app_set_status(p_id bigint, p_from text, p_to text) returns boolean
language plpgsql security definer set search_path = exp1, pg_temp as $$
begin
  if p_from <> 'waiting' or p_to not in ('no_action', 'not_delivered') then
    raise exception 'The app may only change waiting to no_action or not_delivered, not % to %', p_from, p_to;
  end if;
  update exp1.nudges set status = p_to where id = p_id and status = 'waiting';
  return found;
end $$;

-- Claim a Nudge's one reminder: true for the first caller only.
create function exp1.app_claim_reminder(p_id bigint) returns boolean
language sql security definer set search_path = exp1, pg_temp as $$
  with claimed as (
    update exp1.nudges set reminder_attempted_at = now()
    where id = p_id and status = 'waiting' and reminder_attempted_at is null and done_at is null
    returning 1
  )
  select exists (select 1 from claimed);
$$;

-- Telegram accepted the reminder.
create function exp1.app_mark_reminder_sent(p_id bigint, p_at timestamptz) returns void
language sql security definer set search_path = exp1, pg_temp as $$
  update exp1.nudges set reminder_sent_at = p_at
  where id = p_id and reminder_attempted_at is not null and reminder_sent_at is null;
$$;

-- ✅ Done: the first tap by the Nudge's own parent, on a waiting or closed Nudge.
create function exp1.app_record_done(p_id bigint, p_user_id bigint, p_at timestamptz, p_status text) returns boolean
language plpgsql security definer set search_path = exp1, pg_temp as $$
begin
  if p_status not in ('acted_on_nudge', 'acted_on_reminder', 'acted_late') then
    raise exception 'A tap can only earn acted_on_nudge, acted_on_reminder or acted_late, not %', p_status;
  end if;
  update exp1.nudges n set done_at = p_at, status = p_status
  from exp1.parents p
  where n.id = p_id and p.id = n.parent_id and p.telegram_user_id = p_user_id
    and n.done_at is null and n.status in ('waiting', 'no_action');
  return found;
end $$;

-- The end-of-7-days message: claimed once per parent.
create function exp1.app_claim_end_message(p_parent_id bigint) returns boolean
language sql security definer set search_path = exp1, pg_temp as $$
  with claimed as (
    update exp1.parents set end_message_sent_at = now()
    where id = p_parent_id and end_message_sent_at is null
    returning 1
  )
  select exists (select 1 from claimed);
$$;

-- Add one line to the log (a Telegram update is logged once).
create function exp1.app_log_event(p_kind text, p_parent_id bigint, p_nudge_id bigint, p_update_id bigint, p_user_id bigint, p_detail jsonb) returns void
language sql security definer set search_path = exp1, pg_temp as $$
  insert into exp1.events (kind, parent_id, nudge_id, telegram_update_id, telegram_user_id, detail)
  values (p_kind, p_parent_id, p_nudge_id, p_update_id, p_user_id, coalesce(p_detail, '{}'))
  on conflict (telegram_update_id) do nothing;
$$;

-- ---------------------------------------------------------------------------
-- The owner's one-line commands (SQL Editor only; the app can't run them)
-- ---------------------------------------------------------------------------

-- select exp1.test_mode(true);  or  select exp1.test_mode(false);
create function exp1.test_mode(p_on boolean) returns text
language sql set search_path = exp1, pg_temp as $$
  update exp1.settings set test_mode = p_on;
  select case when p_on then 'Test mode ON: 2-minute windows; use exp1.send_now to send a Nudge.'
              else 'Test mode OFF: 30-minute windows.' end;
$$;

-- select exp1.send_now('their_handle', 'morning');  (test mode only)
create function exp1.send_now(p_handle text, p_slot text) returns text
language plpgsql set search_path = exp1, pg_temp as $$
declare p exp1.parents;
begin
  if not (select test_mode from exp1.settings) then
    raise exception 'Test mode is off. Run: select exp1.test_mode(true);';
  end if;
  select * into p from exp1.parents where lower(ltrim(btrim(telegram_handle), '@')) = lower(ltrim(btrim(p_handle), '@'));
  if not found then raise exception 'No parent with the handle %', p_handle; end if;
  if p.telegram_user_id is null or p.agreed_at is null then
    raise exception '% has not typed /start and tapped I agree yet', p.parent_name;
  end if;
  if p.stopped_at is not null then raise exception '% has typed /stop', p.parent_name; end if;
  insert into exp1.nudges (parent_id, day, slot, scheduled_for, is_test, status)
  values (p.id, (now() at time zone 'Asia/Singapore')::date, p_slot, now(), true, 'waiting');
  return format('Test %s Nudge queued for %s: it goes out within a minute.', p_slot, p.parent_name);
end $$;

-- select exp1.reset_test_data();  (before the start only)
create function exp1.reset_test_data() returns text
language plpgsql set search_path = exp1, pg_temp as $$
begin
  if (select started_at from exp1.settings) is not null then
    raise exception 'The experiment has started: a reset would delete real data.';
  end if;
  delete from exp1.events;
  delete from exp1.nudges;
  update exp1.parents set telegram_user_id = null, agreed_at = null, stopped_at = null, end_message_sent_at = null
  where is_tester;
  return 'Test data cleared. The parent list is kept; testers can /start again.';
end $$;

-- select exp1.start('2026-11-16');  (once)
create function exp1.start(p_date date) returns text
language plpgsql set search_path = exp1, pg_temp as $$
begin
  if (select started_at from exp1.settings) is not null then
    raise exception 'The experiment has already started.';
  end if;
  if p_date < (now() at time zone 'Asia/Singapore')::date then
    raise exception 'The start date % is in the past.', p_date;
  end if;
  perform exp1.reset_test_data();
  update exp1.settings set test_mode = false, start_date = p_date, started_at = now();
  return format('Started: day 1 is %s, test mode is off, test data cleared.', p_date);
end $$;

-- ---------------------------------------------------------------------------
-- The locks
-- ---------------------------------------------------------------------------
alter table exp1.settings enable row level security;
alter table exp1.parents enable row level security;
alter table exp1.nudges enable row level security;
alter table exp1.events enable row level security;

revoke all on schema exp1 from public, anon, authenticated;
grant usage on schema exp1 to service_role;

revoke all on all tables in schema exp1 from public, anon, authenticated, service_role;
grant select on all tables in schema exp1 to service_role; -- includes the results view

revoke all on all functions in schema exp1 from public, anon, authenticated, service_role;
grant execute on function
  exp1.app_link_parent(text, bigint),
  exp1.app_agree(bigint),
  exp1.app_stop(bigint),
  exp1.app_create_nudge(bigint, date, text, timestamptz, text),
  exp1.app_claim_nudge_send(bigint),
  exp1.app_mark_nudge_sent(bigint, timestamptz, bigint),
  exp1.app_set_status(bigint, text, text),
  exp1.app_claim_reminder(bigint),
  exp1.app_mark_reminder_sent(bigint, timestamptz),
  exp1.app_record_done(bigint, bigint, timestamptz, text),
  exp1.app_claim_end_message(bigint),
  exp1.app_log_event(text, bigint, bigint, bigint, bigint, jsonb)
to service_role;
