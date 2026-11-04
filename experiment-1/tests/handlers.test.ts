// =============================================================================
// experiment-1/tests/handlers.test.ts: the bot's conversations and the scheduler
//
// What it checks: what the bot replies and records when a parent types /start,
// taps I agree or ✅ Done, types /stop or types words, and what each scheduler
// run sends (spec rules E1.3 to E1.7, E1.13; tests 4, 10, 11, 13, 14, 19, 20).
// Uses the pretend database and Telegram from helpers/fakes.ts.
// =============================================================================
import { describe, expect, it } from "vitest";
import { handleTick, handleUpdate } from "../src/handlers.js";
import * as msg from "../src/messages.js";
import type { Parent, TelegramUpdate } from "../src/types.js";
import { FakeStore, FakeTelegram, makeClock } from "./helpers/fakes.js";
import { parent, settings, sgt, START } from "./helpers/builders.js";

// A fresh world for each test: one parent on the list who has NOT joined yet.
function world(parents: Parent[] = [parent({ telegramUserId: null, agreedAt: null })], startAt = sgt("2026-11-08 10:00")) {
  const clock = makeClock(startAt);
  const store = new FakeStore(settings(), parents, clock.now);
  const telegram = new FakeTelegram();
  return { clock, store, telegram, deps: { store, telegram, now: clock.now } };
}

let nextUpdateId = 1;
const text = (userId: number, words: string, username?: string): TelegramUpdate => ({
  update_id: nextUpdateId++,
  message: { from: username === undefined ? { id: userId } : { id: userId, username }, chat: { id: userId }, text: words },
});
const tap = (userId: number, data: string): TelegramUpdate => ({
  update_id: nextUpdateId++,
  callback_query: { id: `cb${nextUpdateId}`, from: { id: userId }, data },
});

