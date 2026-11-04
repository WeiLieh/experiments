// =============================================================================
// experiment-1/src/rules.ts: the timing rules (the "brain")
//
// Why: these functions only decide; they never send or save anything. Given
// the time now and what is in the tables, they say which Nudges are due, which
// need a reminder or closing, and which status a ✅ Done tap earns. Keeping the
// decisions apart from Telegram and the database makes them easy to test
// (tests/rules.test.ts). Rules E1.1 to E1.6 and E1.11 in SPEC.md.
// =============================================================================
import { EVENING_TIMES, EXPERIMENT_DAYS, MAX_LATE_SEND_MINUTES, MORNING_TIMES, TEST_WINDOW_MINUTES, WINDOW_MINUTES } from "./settings.js";
import { addDays, atSgt, minutesBetween, sgtDay } from "./time.js";
import type { FollowUp, NewNudge, Nudge, Parent, Settings, Slot, Status } from "./types.js";

// The reminder window in minutes: 30 normally, 2 in test mode.
export function windowMinutes(settings: Settings): number {
  return settings.testMode ? TEST_WINDOW_MINUTES : WINDOW_MINUTES;
}

// The parent's time for a slot, or null if it isn't one of the allowed times
// (the database refuses other times anyway; this is a second line of defence).
function timeFor(parent: Parent, slot: Slot): string | null {
  const time = slot === "morning" ? parent.morningTime : parent.eveningTime;
  const allowed: readonly string[] = slot === "morning" ? MORNING_TIMES : EVENING_TIMES;
  return allowed.includes(time) ? time : null;
}

// How a new Nudge starts: sent normally, or recorded as not started or stopped.
function startingStatus(parent: Parent): Status {
  if (parent.stoppedAt) return "stopped";
  if (!parent.telegramUserId || !parent.agreedAt) return "not_started";
  return "waiting";
}

// Which Nudges are due now and don't exist yet. One per parent, day and slot,
// for each day from the start date to today (at most 7), once its time has come.
export function planCreates(now: Date, settings: Settings, parents: Parent[], nudges: Nudge[]): NewNudge[] {
  if (!settings.startDate) return []; // not started yet: nothing on schedule
  const today = sgtDay(now);
  const exists = new Set(nudges.filter((n) => !n.isTest).map((n) => `${n.parentId}|${n.day}|${n.slot}`));
  const creates: NewNudge[] = [];
  for (let i = 0; i < EXPERIMENT_DAYS; i++) {
    const day = addDays(settings.startDate, i);
    if (day > today) break; // future days: not yet
    for (const parent of parents) {
      for (const slot of ["morning", "evening"] as const) {
        const time = timeFor(parent, slot);
        if (!time) continue;
        const scheduledFor = atSgt(day, time);
        if (scheduledFor > now || exists.has(`${parent.id}|${day}|${slot}`)) continue;
        creates.push({ parentId: parent.id, day, slot, scheduledFor, status: startingStatus(parent) });
      }
    }
  }
  return creates;
}

// What to do next with each waiting Nudge: send it, remind, close, or record a
// problem; plus the end-of-experiment message for parents whose last Nudge is done.
export function planFollowUps(now: Date, settings: Settings, parents: Parent[], nudges: Nudge[]): FollowUp[] {
  const window = windowMinutes(settings);
  const actions: FollowUp[] = [];
  for (const n of nudges) {
    if (n.status !== "waiting") continue;
    if (!n.nudgeAttemptedAt) {
      // Not sent yet: send it, unless the scheduler got here more than 30 minutes late.
      const late = minutesBetween(n.scheduledFor, now);
      actions.push({ kind: late <= MAX_LATE_SEND_MINUTES ? "send" : "too_late", nudgeId: n.id });
    } else if (!n.nudgeSentAt) {
      // Sending started but Telegram's answer never got saved: after the full
      // 60 minutes, record it as not delivered rather than guess.
      if (minutesBetween(n.nudgeAttemptedAt, now) >= 2 * window) actions.push({ kind: "unconfirmed", nudgeId: n.id });
    } else if (!n.doneAt) {
      const elapsed = minutesBetween(n.nudgeSentAt, now);
      if (elapsed >= 2 * window) actions.push({ kind: "close", nudgeId: n.id });
      else if (elapsed >= window && !n.reminderAttemptedAt) actions.push({ kind: "remind", nudgeId: n.id });
    }
  }
  // The end message: once, to active parents, after their day-7 evening Nudge has finished.
  if (settings.startDate) {
    const lastDay = addDays(settings.startDate, EXPERIMENT_DAYS - 1);
    for (const p of parents) {
      if (!p.agreedAt || p.stoppedAt || p.endMessageSentAt) continue;
      const last = nudges.find((n) => !n.isTest && n.parentId === p.id && n.day === lastDay && n.slot === "evening");
      if (last && last.status !== "waiting") actions.push({ kind: "end_message", parentId: p.id });
    }
  }
  return actions;
}

// The status a ✅ Done tap earns (rule E1.6), counted from when the Nudge was
// sent. Null means "no change": the Nudge was never sent, or it is past midnight.
export function statusForTap(nudge: Nudge, tapAt: Date, window: number): Status | null {
  if (!nudge.nudgeSentAt) return null;
  if (sgtDay(tapAt) !== nudge.day) return null; // midnight has passed: logged only
  const elapsed = minutesBetween(nudge.nudgeSentAt, tapAt);
  if (elapsed <= window) return "acted_on_nudge";
  if (elapsed <= 2 * window) return "acted_on_reminder";
  return "acted_late";
}
