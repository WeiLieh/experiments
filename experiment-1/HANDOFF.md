# Experiment 1: handoff pack

[2026-11-05 12:29 SGT] One page to pick up Experiment 1 (Hug Nudges on Telegram) after a break or a cleared session. A snapshot: rewritten each session; the history stays in [PROGRESS.md](PROGRESS.md) and Git.

**Last updated:** [2026-11-05 12:29 SGT]. **Next session:** onboarding the facilitators (go-live step 7), 5 Nov afternoon.

## 1. Where things stand
- [2026-11-05 12:29 SGT] **Live in test mode.** Go-live steps 1 to 6 are done on the real services, and your phone test passed (status `acted_on_reminder`).
- [2026-11-05 12:29 SGT] **Test mode is ON.** Windows are 2 minutes instead of 30, nothing is sent on a schedule, and Nudges go out only when you run `send_now`. Leave it on until `exp1.start`.
- [2026-11-05 12:29 SGT] **Your own tester row and test Nudge are still in the tables.** The first reset (section 3, step 1) clears them.

| What | Where |
|---|---|
| Database | Supabase project `experiments`, Southeast Asia (Singapore), schema `exp1` |
| Bot | @FambuddyE1_bot (FamBuddy E1) |
| Bot's home | Vercel project `experiments`, address `experiments-theta-liart.vercel.app` |
| Alarm clock | Supabase Cron job `exp1-tick`, every minute |

## 2. Before the facilitators arrive (10 minutes)
1. **Each facilitator needs a Telegram username** (Telegram → Settings → Username). Collect them in advance. Someone without one can't be matched.
2. **Add each facilitator** in Supabase → Table Editor → schema `exp1` → `parents` → Insert row:
   - `parent_name`: their first name
   - `child_name`: a made-up name (for example Sam)
   - `telegram_handle`: their username (with or without @)
   - `morning_time` `07:00`, `evening_time` `19:00`
   - tick `is_tester`

   Leave the other fields blank. Real names go only into Supabase, never into Git or the WhatsApp group.
3. **Assign roles** (section 3). Write the names next to the letters before you start.
4. **Keep two Supabase tabs open:** the SQL Editor (to run commands) and Table Editor → `exp1.nudges` (to watch; press refresh).

## 3. The rehearsal script
Test mode timings, counted from when the Nudge arrives: the **reminder comes after 2 to 3 minutes**; a tap **up to 2 minutes** counts as acted on the Nudge; **2 to 4 minutes** counts as acted on the reminder; **after 4 minutes** counts as late; **no tap** shows "did not act" after about 4 to 5 minutes.

**Step 1. Clean start:** `select exp1.reset_test_data();` (clears your earlier test; you can /start again too).

**Step 2. Everyone joins:** each facilitator opens @FambuddyE1_bot, types `/start`, taps **I agree**. Check: a welcome naming their pretend child.

**Step 3. Send the Nudges:** run one line per facilitator (their username), for example `select exp1.send_now('alexdemo', 'morning');`. Each Nudge arrives within about a minute.

**Step 4. Each person plays one role:**

| Role | What they do | Expected status in `exp1.nudges` |
|---|---|---|
| A | Tap ✅ Done as soon as the Nudge arrives | `acted_on_nudge` |
| B | Wait for the reminder, then tap ✅ Done straight away | `acted_on_reminder` |
| C | Wait about 6 minutes after the Nudge, then tap ✅ Done | `acted_late` |
| D | Never tap | `no_action` (after about 5 minutes) |
| E | Type `/stop` before tapping, then type `/start` | `stopped`; replies "You've stopped the hug reminders" and then "You've already stopped" |
| F | Type a word (for example "done") instead of tapping, then tap ✅ Done, then tap it again | "I only understand the ✅ Done button" reply; then "Thank you!"; then "Already saved"; status `acted_on_nudge` if within 2 minutes |
| G | Someone **not** in the parents table types `/start` | the "can't find your Telegram handle" reply; nothing in the tables |

