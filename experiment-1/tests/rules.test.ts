// =============================================================================
// experiment-1/tests/rules.test.ts: the timing rules of Experiment 1
//
// What it checks: the "brain" decisions, with no Telegram or database involved:
// when each Nudge is due, when the reminder goes, when a Nudge closes, and
// which status a tap earns (spec rules E1.1 to E1.6, E1.11; tests 1 to 12, 15).
// Test numbers in brackets match section 7 of experiment-1/SPEC.md.
// =============================================================================
import { describe, expect, it } from "vitest";
import { planCreates, planFollowUps, statusForTap, windowMinutes } from "../src/rules.js";
import { nudge, parent, settings, sgt, START } from "./helpers/builders.js";

// The 7 days of the experiment in the tests: 9 to 15 November 2026.
const DAYS = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"];

describe("when Nudges are due (tests 1 to 3)", () => {
  it("[1] creates the morning Nudge at the parent's morning time on each of the 7 days, and not a minute before", () => {
    for (const day of DAYS) {
      // Rows for earlier days already exist, so only today's morning is new.
      const earlier = DAYS.filter((d) => d < day).flatMap((d, i) => [
        nudge({ id: 100 + i * 2, day: d, slot: "morning" }),
        nudge({ id: 101 + i * 2, day: d, slot: "evening" }),
      ]);
      expect(planCreates(sgt(`${day} 06:59:59`), settings(), [parent()], earlier)).toEqual([]);
      expect(planCreates(sgt(`${day} 07:00`), settings(), [parent()], earlier)).toEqual([
        { parentId: 1, day, slot: "morning", scheduledFor: sgt(`${day} 07:00`), status: "waiting" },
      ]);
    }
  });

  it("[1] creates the evening Nudge at the parent's own evening time (8 pm here)", () => {
    const p = parent({ eveningTime: "20:00" });
    const morning = nudge({ slot: "morning" });
    expect(planCreates(sgt(`${START} 19:59`), settings(), [p], [morning])).toEqual([]);
    expect(planCreates(sgt(`${START} 20:00`), settings(), [p], [morning])).toEqual([
      { parentId: 1, day: START, slot: "evening", scheduledFor: sgt(`${START} 20:00`), status: "waiting" },
    ]);
  });

  it("[2] creates nothing before the start date, after day 7, or when no start date is set", () => {
    expect(planCreates(sgt("2026-11-08 21:00"), settings(), [parent()], [])).toEqual([]);
    const all7Days = DAYS.flatMap((d, i) => [
      nudge({ id: 100 + i * 2, day: d, slot: "morning" }),
      nudge({ id: 101 + i * 2, day: d, slot: "evening" }),
    ]);
    expect(planCreates(sgt("2026-11-16 21:00"), settings(), [parent()], all7Days)).toEqual([]);
    expect(planCreates(sgt(`${START} 21:00`), settings({ startDate: null }), [parent()], [])).toEqual([]);
  });

  it("[3] records a Nudge as 'not started' for a parent who hasn't joined or agreed, and as 'stopped' after /stop", () => {
    const notJoined = parent({ id: 2, telegramUserId: null, agreedAt: null });
    const notAgreed = parent({ id: 3, agreedAt: null });
    const stopped = parent({ id: 4, stoppedAt: sgt("2026-11-08 12:00") });
    const at = sgt(`${START} 07:00`);
    expect(planCreates(at, settings(), [notJoined, notAgreed, stopped], []).map((c) => [c.parentId, c.status])).toEqual([
      [2, "not_started"],
      [3, "not_started"],
      [4, "stopped"],
    ]);
  });

  it("[4] never creates the same Nudge twice, even if the scheduler runs twice in a minute", () => {
    const existing = nudge({ slot: "morning" });
    expect(planCreates(sgt(`${START} 07:00`), settings(), [parent()], [existing])).toEqual([]);
  });

  it("ignores a test Nudge when deciding whether today's real Nudge exists", () => {
    const testRow = nudge({ isTest: true, slot: "morning" });
    expect(planCreates(sgt(`${START} 07:00`), settings(), [parent()], [testRow])).toHaveLength(1);
  });
});

