# Experiment 1: the hug pilot (DRAFT spec, not agreed)

[2026-11-04 21:05 SGT] **History only.** Moved from the main repo (`docs/experiment-1-spec.md` on the deleted branch `claude/experiment-1-hug`) into this repo. The current spec is [SPEC.md](SPEC.md). Rules 12.x here are E1.x there.

[2026-11-04 17:49 SGT] **Status: DRAFT for the owner's review. Nothing is built.** Building starts only after the owner answers the questions in section 9 and agrees this spec (`CLAUDE.md` practice 1). Rule IDs below are proposed and become permanent only when agreed.

## 1. Goal
- [2026-11-04 17:49 SGT] Run a very simplified version of the Family Habit Builder with **10 real parents for 7 days**, to learn three things early: (1) do parents act on a Nudge, (2) does a single reminder 30 minutes later help, and (3) do Telegram, Supabase, Vercel and the scheduler work together in real life (the "thin slice" the main plan already calls for).
- [2026-11-04 17:49 SGT] One habit only: **giving their child a hug** (the Triple P behaviour "Showing affection"). One loop only: Nudge → Action (hug) → tap ✅ Done → a short thank-you (Reward). No Investment step (no notes, no photos).

## 2. Users
- [2026-11-04 17:49 SGT] **10 parents**, chosen by the owner, each with **one child** (name or nickname) and a **Telegram account**. The owner provides each parent's first name, child's name, Telegram handle, morning time and evening time (the whiteboard list).
- [2026-11-04 17:49 SGT] **The owner** (the only operator) loads the parent list, starts the pilot, and reads the results.

## 3. How it works (plain English)
- [2026-11-04 18:10 SGT] **Owner's review (4 Nov), recorded:** sections 1, 2, 5, 6, 7 and 8 agreed; steps 3, 4 and 5 below agreed; changes to steps 1, 2 and 6 below. Rules 12.1 to 12.9 agreed except 12.3 and 12.6 (changed below); new requirement: a reset for testing (rule 12.10).
- [2026-11-04 18:10 SGT] **Step 1 changed, joining without links (owner):** no personal invite links. The owner tells the 10 parents the bot's name; each parent searches for it in Telegram and types /start. The bot matches the parent by their **Telegram handle** against `pilot_parents` (capitals and the @ ignored). If there is no match (no handle set, a typo, a changed handle), the bot replies that it doesn't recognise them and to contact the owner, and records it; nothing is sent until the owner fixes the row and the parent types /start again. Consent wording: still open (Q7).
- [2026-11-04 18:10 SGT] **Step 2 changed:** ✅ Done is the only button; **no "Not today" button** (owner).
- [2026-11-04 18:10 SGT] **Step 6 changed: no way to stop** (owner). Once started, Nudges run for the 7 days. Note: a parent can still mute or block the bot in Telegram itself; a blocked bot's messages are refused by Telegram and recorded as "not delivered".
1. SUPERSEDED [2026-11-04 18:10 SGT] [2026-11-04 17:49 SGT] **Joining.** Each parent gets a **personal invite link** from the owner (for example by WhatsApp). Tapping it opens the bot and START. The bot recognises the parent from the link, greets them by name, says in one plain sentence what is recorded and why, and asks them to agree. Agreeing activates their Nudges. (Why a link and not just the Telegram handle: Telegram does not let a bot message anyone first. The parent must open the bot once, see section 8.)
2. [2026-11-04 17:49 SGT] **Two Nudges a day for 7 days**, at the parent's own times: morning **7:00, 8:00 or 9:00 am**, evening **7:00, 8:00 or 9:00 pm** (Singapore time). Example: "Good morning, Alex! Time for a hug with Sam today 🤗" with a **✅ Done** button (and possibly 😴 Not today, question Q5).
3. [2026-11-04 17:49 SGT] **Waiting 30 minutes.** If the parent taps ✅ Done within 30 minutes, the bot thanks them and that Nudge is finished.
4. [2026-11-04 17:49 SGT] **One reminder.** If there is no ✅ Done after 30 minutes, the bot sends **one reminder** (with the same ✅ Done button).
5. [2026-11-04 17:49 SGT] **Then silence.** If there is still no ✅ Done (window: question Q4), the bot sends nothing more for that Nudge and records it as **no response**. A tap that arrives later is still recorded, labelled as late; it never changes the earlier result (rule 1.3, no fallbacks).
6. SUPERSEDED [2026-11-04 18:10 SGT] [2026-11-04 17:49 SGT] **Stopping.** A parent can type /stop at any time; the bot confirms and sends nothing more. The owner deletes a parent's data on request.