describe("joining (tests 13, 14)", () => {
  it("[13] /start from the listed handle, in any capitals and with or without @, links the parent and shows the welcome with I agree", async () => {
    for (const handle of ["alexdemo", "AlexDemo", "@ALEXDEMO"]) {
      const w = world([parent({ telegramHandle: handle, telegramUserId: null, agreedAt: null })]);
      await handleUpdate(text(555, "/start", "alexDEMO"), w.deps);
      expect(w.store.parents[0]?.telegramUserId).toBe(555);
      expect(w.telegram.sent).toEqual([{ chatId: 555, text: msg.welcome(w.store.parents[0]!), button: { text: "I agree", data: "agree" } }]);
    }
  });

  it("[13] /start from a handle not on the list, or with no handle, gets the 'can't find you' reply and nothing else", async () => {
    const w = world();
    await handleUpdate(text(777, "/start", "someoneelse"), w.deps);
    await handleUpdate(text(778, "/start"), w.deps);
    expect(w.telegram.textsTo(777)).toEqual([msg.noMatch()]);
    expect(w.telegram.textsTo(778)).toEqual([msg.noMatch()]);
    expect(w.store.parents[0]?.telegramUserId).toBeNull();
  });

  it("keeps no Telegram number or handle of someone not on the list (they never agreed to anything)", async () => {
    const w = world();
    await handleUpdate(text(777, "/start", "someoneelse"), w.deps);
    await handleUpdate(text(777, "hello"), w.deps);
    await handleUpdate(tap(777, "agree"), w.deps);
    for (const e of w.store.events) {
      expect(e.telegramUserId ?? null).toBeNull();
      expect(JSON.stringify(e.detail ?? {})).not.toContain("someoneelse");
    }
    expect(w.store.events.map((e) => e.kind)).toEqual(["start_no_match", "text_no_match", "tap_no_match"]);
  });

  it("[14] I agree is recorded once, and the parent is told they're all set", async () => {
    const w = world();
    await handleUpdate(text(555, "/start", "alexdemo"), w.deps);
    await handleUpdate(tap(555, "agree"), w.deps);
    const first = w.store.parents[0]?.agreedAt;
    w.clock.set(sgt("2026-11-08 11:00"));
    await handleUpdate(tap(555, "agree"), w.deps);
    expect(first).toEqual(sgt("2026-11-08 10:00"));
    expect(w.store.parents[0]?.agreedAt).toEqual(first);
    expect(w.telegram.textsTo(555).slice(1)).toEqual([msg.allSet(w.store.parents[0]!), msg.allSet(w.store.parents[0]!)]);
    expect(w.telegram.answered).toHaveLength(2);
  });

  it("[14] a parent who hasn't agreed gets no Nudges: they are recorded as 'not started'", async () => {
    const w = world([parent({ agreedAt: null })], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    expect(w.store.nudges.map((n) => n.status)).toEqual(["not_started"]);
    expect(w.telegram.sent).toEqual([]);
  });
});

describe("Nudges, taps and the reminder (tests 4, 10, 11)", () => {
  it("sends the morning Nudge with a ✅ Done button, and a tap within 30 minutes earns 'Acted on Nudge' and a thank-you", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    const n = w.store.nudges[0]!;
    expect(w.telegram.sent).toEqual([{ chatId: 111, text: msg.morningNudge(parent()), button: { text: "✅ Done", data: `done:${n.id}` } }]);
    w.clock.set(sgt(`${START} 07:10`));
    await handleUpdate(tap(111, `done:${n.id}`), w.deps);
    expect(w.store.find(n.id).status).toBe("acted_on_nudge");
    expect(w.store.find(n.id).doneAt).toEqual(sgt(`${START} 07:10`));
    expect(w.telegram.textsTo(111).at(-1)).toBe(msg.thankYou(parent(), "morning"));
  });

  it("[4] sends a Nudge only once, even if the scheduler runs twice in the same minute", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    await handleTick(w.deps);
    expect(w.telegram.sent).toHaveLength(1);
  });

  it("sends one reminder at 30 minutes, then closes the Nudge at 60 as 'did not act'", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    w.clock.set(sgt(`${START} 07:30`));
    await handleTick(w.deps);
    await handleTick(w.deps);
    w.clock.set(sgt(`${START} 08:00`));
    await handleTick(w.deps);
    expect(w.telegram.textsTo(111)).toEqual([msg.morningNudge(parent()), msg.reminder(parent())]);
    expect(w.store.nudges[0]?.status).toBe("no_action");
  });

  it("[9] a tap after the Nudge closed but before midnight turns 'did not act' into 'acted on reminder late'", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    w.clock.set(sgt(`${START} 07:30`));
    await handleTick(w.deps);
    w.clock.set(sgt(`${START} 08:00`));
    await handleTick(w.deps);
    w.clock.set(sgt(`${START} 21:00`));
    await handleUpdate(tap(111, `done:${w.store.nudges[0]!.id}`), w.deps);
    expect(w.store.nudges[0]?.status).toBe("acted_late");
  });

  it("[12] a tap after midnight is logged but changes nothing", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    w.clock.set(sgt(`${START} 08:00`));
    await handleTick(w.deps);
    w.clock.set(sgt("2026-11-10 06:00"));
    await handleUpdate(tap(111, `done:${w.store.nudges[0]!.id}`), w.deps);
    expect(w.store.nudges[0]?.status).toBe("no_action");
    expect(w.store.events.some((e) => e.kind === "done_after_midnight")).toBe(true);
  });

  it("[10] a Nudge Telegram refuses is recorded as 'not delivered', with no reminder", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    w.telegram.refuse.add(111);
    await handleTick(w.deps);
    w.clock.set(sgt(`${START} 07:30`));
    await handleTick(w.deps);
    expect(w.store.nudges[0]?.status).toBe("not_delivered");
    expect(w.store.nudges[0]?.reminderAttemptedAt).toBeNull();
  });

  it("[11] two taps count once: the second gets 'Already saved'", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    const id = w.store.nudges[0]!.id;
    w.clock.set(sgt(`${START} 07:05`));
    await handleUpdate(tap(111, `done:${id}`), w.deps);
    w.clock.set(sgt(`${START} 07:40`));
    await handleUpdate(tap(111, `done:${id}`), w.deps);
    expect(w.store.nudges[0]?.doneAt).toEqual(sgt(`${START} 07:05`));
    expect(w.store.nudges[0]?.status).toBe("acted_on_nudge");
    expect(w.telegram.textsTo(111).at(-1)).toBe(msg.alreadySaved());
  });

  it("[11] the same tap delivered twice by Telegram is handled once", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    const update = tap(111, `done:${w.store.nudges[0]!.id}`);
    await handleUpdate(update, w.deps);
    await handleUpdate(update, w.deps);
    expect(w.telegram.textsTo(111)).toEqual([msg.morningNudge(parent()), msg.thankYou(parent(), "morning")]);
  });

  it("a tap on someone else's Nudge changes nothing", async () => {
    const other = parent({ id: 2, telegramHandle: "beademo", telegramUserId: 222, parentName: "Bea", childName: "Kai" });
    const w = world([parent(), other], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    const alexs = w.store.nudges.find((n) => n.parentId === 1)!;
    await handleUpdate(tap(222, `done:${alexs.id}`), w.deps);
    expect(w.store.find(alexs.id).status).toBe("waiting");
  });

  it("typed words get the 'only the button' reply; they never count as ✅ Done", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    await handleUpdate(text(111, "done!"), w.deps);
    expect(w.telegram.textsTo(111).at(-1)).toBe(msg.typedWords());
    expect(w.store.nudges[0]?.status).toBe("waiting");
  });
});