describe("sending, reminding and closing (tests 4, 5, 15)", () => {
  const unsent = nudge({ nudgeAttemptedAt: null, nudgeSentAt: null });

  it("[4] sends a new Nudge, even if the scheduler is up to 30 minutes late", () => {
    expect(planFollowUps(sgt(`${START} 07:00`), settings(), [parent()], [unsent])).toEqual([{ kind: "send", nudgeId: 10 }]);
    expect(planFollowUps(sgt(`${START} 07:30`), settings(), [parent()], [unsent])).toEqual([{ kind: "send", nudgeId: 10 }]);
  });

  it("[4] gives up on a Nudge the scheduler reached more than 30 minutes late (recorded, never sent)", () => {
    expect(planFollowUps(sgt(`${START} 07:30:01`), settings(), [parent()], [unsent])).toEqual([{ kind: "too_late", nudgeId: 10 }]);
  });

  it("[5] sends exactly one reminder 30 minutes after the Nudge when there is no ✅ Done", () => {
    expect(planFollowUps(sgt(`${START} 07:29:59`), settings(), [parent()], [nudge()])).toEqual([]);
    expect(planFollowUps(sgt(`${START} 07:30`), settings(), [parent()], [nudge()])).toEqual([{ kind: "remind", nudgeId: 10 }]);
    const reminded = nudge({ reminderAttemptedAt: sgt(`${START} 07:30`), reminderSentAt: sgt(`${START} 07:30`) });
    expect(planFollowUps(sgt(`${START} 07:45`), settings(), [parent()], [reminded])).toEqual([]);
  });

  it("[5] sends no reminder when ✅ Done came within 30 minutes", () => {
    const done = nudge({ doneAt: sgt(`${START} 07:10`), status: "acted_on_nudge" });
    expect(planFollowUps(sgt(`${START} 07:30`), settings(), [parent()], [done])).toEqual([]);
  });

  it("counts the windows from when the Nudge was actually sent", () => {
    const sentLate = nudge({ nudgeAttemptedAt: sgt(`${START} 07:20`), nudgeSentAt: sgt(`${START} 07:20`) });
    expect(planFollowUps(sgt(`${START} 07:49`), settings(), [parent()], [sentLate])).toEqual([]);
    expect(planFollowUps(sgt(`${START} 07:50`), settings(), [parent()], [sentLate])).toEqual([{ kind: "remind", nudgeId: 10 }]);
  });

  it("[9] closes a Nudge with no tap 60 minutes after it was sent", () => {
    const reminded = nudge({ reminderAttemptedAt: sgt(`${START} 07:30`), reminderSentAt: sgt(`${START} 07:30`) });
    expect(planFollowUps(sgt(`${START} 07:59:59`), settings(), [parent()], [reminded])).toEqual([]);
    expect(planFollowUps(sgt(`${START} 08:00`), settings(), [parent()], [reminded])).toEqual([{ kind: "close", nudgeId: 10 }]);
  });

  it("records a Nudge whose sending was started but never confirmed as not delivered, after 60 minutes", () => {
    const stuck = nudge({ nudgeSentAt: null });
    expect(planFollowUps(sgt(`${START} 07:59`), settings(), [parent()], [stuck])).toEqual([]);
    expect(planFollowUps(sgt(`${START} 08:00`), settings(), [parent()], [stuck])).toEqual([{ kind: "unconfirmed", nudgeId: 10 }]);
  });

  it("[15] uses 2-minute windows in test mode: reminder at 2 minutes, closed at 4", () => {
    const test = settings({ testMode: true });
    expect(windowMinutes(test)).toBe(2);
    expect(windowMinutes(settings())).toBe(30);
    expect(planFollowUps(sgt(`${START} 07:02`), test, [parent()], [nudge()])).toEqual([{ kind: "remind", nudgeId: 10 }]);
    const reminded = nudge({ reminderAttemptedAt: sgt(`${START} 07:02`), reminderSentAt: sgt(`${START} 07:02`) });
    expect(planFollowUps(sgt(`${START} 07:04`), test, [parent()], [reminded])).toEqual([{ kind: "close", nudgeId: 10 }]);
  });

  it("leaves finished Nudges alone", () => {
    const finished = ["acted_on_nudge", "no_action", "not_started", "not_delivered", "stopped"] as const;
    for (const status of finished) {
      expect(planFollowUps(sgt(`${START} 09:00`), settings(), [parent()], [nudge({ status })])).toEqual([]);
    }
  });
});

describe("which status a ✅ Done tap earns (tests 6 to 9, 12)", () => {
  const sent7 = nudge(); // sent at 7:00 on the first day
  const tapAt = (time: string) => statusForTap(sent7, sgt(`${START} ${time}`), 30);

  it("[6] up to and including 30:00 after the Nudge: Acted on Nudge", () => {
    expect(tapAt("07:00:10")).toBe("acted_on_nudge");
    expect(tapAt("07:30:00")).toBe("acted_on_nudge");
  });

  it("[7] after 30:00, up to and including 60:00: Did not act on Nudge. Acted on reminder", () => {
    expect(tapAt("07:30:01")).toBe("acted_on_reminder");
    expect(tapAt("08:00:00")).toBe("acted_on_reminder");
  });

  it("[8] after 60:00 and before midnight: Did not act on Nudge. Acted on reminder late", () => {
    expect(tapAt("08:00:01")).toBe("acted_late");
    expect(tapAt("23:59:59")).toBe("acted_late");
  });

  it("[9] [12] at or after midnight: no status change (the tap is only logged)", () => {
    expect(statusForTap(sent7, sgt("2026-11-10 00:00"), 30)).toBeNull();
    expect(statusForTap(sent7, sgt("2026-11-11 09:00"), 30)).toBeNull();
  });

  it("a Nudge that was never sent can't earn a status from a tap", () => {
    expect(statusForTap(nudge({ nudgeSentAt: null }), sgt(`${START} 07:05`), 30)).toBeNull();
  });
});

describe("the end-of-experiment message", () => {
  const day7Evening = (status: "waiting" | "no_action") =>
    nudge({
      id: 20, day: "2026-11-15", slot: "evening", status,
      scheduledFor: sgt("2026-11-15 19:00"), nudgeAttemptedAt: sgt("2026-11-15 19:00"), nudgeSentAt: sgt("2026-11-15 19:00"),
    });

  it("goes once to each active parent after their last Nudge of day 7 has finished", () => {
    expect(planFollowUps(sgt("2026-11-15 20:01"), settings(), [parent()], [day7Evening("no_action")])).toEqual([
      { kind: "end_message", parentId: 1 },
    ]);
  });

  it("waits while the last Nudge is still open, and never goes twice or to a stopped parent", () => {
    expect(planFollowUps(sgt("2026-11-15 19:10"), settings(), [parent()], [day7Evening("waiting")])).toEqual([]);
    const already = parent({ endMessageSentAt: sgt("2026-11-15 20:01") });
    expect(planFollowUps(sgt("2026-11-15 20:05"), settings(), [already], [day7Evening("no_action")])).toEqual([]);
    const stopped = parent({ stoppedAt: sgt("2026-11-12 08:00") });
    expect(planFollowUps(sgt("2026-11-15 20:05"), settings(), [stopped], [day7Evening("no_action")])).toEqual([]);
  });
});