## 4. Proposed rules (section 12, IDs new)
- **12.1** [2026-11-04 17:49 SGT] The pilot runs for **7 Singapore days**, from a start date the owner sets, with **10 parents**, **one behaviour** (a hug), on **Telegram only**.
- **12.2** [2026-11-04 17:49 SGT] Each parent has **one morning time (7, 8 or 9 am)** and **one evening time (7, 8 or 9 pm)**, set by the owner; the same every day of the 7.
- **12.3** [2026-11-04 18:10 SGT] A parent receives Nudges only after **typing /start and being matched by their Telegram handle** (and agreeing, if Q7 keeps an agreement step); until then nothing is sent, and each Nudge due is recorded as "not started". *(changed by the owner, 4 Nov: no invite links)*
- SUPERSEDED [2026-11-04 18:10 SGT] **12.3** [2026-11-04 17:49 SGT] A parent receives Nudges only after **joining through their personal link and agreeing**; until then nothing is sent, and the pilot records "not joined".
- **12.4** [2026-11-04 17:49 SGT] Each Nudge has a **✅ Done** button. A ✅ Done tap **within 30 minutes** of the Nudge = "done on time".
- **12.5** [2026-11-04 17:49 SGT] No ✅ Done within 30 minutes → **exactly one reminder**. ✅ Done after the reminder, within its window = "done after reminder".
- **12.6** [2026-11-04 18:10 SGT] **Every Nudge ends with exactly one status** (owner's four, plus two Claude proposes; **to confirm**, see Q14 to Q16):
  1. **Done on time:** ✅ Done within 30 minutes of the Nudge.
  2. **Done after reminder sent:** ✅ Done after the reminder, within 30 minutes of it.
  3. **Responded after 30 mins:** ✅ Done after the reminder's 30 minutes had passed (more than 60 minutes after the Nudge). No more messages are sent.
  4. **Did not respond:** no ✅ Done at all.
  5. *(proposed)* **Not started:** the parent had not typed /start yet, so nothing could be sent.
  6. *(proposed)* **Not delivered:** Telegram refused the Nudge (for example, the parent blocked the bot).
  While a Nudge's 60 minutes are still running, it shows **waiting** (not a final status). A status can change only from "did not respond" to "responded after 30 mins", when a late tap arrives; both times are kept.
- SUPERSEDED [2026-11-04 18:10 SGT] **12.6** [2026-11-04 17:49 SGT] No ✅ Done by the end of the reminder window → **no more messages** for that Nudge; recorded as "no response". A later tap is recorded as "done late" next to it, never instead of it.
- **12.7** [2026-11-04 17:49 SGT] Every Nudge, reminder and tap is **recorded with its time**; a message Telegram refused to deliver is recorded as "send failed", never as sent (rule 1.3).
- **12.8** [2026-11-04 17:49 SGT] The pilot's numbers (times, 30 minutes, 7 days) live once in `src/settings.ts` (rule 1.4).
- **12.10** [2026-11-04 18:10 SGT] **Reset for testing** (owner): the owner can reset the pilot with code, to test with the facilitators before the real start. Scope and how it is run: Q17 to Q19.
- **12.11** [2026-11-04 18:10 SGT] **No opt-out inside the bot** (owner): no /stop or pause. A parent can still mute or block the bot in Telegram.
- **12.9** [2026-11-04 17:49 SGT] **Pilot-only rules.** The reminder (12.5) and two Nudges for one behaviour a day are allowed **in this pilot only**. They do not change the main app's rules 3.4 and 3.8 (at most one Nudge per behaviour a day, no repeat). The pilot's results feed that decision later.

## 5. Out of scope
- [2026-11-04 17:49 SGT] Choosing behaviours, changing times, photos, notes, the Web app, streaks and badges, Claude-written messages (fixed wording instead, question Q6), "delete my data" as a button (the owner deletes by hand on request), experiments with A/B options.

## 6. Data design (Supabase, draft)
[2026-11-04 17:49 SGT] Three new tables, separate from the main app's 14 so the pilot can be read, exported and later removed without touching them. Same lock-down as every migration: no public access; the server may only add rows and make the few edits listed. All times are stored as times with time zone; a "day" is a Singapore date.

[2026-11-04 18:10 SGT] **Changes from the owner's review:** `pilot_parents` drops `invite_code` and `stopped_at` (no links, no /stop); `telegram_handle` is now how a parent is matched, so it must be unique. `pilot_nudges.outcome` becomes `status` with the six values of rule 12.6 (plus "waiting"); `late_done_at` is no longer needed (a late tap sets `done_at` and the status "responded after 30 mins"). The tables below show the first draft.

**Table 1, `pilot_parents`: who takes part** (filled by the owner; personal data)

| Column | Meaning |
|---|---|
| id | Row number |
| parent_name | First name, e.g. Alex |
| child_name | Child's first name or nickname, e.g. Sam |
| telegram_handle | Expected handle, e.g. alexdemo (used to double-check, not to send) |
| invite_code | Random code in the personal link; unique; works once |
| telegram_user_id | Filled when the parent taps START (unique) |
| morning_time | 07:00, 08:00 or 09:00 |
| evening_time | 19:00, 20:00 or 21:00 |
| agreed_at | When the parent agreed (empty = not active) |
| stopped_at | When the parent typed /stop (empty = active) |
| created_at | When the row was added |

**Table 2, `pilot_nudges`: the 7-day data collection table** (one row per parent, per day, per Nudge: 10 × 7 × 2 = **140 rows**)

| Column | Meaning |
|---|---|
| id | Row number |
| parent_id | Which parent |
| day | Singapore date, e.g. 2026-11-09 |
| slot | morning or evening |
| scheduled_for | When the Nudge was due, e.g. 07:00 |
| nudge_sent_at | When Telegram accepted the Nudge (empty if it failed) |
| reminder_sent_at | When the reminder went (empty = no reminder needed or failed) |
| done_at | When ✅ Done was tapped (empty = no tap) |
| minutes_to_done | Minutes from Nudge to tap (worked out, not typed) |
| outcome | done on time · done after reminder · no response · not today (if Q5 adds it) · send failed · not joined |
| late_done_at | A tap after the windows closed (kept separate) |

**Table 3, `pilot_events`: the raw log** (add-only; every update from Telegram and every message sent, with its Telegram ID so nothing is counted twice). Table 2 is the tidy summary; table 3 is the evidence behind it.

**For the owner:** a read-only view `pilot_results` with one line per parent: Nudges sent, done on time, done after reminder, no response, average minutes to done. It can be downloaded as a spreadsheet from the Supabase table editor.

## 7. Definition of done
- [2026-11-04 17:49 SGT] Tests written first and passing for: who is due a Nudge or reminder at a given minute, the 30-minute windows, each outcome, late taps, duplicate taps (counted once), stopped and not-joined parents, failed sends; database tests for the three tables and their lock-down. `npm run check` passes.
- [2026-11-04 17:49 SGT] Deployed: the bot answers START, a test parent (the owner) gets a Nudge, a reminder and a thank-you on their own phone, and the rows appear in Supabase.
- [2026-11-04 17:49 SGT] Both review agents have run (habit H3); real parent data is entered by the owner in Supabase, **never committed to Git**.

## 8. Risks and constraints
- [2026-11-04 17:49 SGT] **Telegram handles can't be messaged first.** A bot can only message someone who has opened it. Each parent must tap their link (or open the bot and press START) once. A parent who never does gets nothing; the pilot records "not joined".
- [2026-11-04 17:49 SGT] **Privacy.** Names, children's names and Telegram handles are personal data (Singapore's Personal Data Protection Act (PDPA)). No photos are collected. The data stays in Singapore (Supabase), is never put in Git, and is deleted on request. The whiteboard photo itself should be wiped and not shared.
- [2026-11-04 17:49 SGT] **Timing accuracy.** Supabase Cron wakes the app every minute; a Nudge goes out within about a minute of its time.
- [2026-11-04 17:49 SGT] **Accounts needed before go-live:** a Telegram bot (BotFather), a Vercel project, and Supabase Cron switched on. The owner creates them, with step-by-step help.

