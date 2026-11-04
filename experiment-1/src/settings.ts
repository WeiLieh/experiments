// =============================================================================
// experiment-1/src/settings.ts: every adjustable number of Experiment 1, once
//
// Why: rule E1.8 says each number lives in one place. Change it here and the
// whole app follows. The allowed times are also checked by the database
// (sql/001_exp1.sql); tests/settings-sql.test.ts makes sure the two agree.
// =============================================================================

// How long the experiment runs, in Singapore days (rule E1.1).
export const EXPERIMENT_DAYS = 7;

// The times a parent's Nudges can be set to (rule E1.2).
export const MORNING_TIMES = ["07:00", "08:00", "09:00"] as const;
export const EVENING_TIMES = ["19:00", "20:00", "21:00"] as const;

// Minutes before the reminder, and again before the Nudge closes (rules E1.5, E1.6).
export const WINDOW_MINUTES = 30;

// The same windows in test mode, so facilitators don't wait half an hour (rule E1.11).
export const TEST_WINDOW_MINUTES = 2;

// If the scheduler reaches a Nudge more than this late, it is recorded, not sent.
export const MAX_LATE_SEND_MINUTES = 30;
