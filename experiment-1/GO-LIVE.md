# Experiment 1: go-live guide

[2026-11-04 21:54 SGT] Step by step, for the owner. About an hour the first time. Each step says **where** to click and **what you should see**. Ask Claude at any step: "I'm on step N and I see X".

**Three secrets** appear below. Treat them like passwords: keep them only in Vercel, Supabase and your password manager; never in Git, chat or the WhatsApp group.

| Secret | What it is | Where it comes from |
|---|---|---|
| Bot token | The bot's password with Telegram | BotFather (step 2) |
| `TELEGRAM_WEBHOOK_SECRET` | Proves a message really comes from Telegram | You make it up: 30+ letters and digits |
| `CRON_SECRET` | Proves the alarm clock is really ours | You make it up: 30+ letters and digits, different from the one above |

## 1. Supabase: the database (about 15 minutes)
1. At supabase.com, **New project**: name `experiments`, region **Singapore**. Save the database password in your password manager.
   - [2026-11-05 12:29 SGT] **Check the Region drop-down says Southeast Asia (Singapore), `ap-southeast-1`, before clicking Create.** It may be pre-filled with another region, and a project can't be moved later (on 5 Nov the first project landed in Seoul and had to be deleted and recreated).
2. **SQL Editor** → New query → paste all of [sql/001_exp1.sql](sql/001_exp1.sql) → **Run**. You should see "Success. No rows returned".
3. **Project Settings → Data API → Exposed schemas**: add `exp1`, Save. (This lets the bot reach its drawer.)
4. **Project Settings → API keys**: note the **Project URL** and the **service_role** key (secret: never share it).
   - [2026-11-05 12:29 SGT] Use the **legacy service_role** key (starts `eyJ...`): **View legacy API keys** in the grey notice, or the page `/settings/api-keys/legacy`. Not the new `sb_secret_...` key: the bot sends its key in both the `apikey` and `Authorization` headers, which suits the legacy key; the new keys are not tested with it. Never click "Disable JWT-based API keys".
   - [2026-11-05 12:29 SGT] The **database password** is a different secret and is **not** needed in Vercel.
   - [2026-11-05 12:29 SGT] On the Data API settings page, switch **off** "Automatically expose new tables", and leave "Exposed tables" and "Exposed functions" at **0**: the bot gets in with the service_role key, and the public roles must stay locked out.

## 2. Telegram: the bot (about 5 minutes)
1. In Telegram, open **@BotFather** (the official one, with the blue tick) and send `/newbot`.
2. Give the bot's display name, then a username ending in `bot` (for example `HugExperimentBot`). BotFather replies with the **bot token**.
3. Optional: `/setdescription` for the one line people see before they press Start.

## 3. Vercel: the bot's home (about 15 minutes)
1. At vercel.com, **Add New → Project** → import the GitHub repo `WeiLieh/experiments`.
2. **Root Directory**: choose `experiment-1`. Framework: **Other**.
3. **Environment Variables**: add the five names from [.env.example](.env.example), with your values: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`, `SUPABASE_URL` (the Project URL), `SUPABASE_SERVICE_ROLE_KEY`.
4. **Deploy**. Note the address, for example `experiment-1-abc.vercel.app`.
5. [2026-11-05 12:29 SGT] Checks learned on 5 Nov:
   - **Settings → Build and Deployment:** Root Directory `experiment-1` (not `./`), Framework **Other**, Node.js Version **22.x** (the version the tests run on; Experiment 1's `package.json` asks for it). Each section has its own Save.
   - **Settings → Deployment Protection:** **Standard Protection** (previews only) or Disabled, never "All Deployments".
   - **Use the main address** under Domains (here `experiments-theta-liart.vercel.app`) in steps 4 and 5, never the longer one-off deployment address, which Standard Protection locks.
   - **After adding or changing any setting, redeploy:** Deployments → top deployment → ⋯ → Redeploy (Production, the Current deployment). Settings only reach new deployments.
   - **Check:** visiting `https://<YOUR-VERCEL-ADDRESS>/api/telegram` in a browser shows **HTTP ERROR 405**. That is the good result: the door exists but only accepts messages sent by Telegram. A **404** means the Root Directory is wrong.

## 4. Connect Telegram to the bot (2 minutes)
Paste this into your browser's address bar, with your three values filled in, and press Enter:

[2026-11-05 12:29 SGT] Use this version (it throws away messages sent to the bot before it was connected, such as early test /start or /stop):