## 9. Questions for the owner
[2026-11-04 18:10 SGT] **Answered (4 Nov):** Q2 no links, match by Telegram handle; Q4 30 minutes after the reminder (step 5 agreed); Q5 no "Not today" button. Still open: Q1, Q3, Q6, Q7, Q8 (must answer before building), Q9 to Q13, and the new Q14 to Q19 below. The owner will answer the open ones later.

**New questions (4 Nov)**
- **Q14 Statuses.** Confirm the six statuses in rule 12.6: your four, plus "not started" and "not delivered". Rec: keep all six, so every one of the 140 rows has an honest answer.
- **Q15 "Responded after 30 mins".** Does it mean a tap after the reminder's 30 minutes (60+ minutes after the Nudge), as written in 12.6? The reminder goes at exactly 30 minutes, so any earlier tap is "done on time" or "done after reminder sent".
- **Q16 How late is too late?** A ✅ Done button stays tappable for days. Rec: count a late tap for its Nudge until the pilot ends, with its real time.
- **Q17 What a reset clears.** Rec: two options: (a) **test data only**: Nudges and events cleared, the parent list kept; (b) **everything**: also unlinks parents' Telegram accounts, so they type /start again.
- **Q18 Test mode.** Facilitators can't wait until 7 am. Rec: a test mode where you send a Nudge now and the windows are 2 minutes instead of 30, switched off before the real start.
- **Q19 How you run the reset.** Rec: one line you paste into the Supabase SQL Editor (as you did for the earlier migrations), for example `select pilot_reset('test data');`. Claude can also run it for you.

