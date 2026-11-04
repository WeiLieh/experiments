# Experiment 1: handoff pack

[2026-11-04 22:09 SGT] One page to pick up Experiment 1 (Hug Nudges on Telegram) after a break or a cleared session. A snapshot: rewritten each session; the history stays in [PROGRESS.md](PROGRESS.md) and Git.

**Last updated:** [2026-11-04 22:09 SGT]

## 1. Where things stand
- [2026-11-04 22:09 SGT] **Code: done and merged.** Pull request #2 is merged into `main`: the agreed spec, the bot, its database, the tests and the go-live guide.
- [2026-11-04 22:09 SGT] **Tests:** 58 app tests (`npm run check`, re-run 4 Nov 22:10 SGT; earlier notes said 57) and 53 database checks (`npm run test:db`), all passing in Claude's sandbox.
- [2026-11-04 22:09 SGT] **Not yet proven on the real services.** Nothing is deployed. The first real proof is go-live step 6 (a test on your own phone).
- [2026-11-04 22:09 SGT] **Next:** you start go-live step 1 on 5 Nov.

## 2. Your go-live checklist
Full instructions, with what you should see at each click: [GO-LIVE.md](GO-LIVE.md). Tick these off as you go.

- [ ] **Before you start:** make up two secrets (30+ letters and digits each, different from each other) and save them in your password manager: `TELEGRAM_WEBHOOK_SECRET` and `CRON_SECRET`.
- [ ] **Before step 2:** decide the bot's name, its username (must end in `bot`) and its one-line description.
- [ ] **Step 1, Supabase** (about 15 min): project `experiments`, region Singapore; run `sql/001_exp1.sql`; expose schema `exp1`; note the Project URL and the service_role key.
- [ ] **Step 2, Telegram** (about 5 min): create the bot with @BotFather (blue tick); save the bot token.
- [ ] **Step 3, Vercel** (about 15 min): import `WeiLieh/experiments`, root folder `experiment-1`, framework Other; add the 5 settings from [.env.example](.env.example); deploy; note the address.
- [ ] **Step 4, connect Telegram** (2 min): the `setWebhook` address in your browser; then clear it from your browser history.
- [ ] **Step 5, alarm clock** (5 min): switch on pg_cron and pg_net; run `sql/002_scheduler.sql` with your values; check `cron.job_run_details` shows `succeeded`.
- [ ] **Step 6, first test on your phone** (10 min): add yourself as a tester, test mode on, /start, `send_now`, wait for the reminder, tap ✅ Done, check `exp1.nudges`.
- [ ] **Step 7, facilitators:** dress rehearsal, following [SPEC.md](SPEC.md) section 10, so every status gets tried.
- [ ] **Step 8, the 10 parents:** import from a CSV built on [parents-template.csv](parents-template.csv). Keep the filled-in file out of Git.
- [ ] **Step 9, start:** `select exp1.start('YYYY-MM-DD');` once you have the date.
- [ ] **On the start day:** put "delete Experiment 1 data" in your calendar for 30 days after the end (step 10 of the guide).

## 3. The five settings and where they come from
Treat every value like a password: only in Vercel, Supabase and your password manager; never in Git, chat or the WhatsApp group.

| Setting (in Vercel) | What it is | Where it comes from |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | The bot's password with Telegram | BotFather, step 2 |
| `TELEGRAM_WEBHOOK_SECRET` | Proves a message really comes from Telegram | You make it up |
| `CRON_SECRET` | Proves the alarm clock is really ours | You make it up (different from the one above) |
| `SUPABASE_URL` | The database's address | Supabase, step 1.4 (Project URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | The database's master key | Supabase, step 1.4 (service_role) |

## 4. Waiting on you
- [2026-11-04 22:09 SGT] **Go-live steps 1 to 9** (section 2).
- [2026-11-04 22:09 SGT] **The bot's name, username and description** (before step 2).
- [2026-11-04 22:09 SGT] **The start date.**
- [2026-11-04 22:09 SGT] **Four privacy points from the review** ([SPEC.md](SPEC.md) section 8), each with Claude's recommendation:
  - Handle matching: double-check each Telegram handle with the parent before loading it.
  - Deleting after 30 days is manual: calendar it on the start day.
  - The scheduler secret is readable in Supabase by anyone with database access (only you): accept for this pilot.
  - Real names are still in older Git history (this repo, and the main repo's branch `claude/experiment-1-hug`): decide whether to clean it up.
- [2026-11-04 22:09 SGT] **GitHub tidy-ups:** delete the branch `claude/experiment-1-hug` in `WeiLieh/FamilyHabitBuilder` (GitHub refused it from Claude's session); close pull request #1 in `WeiLieh/experiments` if it is still open (its content is already in `main` through #2).
- [2026-11-04 22:09 SGT] **Wipe the whiteboard photo** with the parents' real names, if not done yet.

## 5. Starting the next session
1. Say "run start of session routine for Experiment 1".
2. Claude reads [README.md](../README.md), [PROGRESS.md](PROGRESS.md) and this page, and tells you where things stand.
3. If you are mid-go-live, say "I'm on step N and I see X". Never paste a secret's value into the chat.

## 6. Where everything is
| File | What it is |
|---|---|
| [SPEC.md](SPEC.md) | The agreed rules, messages, data, tests, risks and the facilitator how-to |
| [GO-LIVE.md](GO-LIVE.md) | Step-by-step go-live, plus "If something goes wrong" |
| [PROGRESS.md](PROGRESS.md) | Session-by-session notes |
| [SPEC-draft-history.md](SPEC-draft-history.md) | Earlier drafts and your answers |
| `sql/001_exp1.sql`, `sql/002_scheduler.sql` | The database and the alarm clock, pasted in at steps 1 and 5 |
| [parents-template.csv](parents-template.csv) | The pattern for loading the 10 parents |
| `src/`, `api/`, `tests/` | The bot's code and its tests |
