# Experiments

[2026-11-04 21:05 SGT] Throwaway experiment apps for the Family Habit Builder (main repo: `WeiLieh/FamilyHabitBuilder`). Each experiment is a small, self-contained app in its own folder, run for a short time, then discarded. How the repo works and the rules Claude follows: [CLAUDE.md](CLAUDE.md).

## Experiments

| | Experiment 1 |
|---|---|
| **What** | Hug Nudges on Telegram: 10 parents, 7 days, a reminder after 30 minutes |
| **Folder** | [experiment-1/](experiment-1/SPEC.md) |
| **Status** | [2026-11-13 21:41 SGT] **Running** (owner, 13 Nov). Open: name columns removed from the live database for privacy, code still uses them ([PROGRESS.md](experiment-1/PROGRESS.md)). Earlier: [2026-11-05 12:29 SGT] Live in test mode: go-live steps 1 to 6 done; facilitator rehearsal next ([handoff pack](experiment-1/HANDOFF.md)). Earlier: [2026-11-04 22:09 SGT] Merged into `main`; not deployed yet. Go-live starts 5 Nov ([handoff pack](experiment-1/HANDOFF.md), [go-live guide](experiment-1/GO-LIVE.md)). Earlier: [2026-11-04 21:54 SGT] Built and tested; not deployed yet. SUPERSEDED [2026-11-04 22:09 SGT]. SUPERSEDED [2026-11-05 12:29 SGT] |
| **Supabase schema** | [2026-11-05 12:29 SGT] `exp1` in project `experiments` (Singapore). Earlier: not created yet. SUPERSEDED [2026-11-05 12:29 SGT] |
| **Bot / Vercel** | [2026-11-05 12:29 SGT] @FambuddyE1_bot; Vercel project `experiments` |
| **Started / ended** | [2026-11-13 21:41 SGT] Started (date in `exp1.settings`); not ended. Earlier: Not started. SUPERSEDED [2026-11-13 21:41 SGT] |

## Running the checks
[2026-11-04 21:54 SGT] `npm install` once, then `npm run check` (type check and app tests) before every commit. Database tests need a local PostgreSQL: `PGHOST=127.0.0.1 PGPORT=54330 PGUSER=postgres npm run test:db`.
