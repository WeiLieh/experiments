-- =============================================================================
-- experiment-1/sql/002_scheduler.sql: the alarm clock (Supabase Cron)
--
-- What it does: every minute, asks the bot's /api/tick address to send any due
-- Nudges and reminders. Run it ONCE in the Supabase SQL Editor, AFTER the bot
-- is deployed on Vercel (GO-LIVE.md, step 5), with the two <...> parts replaced:
--   <YOUR-VERCEL-ADDRESS>  e.g. experiment-1-abc.vercel.app (no https://)
--   <YOUR-CRON-SECRET>     the same value as CRON_SECRET in Vercel
-- Your filled-in copy contains a secret: run it in Supabase, never save it in Git.
-- Needs the pg_cron and pg_net extensions switched on (Database → Extensions).
--
-- To stop the alarm clock:   select cron.unschedule('exp1-tick');
-- To see that it is running: select * from cron.job_run_details order by start_time desc limit 5;
-- =============================================================================

select cron.schedule(
  'exp1-tick',     -- the job's name
  '* * * * *',     -- every minute
  $$
  select net.http_post(
    url := 'https://<YOUR-VERCEL-ADDRESS>/api/tick',
    headers := jsonb_build_object('Authorization', 'Bearer <YOUR-CRON-SECRET>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