`https://api.telegram.org/bot<BOT-TOKEN>/setWebhook?url=https://<YOUR-VERCEL-ADDRESS>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>&drop_pending_updates=true`

SUPERSEDED [2026-11-05 12:29 SGT]: `https://api.telegram.org/bot<BOT-TOKEN>/setWebhook?url=https://<YOUR-VERCEL-ADDRESS>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>`

[2026-11-05 12:29 SGT] Never screenshot this page: the address bar shows the token. Describe the text instead.

You should see `{"ok":true,"result":true,"description":"Webhook was set"}`. Then clear that line from your browser history (it contains the token).

## 5. Switch on the alarm clock (5 minutes)
1. Supabase → **Database → Extensions**: switch on **pg_cron** and **pg_net**.
2. SQL Editor: paste [sql/002_scheduler.sql](sql/002_scheduler.sql), replace `<YOUR-VERCEL-ADDRESS>` and `<YOUR-CRON-SECRET>`, Run. Don't save the filled-in query.
3. [2026-11-05 12:29 SGT] After two minutes, run `select status_code, content from net._http_response order by created desc limit 3;`. You should see **200** on each row and a report like `{"created":0,"sent":0,...}`. This shows the bot's real answer, and proves Vercel can read the database. **401** = the `CRON_SECRET` differs from Vercel's; **404** = wrong address; **500** = see Vercel's Logs.
   - SUPERSEDED [2026-11-05 12:29 SGT]: After two minutes, run `select status, return_message from cron.job_run_details order by start_time desc limit 3;`. You should see `succeeded`. (This only shows the alarm clock rang, not that the bot answered.)

## 6. A first test on your own phone (10 minutes)
1. Supabase → **Table Editor → schema exp1 → parents → Insert row**: your own name, a child's name, your Telegram handle (Telegram → Settings → Username), 07:00, 19:00, tick **is_tester**.
2. SQL Editor: `select exp1.test_mode(true);`
3. In Telegram, search for your bot, type `/start`, tap **I agree**.
4. SQL Editor: `select exp1.send_now('your_handle', 'morning');` Within a minute the Nudge arrives. Wait 2 minutes for the reminder, then tap ✅ Done.
5. Table Editor → `exp1.nudges`: the row shows `acted_on_reminder`. `exp1.events` lists every step.
6. [2026-11-05 12:29 SGT] Supabase shows times in UTC (`+00`): add 8 hours for Singapore time. The alarm clock checks once a minute, so a reminder comes 2 to 3 minutes after the Nudge in test mode (30 to 31 in the real experiment).

If something doesn't arrive, see "If something goes wrong" below.

## 7. Test with the facilitators
Follow [SPEC.md](SPEC.md), section 10: add them as testers, agree a script so every status gets tried, watch `exp1.nudges`, and reset with `select exp1.reset_test_data();` as often as you like.

## 8. Load the 10 parents
Table Editor → `exp1.parents` → **Insert → Import data from CSV**, using [parents-template.csv](parents-template.csv) as the pattern (one line per parent, `is_tester` = false). Keep the filled-in file out of Git. The table refuses times other than 7, 8 or 9 (am and pm), and the same handle twice.

## 9. Start
When you have the date: `select exp1.start('YYYY-MM-DD');`. It turns test mode off, clears test data and sets day 1. The first Nudges go out at each parent's morning time that day. It refuses to run twice.

## 10. During and after
- **Watch:** `exp1.results` (one line per parent), `exp1.nudges` (every Nudge), `exp1.events` (every step).
- **Download:** in the Table Editor, `exp1.results` and `exp1.nudges` → **Export → CSV**.
- **Delete the data 30 days after the end** (the welcome message promises it): `drop schema exp1 cascade;` then `select cron.unschedule('exp1-tick');`. Then follow the discard checklist in the repo's [CLAUDE.md](../CLAUDE.md).

## If something goes wrong
- **No reply to /start:** step 4 not done, or the secret doesn't match Vercel's `TELEGRAM_WEBHOOK_SECRET`. Check with `https://api.telegram.org/bot<BOT-TOKEN>/getWebhookInfo` (look at `last_error_message`).
- **"I can't find your Telegram handle":** the handle in `exp1.parents` doesn't match the parent's Telegram username. Fix the row; they type `/start` again.
- **No Nudge after send_now:** the alarm clock (step 5) isn't running, or the `CRON_SECRET` values differ. `cron.job_run_details` shows the error.
- **Errors in Vercel:** Vercel → project → **Logs** shows each failure with its reason.
