# Experiments

[2026-11-04 21:05 SGT] Throwaway experiment apps for the Family Habit Builder (main repo: `WeiLieh/FamilyHabitBuilder`). Each experiment is a small, self-contained app in its own folder, run for a short time, then discarded. How the repo works and the rules Claude follows: [CLAUDE.md](CLAUDE.md).

## Experiments

| | Experiment 1 |
|---|---|
| **What** | Hug Nudges on Telegram: 10 parents, 7 days, a reminder after 30 minutes |
| **Folder** | [experiment-1/](experiment-1/SPEC.md) |
| **Status** | [2026-11-04 22:09 SGT] Merged into `main`; not deployed yet. Go-live starts 5 Nov ([handoff pack](experiment-1/HANDOFF.md), [go-live guide](experiment-1/GO-LIVE.md)). Earlier: [2026-11-04 21:54 SGT] Built and tested; not deployed yet. SUPERSEDED [2026-11-04 22:09 SGT] |
| **Supabase schema** | `exp1` (not created yet) |
| **Started / ended** | Not started |

## Running the checks
[2026-11-04 21:54 SGT] `npm install` once, then `npm run check` (type check and app tests) before every commit. Database tests need a local PostgreSQL: `PGHOST=127.0.0.1 PGPORT=54330 PGUSER=postgres npm run test:db`.
