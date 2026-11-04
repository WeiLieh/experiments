// =============================================================================
// experiment-1/tests/helpers/builders.ts: small helpers that build test data
//
// Why: most tests need "a parent" or "a Nudge" with one or two details changed.
// These helpers give a sensible default and let each test override only what
// matters to it, so the tests stay short and readable.
// =============================================================================
import type { Nudge, Parent, Settings } from "../../src/types.js";

// The first day of the experiment in every test: Monday 9 November 2026.
export const START = "2026-11-09";

// A moment in Singapore time, written the way people read it: "2026-11-09 07:00".
// Seconds are optional: "2026-11-09 07:30:01".
export function sgt(text: string): Date {
  const [day, time] = text.split(" ");
  return new Date(`${day}T${time}${time && time.length === 5 ? ":00" : ""}+08:00`);
}

// Settings for a running experiment that started on START, test mode off.
export function settings(overrides: Partial<Settings> = {}): Settings {
  return { startDate: START, testMode: false, ...overrides };
}

// One parent who has joined and agreed, with 7 am and 7 pm Nudges.
export function parent(overrides: Partial<Parent> = {}): Parent {
  return {
    id: 1,
    parentName: "Alex",
    childName: "Sam",
    telegramHandle: "alexdemo",
    telegramUserId: 111,
    morningTime: "07:00",
    eveningTime: "19:00",
    isTester: false,
    agreedAt: sgt("2026-11-08 10:00"),
    stoppedAt: null,
    endMessageSentAt: null,
    ...overrides,
  };
}

// One morning Nudge on the first day, already sent at 7:00 and still waiting.
export function nudge(overrides: Partial<Nudge> = {}): Nudge {
  return {
    id: 10,
    parentId: 1,
    day: START,
    slot: "morning",
    scheduledFor: sgt(`${START} 07:00`),
    isTest: false,
    nudgeAttemptedAt: sgt(`${START} 07:00`),
    nudgeSentAt: sgt(`${START} 07:00`),
    reminderAttemptedAt: null,
    reminderSentAt: null,
    doneAt: null,
    status: "waiting",
    ...overrides,
  };
}