[2026-11-04 17:49 SGT] Answers will be recorded here as dated notes. "Rec" = Claude's recommendation.

**Must answer before building**
- **Q1 Where it lives.** A small separate module in this repo (own folder, spec, tables; a new module needs your approval, rule S2), or part of the main app's modules? Rec: separate module, so the main app's rules stay untouched and the pilot can be removed cleanly. Name: "Experiment 1" can be confused with the Experiments module (A/B tests); rec "Hug pilot" (folder `hug-pilot`).
- **Q2 Joining.** Personal invite links sent by you (rec), or parents find the bot by name and we match their Telegram handle? Handles can change and be misspelt; links can't.
- **Q3 What counts as "affirmative".** Only the ✅ Done button (rec, clean data), or also typed words like "done" or "yes"?
- **Q4 Reminder window.** After the reminder, how long before "no response"? Rec: 30 minutes (so a Nudge closes 60 minutes after it was sent).
- **Q5 A "Not today" button?** Without one, a parent who decides to skip still gets the reminder. Rec: add 😴 Not today: no reminder, recorded as "not today".
- **Q6 Wording.** Fixed messages (rec, no AI) for: welcome and agreement, morning Nudge, evening Nudge, reminder, thank-you, /stop. You write them, or Claude drafts for your edit?
- **Q7 Consent.** Is one plain sentence plus an "I agree" button at START enough for this pilot? Rec: yes, plus /stop, and deletion by you on request within the 7 days.
- **Q8 Dates.** One start date for all 10 parents (rec), and which date? Same times on weekends (rec: yes)?

**Can take the recommendation unless you say otherwise**
- **Q9 Data entry.** You type the 10 parents into Supabase yourself, from a template Claude provides (rec, keeps personal data out of Git), or send them to Claude in chat?
- **Q10 Check the whiteboard reading:** REDACTED [2026-11-04 21:55 SGT]: this line listed real parents' and children's names and Telegram handles from the whiteboard; personal data must never be in Git (repo CLAUDE.md rule 4).
- **Q11 Changing times.** Fixed by you for the 7 days (rec), or can parents change them?
- **Q12 One child per parent?** Rec: one name field; a parent with two children can be entered as "Sam and Max".
- **Q13 Results.** Is the `pilot_results` view (one line per parent) plus the 140-row table enough, or do you want a daily summary message to yourself on Telegram?