describe("/stop (tests 19, 20)", () => {
  it("[19] /stop gets the confirmation; the waiting Nudge and every later one end as 'Stopped', and nothing more is sent", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleTick(w.deps);
    w.clock.set(sgt(`${START} 07:05`));
    await handleUpdate(text(111, "/stop"), w.deps);
    expect(w.telegram.textsTo(111).at(-1)).toBe(msg.stopped(parent()));
    w.clock.set(sgt(`${START} 07:30`));
    await handleTick(w.deps);
    w.clock.set(sgt(`${START} 19:00`));
    await handleTick(w.deps);
    expect(w.store.nudges.map((n) => n.status)).toEqual(["stopped", "stopped"]);
    expect(w.telegram.textsTo(111)).toEqual([msg.morningNudge(parent()), msg.stopped(parent())]);
  });

  it("[20] /start after /stop does not restart: it gets the 'already stopped' reply", async () => {
    const w = world([parent()], sgt(`${START} 07:00`));
    await handleUpdate(text(111, "/stop"), w.deps);
    await handleUpdate(text(111, "/start", "alexdemo"), w.deps);
    expect(w.telegram.textsTo(111)).toEqual([msg.stopped(parent()), msg.alreadyStopped()]);
    expect(w.store.parents[0]?.stoppedAt).not.toBeNull();
  });
});

describe("the end of the experiment", () => {
  it("sends the end message once, after the parent's last Nudge of day 7 has closed", async () => {
    const w = world([parent()], sgt("2026-11-15 19:00"));
    // The other 13 Nudges already finished; only day 7's evening one is left.
    await handleTick(w.deps);
    w.store.nudges.filter((n) => n.status === "waiting" && n.slot === "morning").forEach((n) => { n.status = "no_action"; });
    w.store.nudges.filter((n) => n.day < "2026-11-15").forEach((n) => { n.status = "no_action"; });
    w.clock.set(sgt("2026-11-15 20:00"));
    await handleTick(w.deps);
    await handleTick(w.deps);
    expect(w.telegram.textsTo(111).filter((t) => t === msg.endOfExperiment(parent()))).toHaveLength(1);
  });
});
