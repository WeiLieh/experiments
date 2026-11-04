# Experiment 1: spec (version 1)

[2026-11-04 21:05 SGT] **Moved** into the `experiments` repo, folder `experiment-1/` (owner, 4 Nov: a separate repo for throwaway experiments; see the repo's `CLAUDE.md`). Data now lives in schema `exp1` of the shared "experiments" Supabase project (section 6).

[2026-11-04 20:56 SGT] The agreed spec of **Experiment 1**, a very simplified hug-only version of the Family Habit Builder, kept entirely in this folder (owner, 4 Nov: "nothing outside"). The drafts and the owner's answers, with dates, are in [SPEC-draft-history.md](SPEC-draft-history.md). Rule IDs here start with **E1.** so they never clash with the main app's rule numbers (the draft called them 12.1 to 12.11; the mapping is in section 4).

**Status:** [2026-11-04 21:54 SGT] **Built and tested, not deployed.** Code in this folder (`src/`, `api/`, `sql/`); 57 app tests and 53 database checks pass, covering the 23 tests in section 7. Next: the owner follows [GO-LIVE.md](GO-LIVE.md). Two small decisions made while building, for the owner to check: (1) a Nudge the scheduler reaches more than 30 minutes late is not sent and is recorded as "Not sent" (status 6), with the reason "too late" in the log; (2) the reset and "send now" work only before the start (`exp1.start` turns test mode off).

SUPERSEDED [2026-11-04 21:54 SGT] **Status:** [2026-11-04 21:42 SGT] **Agreed in full** (owner, 4 Nov: "confirm everything": statuses 5 to 7, the 23 tests in section 7, and the recommendations in section 9). Building started on branch `claude/experiment-1-build`. Still to come from the owner: the start date, and the bot's name and description (before go-live).

SUPERSEDED [2026-11-04 21:42 SGT] **Status:** agreed except the items marked **OPEN** (section 9). Nothing is built yet.

## 1. Goal
- [2026-11-04 20:56 SGT] Run a hug-only version of the app with **10 real parents for 7 days**, to learn: (1) do parents act on a Nudge, (2) does one reminder 30 minutes later help, and (3) do Telegram, Supabase, Vercel and the scheduler work together in real life.
- [2026-11-04 20:56 SGT] One habit: **giving their child a hug** ("Showing affection"). One loop: Nudge → Action (hug) → tap ✅ Done → a short thank-you (Reward).

## 2. Users
- [2026-11-04 20:56 SGT] **10 parents**, each with **one child** (name or nickname) and a **Telegram account with a handle**. The owner provides each parent's first name, child's name, Telegram handle, morning time and evening time.
- [2026-11-04 20:56 SGT] **The owner** (the only operator) loads the parents, tests with the facilitators, starts the experiment and reads the results.

## 3. How it works
1. [2026-11-04 20:56 SGT] **Joining.** The owner tells the parents the bot's name (offline). Each parent searches for the bot in Telegram and types **/start**. The bot matches them by **Telegram handle** (capitals and @ ignored). If matched, it shows the welcome and consent message (section 5) with an **I agree** button; agreeing makes them active. If not matched, it says so and nothing else happens; the owner sorts it out offline and the parent types /start again.
2. [2026-11-04 20:56 SGT] **Two Nudges a day for 7 days** at the parent's own times: morning **7, 8 or 9 am**, evening **7, 8 or 9 pm** (Singapore time), the same every day including weekends. Each Nudge has one button: **✅ Done**.
3. [2026-11-04 20:56 SGT] **✅ Done within 30 minutes** → a thank-you; that Nudge is finished.
4. [2026-11-04 20:56 SGT] **No ✅ Done after 30 minutes** → **one reminder**, also with ✅ Done.
- [2026-11-04 21:19 SGT] **Steps 5 and 6 changed (owner, 4 Nov):** the statuses are renamed (rule E1.6), and parents get a **/stop** command (rule E1.13).
5. [2026-11-04 20:56 SGT] **Still nothing 30 minutes after the reminder** → silence; recorded as "did not respond". A later tap is still recorded (status 3).
6. [2026-11-04 20:56 SGT] **No way to stop inside the bot**, and no "Not today" button. A parent can still mute or block the bot in Telegram; a blocked bot's messages are recorded as "not delivered".
7. [2026-11-04 20:56 SGT] **The owner starts the experiment** with one line in the Supabase SQL Editor, giving the start date. **Testing** uses a test mode and a reset (rules E1.10, E1.11).

## 4. Rules
- **E1.1** [2026-11-04 20:56 SGT] 7 Singapore days from the owner's start date; 10 parents; one behaviour (a hug); Telegram only. *(was 12.1)*
- **E1.2** [2026-11-04 20:56 SGT] One morning time (7, 8 or 9 am) and one evening time (7, 8 or 9 pm) per parent, set by the owner, the same every day. *(was 12.2)*
- **E1.3** [2026-11-04 20:56 SGT] Nudges only after **/start, a handle match and I agree**; before that, each Nudge due is recorded as "not started". *(was 12.3)*
- **E1.4** [2026-11-04 20:56 SGT] Only a tap on **✅ Done** counts as a response; typed words do not. *(was 12.4)*
- **E1.5** [2026-11-04 20:56 SGT] No ✅ Done within 30 minutes → exactly one reminder. *(was 12.5)*
- **E1.6** [2026-11-04 21:34 SGT] **Every Nudge ends with exactly one status** (owner's names; minutes counted from when the Nudge was sent; **cut-off at midnight** at the end of that Singapore day, owner 4 Nov):
  1. **Acted on Nudge** (`acted_on_nudge`): ✅ Done up to and including 30:00.
  2. **Did not act on Nudge. Acted on reminder** (`acted_on_reminder`): ✅ Done after 30:00, up to and including 60:00.
  3. **Did not act on Nudge. Acted on reminder late** (`acted_late`): ✅ Done after 60:00 and **before midnight** that day.
  4. **Did not act on Nudge. Did not act on reminder** (`no_action`): no ✅ Done before midnight.
  5. **Not sent: hadn't started** (`not_started`): the parent hadn't joined (E1.3).
  6. **Not sent: Telegram refused** (`not_delivered`): for example, the bot was blocked. No reminder follows.
  7. **Stopped** (`stopped`): the parent had sent /stop (E1.13).
  The status depends on **when** ✅ Done was tapped, not on which message's button was tapped. While the 60 minutes run, the Nudge shows **waiting**. The only change after that: 4 becomes 3 when a tap arrives before midnight; a tap after midnight is kept in the log (`events`) but changes nothing. A reminder Telegram refused is recorded separately; the status still follows the tap time.
- SUPERSEDED [2026-11-04 21:34 SGT] **E1.6** [2026-11-04 21:19 SGT] **Every Nudge ends with exactly one status** (owner's names, 4 Nov; minutes counted from when the Nudge was sent):
  1. **Acted on Nudge** (`acted_on_nudge`): ✅ Done up to and including 30:00.
  2. **Did not act on Nudge. Acted on reminder** (`acted_on_reminder`): ✅ Done after 30:00, up to and including 60:00.
  3. **Did not act on Nudge. Acted on reminder late** (`acted_late`): ✅ Done after 60:00, at any time until the experiment ends.
  4. **Did not act on Nudge. Did not act on reminder** (`no_action`): no ✅ Done.
  5. *(proposed)* **Not sent: hadn't started** (`not_started`): the parent hadn't joined (E1.3).
  6. *(proposed)* **Not sent: Telegram refused** (`not_delivered`): for example, the bot was blocked. No reminder follows.
  7. *(proposed)* **Stopped** (`stopped`): the parent had sent /stop (E1.13).
  The status depends on **when** ✅ Done was tapped, not on which message's button was tapped. While the 60 minutes run, the Nudge shows **waiting**. The only change after that: 4 becomes 3 when a late tap arrives; both times are kept. A reminder Telegram refused is recorded separately; the status still follows the tap time.
- SUPERSEDED [2026-11-04 21:19 SGT] **E1.6** [2026-11-04 20:56 SGT] **Every Nudge ends with exactly one status:** *(was 12.6; owner confirmed 4 Nov)*
  1. **Done on time:** ✅ Done within 30 minutes of the Nudge (30:00 exactly counts).
  2. **Done after reminder sent:** ✅ Done after the reminder, within 30 minutes of it.
  3. **Responded after 30 mins:** ✅ Done more than 30 minutes after the reminder (60+ minutes after the Nudge), at any time until the experiment ends.
  4. **Did not respond:** no ✅ Done.
  5. **Not started:** the parent hadn't joined (E1.3), so nothing was sent.
  6. **Not delivered:** Telegram refused the Nudge (for example, the bot was blocked). No reminder follows.
  While the 60 minutes run, the Nudge shows **waiting**. The only change after that: "did not respond" becomes "responded after 30 mins" when a late tap arrives; both times are kept.
- **E1.7** [2026-11-04 20:56 SGT] Every Nudge, reminder and tap is recorded with its time. Nothing is guessed or filled in (main app rule 1.3, no fallbacks). A tap is counted once, even if Telegram sends it twice or the parent taps twice. A tap always belongs to the Nudge whose button was tapped. *(was 12.7)*
- **E1.8** [2026-11-04 20:56 SGT] The numbers (times, 30 minutes, 7 days, the 2-minute test windows) live once, in this folder's settings file. *(was 12.8)*
- **E1.9** [2026-11-04 20:56 SGT] These rules are for Experiment 1 only; they don't change the main app's rules (for example 3.4 and 3.8). *(was 12.9)*
- **E1.10** [2026-11-04 20:56 SGT] **Reset for testing:** one SQL line clears all Nudges and events (test data); the parent list is kept. Only the owner's database login can run it, not the app. *(was 12.10; scope agreed 4 Nov)*
- **E1.11** [2026-11-04 20:56 SGT] **Test mode:** windows are 2 minutes instead of 30, and the owner can send a Nudge to a parent now, to test with the facilitators. Switched off before the real start. *(new, agreed 4 Nov)*
- **E1.12** [2026-11-04 20:56 SGT] **Starting:** one SQL line sets the start date (owner provides it later). *(new, agreed 4 Nov)*
- **E1.13** [2026-11-04 21:19 SGT] **/stop** (owner, 4 Nov: a definitive signal). The bot confirms at once; no more Nudges or reminders. A Nudge still waiting at that moment, and every later one, ends as **Stopped**. The /stop time is recorded. *(changed 4 Nov)*
- SUPERSEDED [2026-11-04 21:19 SGT] **E1.13** [2026-11-04 20:56 SGT] No opt-out inside the bot (no /stop, no pause). *(was 12.11)*

## 5. Messages (DRAFT for the owner to edit)
[2026-11-04 21:34 SGT] **Owner's corrections (4 Nov):** new wording for "/start, no match" and "/stop"; every troubleshooting message ends with: "For any issues, questions, ask them inside the Experiment Whatsapp group. Thanks!" Older wording is in Git history.
[2026-11-04 20:56 SGT] Fixed wording, no AI. **Bold [brackets]** are filled in automatically or by the owner. Edit freely; the agreed text becomes the version the tests check.

| When | Message | Button |
|---|---|---|
| /start, handle matched | Hi [parent]! 👋 Welcome to Experiment 1. For 7 days I'll send you two short reminders a day to give [child] a hug, at [morning time] and [evening time]. Just tap ✅ Done after the hug. **What we record:** your name, [child]'s name, your Telegram handle, and when you get each reminder and tap ✅ Done, so we can learn whether reminders help. Your data stays in Singapore and is deleted 30 days after the experiment ends. | I agree |
| After I agree | Thank you, [parent]! You're all set. Your first reminder arrives on day 1 of the experiment. | none |
| /start, no match | Hi I can't find your Telegram handle on the list yet. Please drop your question inside the Experiment Whatsapp group. Thanks! | none |
| Morning Nudge | Good morning, [parent] ☀️ Time for a hug with [child]. Tap ✅ Done after your hug. | ✅ Done |
| Evening Nudge | Good evening, [parent] 🌙 Time for a hug with [child]. Tap ✅ Done after your hug. | ✅ Done |
| Reminder | A gentle reminder: a hug with [child] 🤗 Tap ✅ Done when it's done. | ✅ Done |
| ✅ Done (any time) | Thank you! ✅ Your hug with [child] is saved for this [morning / evening]. | none |
| ✅ Done tapped again | Already saved, thank you! | none |
| Typed words | Thanks! I only understand the ✅ Done button 🙂 For any issues, questions, ask them inside the Experiment Whatsapp group. Thanks! | none |
| /stop | You've stopped the hug reminders, [parent]. Thank you for taking part. | none |
| /start after /stop | You've already stopped the hug reminders. For any issues, questions, ask them inside the Experiment Whatsapp group. Thanks! | none |
| After day 7 (send: owner, 4 Nov) | That's the end of the 7 days. Thank you for taking part, [parent]! | none |

## 6. Data (Supabase)
[2026-11-04 21:05 SGT] **Where:** a new Supabase project called "experiments" (Singapore), shared by all experiments; Experiment 1's tables live in their own **schema `exp1`** (a separate drawer), so the names below become `exp1.parents`, `exp1.nudges`, `exp1.events`, `exp1.settings` and the view `exp1.results`; the owner's SQL lines become `exp1.start(...)`, `exp1.reset_test_data()`, `exp1.test_mode(...)` and `exp1.send_now(...)`. Discarding the experiment = dropping the schema. Set-up note: Supabase must be told to make schema `exp1` reachable by the app (one setting, part of the go-live guide).
[2026-11-04 20:56 SGT] Three tables, locked down (no public access; the app may only add rows and make the few edits listed). Times are stored with their time zone; a "day" is a Singapore date. **Real parent data is typed into Supabase by the owner, never committed to Git.**

**`exp1_parents`: who takes part** (personal data)

| Column | Meaning |
|---|---|
| id | Row number |
| parent_name | First name, e.g. Alex |
| child_name | Child's first name or nickname, e.g. Sam |
| telegram_handle | The public nickname, e.g. alexdemo (without @); unique; matched ignoring capitals. The parent can change it. |
| telegram_user_id | Filled at /start (unique); used to send messages |
| morning_time | 07:00, 08:00 or 09:00 |
| evening_time | 19:00, 20:00 or 21:00 |
| agreed_at | When the parent tapped I agree (empty = not active) |
| stopped_at | When the parent typed /stop (empty = active) [2026-11-04 21:34 SGT] |
| is_tester | Yes for a facilitator testing the bot; testers never appear in the results [2026-11-04 21:34 SGT] |
| created_at | When the row was added |

[2026-11-04 21:34 SGT] **Handle or user ID?** The handle is the name on the letterbox: chosen by the parent, changeable, and some people have none. The user ID is the postal address: a permanent number Telegram gives each account, needed to send messages. You provide the handle; at /start the bot uses it once to find the row and saves the user ID; from then on everything goes to the user ID, so a later handle change breaks nothing.

App may: add nothing (the owner adds parents); fill in `telegram_user_id`, `agreed_at` and `stopped_at` once.

**`exp1_nudges`: the 7-day data collection table** (one row per parent, per day, per Nudge: 10 × 7 × 2 = **140 rows**)

| Column | Meaning |
|---|---|
| id | Row number |
| parent_id | Which parent |
| day | Singapore date |
| slot | morning or evening |
| scheduled_for | When the Nudge was due |
| nudge_sent_at | When Telegram accepted the Nudge (empty if not sent or refused) |
| reminder_sent_at | When the reminder went (empty if not needed or refused) |
| done_at | When ✅ Done was first tapped (empty = no tap) |
| minutes_to_done | Minutes from Nudge to tap (worked out) |
| status | waiting, or one of the seven statuses of E1.6 (short codes) |

One row per parent, day and slot (no duplicates). App may: add a row; fill in the send times, `done_at` and `status` as the rules allow.

**`exp1_events`: the raw log** (add-only): every /start, I agree, Nudge, reminder, tap, refusal and typed message, with its time and Telegram ID (so nothing is counted twice).

**`exp1_settings`: one row**: the start date and test mode on or off (set only by the owner's SQL lines).

**For the owner:** a read-only view `exp1_results`, one line per parent with counts of each status and the average minutes to ✅ Done; downloadable as a spreadsheet from the Supabase table editor. Owner's SQL lines: `select exp1_start('YYYY-MM-DD');`, `select exp1_reset_test_data();`, `select exp1_test_mode(true);`, `select exp1_send_now('handle');`.

## 7. Planned tests (plain English, for the owner to confirm)
**Scheduling**
1. A morning Nudge is due at the parent's morning time on each of the 7 days, not before; the same for evening.
2. Nothing is sent before the start date or after day 7.
3. A parent who hasn't joined gets nothing, and the Nudge is recorded as **Not sent: hadn't started**.
4. A Nudge is sent once only, even if the scheduler runs twice in a minute; if the scheduler is a few minutes late, it is still sent (up to 30 minutes late).

**Reminder and statuses**
5. No ✅ Done after 30 minutes → exactly one reminder; ✅ Done within 30 minutes → no reminder.
6. [2026-11-04 21:19 SGT] ✅ Done at any time up to and including 30:00 → **Acted on Nudge** (checked at 0:10 and exactly 30:00).
7. ✅ Done after 30:00, up to and including 60:00 → **Did not act on Nudge. Acted on reminder** (checked at 30:01 and exactly 60:00), whichever message's button was tapped.
8. [2026-11-04 21:34 SGT] ✅ Done after 60:00 and before midnight → **Did not act on Nudge. Acted on reminder late** (checked at 60:01 and at 23:59).
9. [2026-11-04 21:34 SGT] No tap before midnight → **Did not act on Nudge. Did not act on reminder**. A tap after 60:00 but before midnight changes it to status 3, keeping both times; a tap after midnight (checked at 00:00 and the next day) is logged and changes nothing.
10. Telegram refuses a Nudge → **Not sent: Telegram refused**, no reminder.
11. Two taps, or the same tap sent twice by Telegram, count once.
12. [2026-11-04 21:34 SGT] A tap on yesterday's button is logged against yesterday's Nudge, never today's, and (being after midnight) changes nothing.

**Joining**
13. /start from a matching handle (any capitals, with or without @) links the parent; no match gets the "can't find you" reply and nothing else.
14. No Nudges before I agree; I agree is recorded once.

**Testing tools and safety**
15. Test mode uses 2-minute windows; "send now" sends a Nudge immediately.
16. [2026-11-04 21:34 SGT] Reset clears all Nudges and events, and the testers' joined, agreed and stopped state (so they can test /start again); it keeps the parent list, and real parents who already joined stay joined.
17. Only the owner's database login can start, reset or switch test mode; the app cannot; the public has no access.
18. Messages from anyone other than Telegram (wrong secret) are refused.

**/stop** ([2026-11-04 21:19 SGT])
19. /stop gets the confirmation reply; after it, no Nudges or reminders; the waiting Nudge and all later ones end as **Stopped**.
20. /start after /stop does not restart the Nudges; it gets the "already stopped" reply.
21. [2026-11-04 21:34 SGT] Testers never appear in the results view.
22. [2026-11-04 21:34 SGT] The start line, in one go, turns test mode off, clears the test data and sets the start date; it refuses if the experiment has already started.
23. [2026-11-04 21:34 SGT] The troubleshooting messages end with the WhatsApp group line.

## 8. Risks
- [2026-11-04 21:56 SGT] **From the privacy and security review (4 Nov). Fixed:** the real names from the whiteboard were removed from the files (made-up names in tests and examples); the bot keeps no number or handle of someone not on the list; error messages in Vercel's logs no longer contain a parent's Telegram number; the secret checks use a constant-time comparison. **Open, for the owner to decide:**
  - **Handle matching:** whoever holds a listed handle when typing /start is linked and sees the child's name in the welcome. A mistyped or reused handle could reach a stranger. Rec: double-check each handle with the parent before loading it.
  - **Deleting after 30 days is a manual step** (GO-LIVE.md, section 10). Rec: put it in your calendar on the start day.
  - **The scheduler secret sits in plain text** in Supabase's scheduler table, readable by anyone with database access (only you). Rec: accept for this pilot.
  - **The real names are still in Git history** (earlier commits of this repo, and the main repo's branch `claude/experiment-1-hug`). See the pull request for the clean-up.
- [2026-11-04 20:56 SGT] **Handles:** a parent with no Telegram handle, or a changed one, can't be matched; handled offline by the owner.
- [2026-11-04 20:56 SGT] **No opt-out in the bot:** a reviewer may ask how a parent stops; the answer today is "mute or block in Telegram, or ask the owner". Recorded as "not delivered" if blocked.
- [2026-11-04 20:56 SGT] **Personal data** (Singapore's Personal Data Protection Act (PDPA)): names, children's names and handles; no photos. Kept in Singapore, never in Git; deletion timing OPEN. Wipe the whiteboard photo.
- [2026-11-04 20:56 SGT] **Accounts before go-live:** a Telegram bot (BotFather), Vercel, Supabase Cron. Step-by-step guide to come with the build.

## 9. OPEN (owner to answer)
- [2026-11-04 21:05 SGT] **O1 and O2 answered (owner, 4 Nov):** a separate `experiments` repo, so the main app's drift test no longer applies; new Vercel project and new bot for Experiment 1; one shared "experiments" Supabase project with a schema per experiment (the free plan allows only 2 projects).
- SUPERSEDED [2026-11-04 21:05 SGT] [2026-11-04 20:56 SGT] **O1 Drift test.** The main app's drift test requires every document to be linked from `docs/SPEC.md`, so this folder fails it. Approve one change to the test: skip the "Experiment 1" folder, like `docs/archive/` (rule H5 needs your approval). Rec: yes.
- SUPERSEDED [2026-11-04 21:05 SGT] [2026-11-04 20:56 SGT] **O2 Separate accounts?** For "nothing comingled": a new Supabase project, a new Vercel project (reading only this folder) and a new Telegram bot, rather than sharing the main app's. Rec: yes, all three (free).
- [2026-11-04 21:19 SGT] **O3, O4 answered (owner, 4 Nov):** data deleted 30 days after the experiment ends; messages as drafted; the end-of-7-days message is sent. **O5:** tests 6 to 9 reworded with the owner's status names and exact boundaries; tests 19 and 20 added for /stop; to confirm.
- [2026-11-04 21:19 SGT] **New questions (4 Nov):**
  - [2026-11-04 21:34 SGT] **Q-A answered:** no name; troubleshooting messages point to the Experiment WhatsApp group instead. **Q-B:** taken as recommended (no restart after /stop), with an "already stopped" reply. **Q-C:** taken as recommended (testers marked `is_tester`); see section 10.
  - SUPERSEDED [2026-11-04 21:34 SGT] **Q-A Your name in messages:** what name should the "can't find you" and /stop messages show?
  - **Q-B /start after /stop:** rec: does **not** restart (a definitive signal); the parent contacts you instead.
  - **Q-C Facilitators while testing:** rec: add them as parents marked "tester"; the reset keeps them; the results view leaves them out; you delete them before the start date.
  - **Q-D Statuses 5 to 7:** confirm the names for the three "not sent / stopped" statuses.
  - **Later, before go-live:** the bot's name and one-line description (for BotFather).
- SUPERSEDED [2026-11-04 21:19 SGT] [2026-11-04 20:56 SGT] **O3 Deleting data:** when are parents' data deleted (for the consent message)? Rec: 30 days after the experiment ends.
- SUPERSEDED [2026-11-04 21:19 SGT] [2026-11-04 20:56 SGT] **O4 Message wording:** edit section 5; and send the "end of 7 days" message or not? Rec: send it.
- SUPERSEDED [2026-11-04 21:19 SGT] [2026-11-04 20:56 SGT] **O5 Tests:** confirm the 18 tests in section 7.
- [2026-11-04 20:56 SGT] Taken as recommended unless you say otherwise: you type the parents into Supabase from a template; times fixed for the 7 days; one child name per parent; the results view is enough (no daily summary message).

## 10. Testing with the facilitators (how-to, plain English)
[2026-11-04 21:34 SGT] Think of it as a dress rehearsal: same bot, same tables, but the clock runs fast and you press the buttons that start each scene.

**Before testing (once)**
1. In Supabase, open the table `exp1.parents` and add a row for each facilitator: their name, a pretend child's name, their Telegram handle, any morning and evening time, and tick **is_tester**.
2. In the SQL Editor, run `select exp1.test_mode(true);`. The windows become **2 minutes instead of 30**: a reminder after 2 minutes, the status settled after 4. Nothing is sent on schedule before the start date, so only the Nudges you send by hand go out.

**Running a test**
3. Each facilitator searches for the bot, types /start and taps **I agree**.
4. You send a Nudge now: `select exp1.send_now('alexdemo', 'morning');` (their handle, and morning or evening). It arrives within about a minute.
5. Agree a script so every status gets tried. For example:
   - facilitator A taps ✅ Done straight away (status 1)
   - B waits for the reminder, then taps (status 2)
   - C taps after 4 minutes (status 3)
   - D never taps (status 4)
   - E types /stop, then /start (Stopped, plus the "already stopped" reply)
   - F types a word instead of tapping (the "only the button" reply)
   - someone not on the list types /start (the "can't find your handle" reply)

**Watching the results**
6. In Supabase, open the **Table Editor**, schema `exp1`:
   - `nudges`: one line per Nudge, with the times and the status; refresh to see it change from waiting to its final status.
   - `events`: every message and tap, in order; the place to look when something seems wrong.
   - `results`: the one-line-per-parent summary. Testers are left out, so it should stay empty during testing.

**Resetting and testing again**
7. Run `select exp1.reset_test_data();`. It clears every Nudge and event and the testers' joined state, so they can start again from step 3. Your parent list stays, and real parents who already typed /start stay joined.

**Going live**
8. Delete the facilitators' rows (or keep them; they never show in the results).
9. Run `select exp1.start('YYYY-MM-DD');` with the first day. In one go it turns test mode off, clears test data and sets the date; the first Nudges go out at each parent's morning time that day. It refuses to run twice.
