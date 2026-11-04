# Experiment 1: progress notes

One entry per session, newest first: Done / In progress / Next steps / Blockers.

## [2026-11-04 21:54 SGT] Session 1, continued: built and tested
### Done
- [2026-11-04 21:54 SGT] Spec agreed in full (owner: "confirm everything").
- [2026-11-04 21:54 SGT] Built test-first: the timing rules (`src/rules.ts`), the bot's conversations and the every-minute scheduler (`src/handlers.ts`), the wording (`src/messages.ts`), the two locked web addresses (`api/telegram.ts`, `api/tick.ts`), the Supabase and Telegram connectors, and the database (`sql/001_exp1.sql`: tables, narrow app functions, the owner's one-line commands, the locks).
- [2026-11-04 21:54 SGT] Tests: 57 app tests (`npm run check`) and 53 database checks (`npm run test:db`), all passing; the database checks were shown to fail when a lock was deliberately loosened.
- [2026-11-04 21:54 SGT] Go-live guide ([GO-LIVE.md](GO-LIVE.md)), scheduler set-up (`sql/002_scheduler.sql`), parents import template (`parents-template.csv`).
### In progress
- [2026-11-04 21:54 SGT] None.
### Next steps
- [2026-11-04 21:54 SGT] Owner: merge the pull requests, then follow GO-LIVE.md (Supabase project, bot, Vercel, webhook, scheduler, a first test on your phone), test with the facilitators, load the 10 parents, start.
### Blockers
- [2026-11-04 21:54 SGT] None in the code. Not yet proven on the real services: the first test on the owner's phone (GO-LIVE step 6) is the proof.

## [2026-11-04 21:05 SGT] Session 1: spec and repo set-up
### Done
- [2026-11-04 21:05 SGT] Spec written with the owner over three rounds (main repo, 4 Nov) and moved here: [SPEC.md](SPEC.md); drafts and answers in [SPEC-draft-history.md](SPEC-draft-history.md).
- [2026-11-04 21:05 SGT] Repo set up for many throwaway experiments: `CLAUDE.md` (short rules), `README.md` (list of experiments), `.gitignore`. Decisions: one folder per experiment, no spaces in names; one shared Supabase project with a schema per experiment; one Vercel project and one bot per experiment; a discard checklist.
- [2026-11-04 21:05 SGT] The draft branch in the main repo was deleted locally; GitHub refused the remote deletion from this session, so the owner deletes `claude/experiment-1-hug` on GitHub.
### In progress
- [2026-11-04 21:05 SGT] None.
### Next steps
- [2026-11-04 21:34 SGT] Owner: midnight cut-off for status 3, new /stop and no-match wording, WhatsApp group line in troubleshooting messages; testing how-to added (SPEC section 10). Waiting on: confirming statuses 5 to 7 (Q-D) and the 23 tests (O5).
- [2026-11-04 21:19 SGT] Owner answered O3 (delete 30 days after the end) and O4 (messages as drafted, end message sent); renamed the statuses and added /stop. Waiting on: confirming tests (O5) and Q-A to Q-D in [SPEC.md](SPEC.md), section 9.
- [2026-11-04 21:05 SGT] Owner: answer O3 (when data is deleted), O4 (edit the messages in section 5; send an "end of 7 days" message?), O5 (confirm the 18 tests) in [SPEC.md](SPEC.md), section 9.
- [2026-11-04 21:05 SGT] Then Claude: set up the tools (TypeScript, tests, one lockfile), write the tests first, then build; then a step-by-step go-live guide (new Supabase project "experiments", Vercel project, Telegram bot, Supabase Cron).
### Blockers
- [2026-11-04 21:05 SGT] Building waits for O3 to O5. The start date comes later from the owner.