Fewer than 7 people? Run it in rounds: reset (step 1), swap roles, repeat.

**Step 5. Check:** in `exp1.nudges`, each row ends with the expected status. `exp1.events` lists every message and tap. `exp1.results` stays **empty** (testers are always left out).

**Step 6. Repeat as often as you like** with `select exp1.reset_test_data();` (it works until the start date).

## 4. If something goes wrong
| You see | Likely cause | Fix |
|---|---|---|
| "can't find your Telegram handle" for a facilitator | Their `telegram_handle` doesn't match their Telegram username | Fix the row; they type `/start` again |
| `send_now` shows "has not typed /start and tapped I agree yet" | They haven't joined | Step 2 for that person |
| `send_now` shows "Test mode is off" | Test mode was switched off | `select exp1.test_mode(true);` |
| No Nudge after a minute | Alarm clock or bot trouble | `select status_code, content from net._http_response order by created desc limit 3;` should show 200; else Vercel → project → Logs |
| No reply to /start at all | Telegram not reaching the bot | Ask Claude: "no reply to /start" (Claude will walk you through `getWebhookInfo` without screenshots of the token) |

**Times in Supabase are UTC** (`+00`): add 8 hours.

## 5. After the rehearsal (later)
- [ ] **Step 8:** load the 10 parents (CSV import, [parents-template.csv](parents-template.csv) pattern; double-check each handle with the parent first; keep the filled-in file out of Git).
- [ ] Optional: delete the facilitators' rows (they never appear in the results either way).
- [ ] **Step 9:** `select exp1.start('YYYY-MM-DD');` once you have the date. It switches test mode off and clears test data.
- [ ] **On the start day:** calendar "delete Experiment 1 data" for 30 days after the end ([GO-LIVE.md](GO-LIVE.md), step 10).

## 6. Waiting on you
- [2026-11-05 12:29 SGT] Facilitators' Telegram usernames; the start date.
- [2026-11-05 12:29 SGT] **Bot token** appeared in a screenshot in the Claude chat. You accepted this for now; to fix (5 minutes, best before the 10 parents join), see [SPEC.md](SPEC.md) section 8.
- [2026-11-05 12:29 SGT] Privacy points from the review ([SPEC.md](SPEC.md) section 8): handle double-check, the manual 30-day deletion, the scheduler secret in Supabase (recommended: accept), real names in older Git history.
- [2026-11-05 12:29 SGT] GitHub tidy-ups: delete branch `claude/experiment-1-hug` in `WeiLieh/FamilyHabitBuilder`; close pull request #1 in `WeiLieh/experiments` if still open.
- [2026-11-05 12:29 SGT] Optional: BotFather description says "two gentle reminders a day"; parents can get up to 4 messages (2 Nudges plus up to 2 reminders). Suggested: "A 7-day experiment: a gentle nudge each morning and evening to hug your child. Type /start to join."

## 7. Starting the next session
1. Say "run start of session routine for Experiment 1".
2. Claude reads [README.md](../README.md), [PROGRESS.md](PROGRESS.md) and this page, then walks you through section 2.
3. During the rehearsal, tell Claude "role X got Y" for anything unexpected. Never paste a secret, and never screenshot a page whose address contains the bot token.

## 8. Where everything is
| File | What it is |
|---|---|
| [SPEC.md](SPEC.md) | The agreed rules, messages, data, tests, risks; section 10 is the facilitator how-to |
| [GO-LIVE.md](GO-LIVE.md) | Step-by-step go-live (corrected 5 Nov), plus "If something goes wrong" |
| [PROGRESS.md](PROGRESS.md) | Session-by-session notes |
| `sql/001_exp1.sql`, `sql/002_scheduler.sql` | The database and the alarm clock (already run) |
| [parents-template.csv](parents-template.csv) | The pattern for loading the 10 parents |
| `src/`, `api/`, `tests/` | The bot's code and its tests |
