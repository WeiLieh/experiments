// =============================================================================
// experiment-1/tests/helpers/fakes.ts: pretend database and pretend Telegram
//
// Why: the bot's handlers talk to a Store (the database) and to Telegram. In
// tests we swap both for simple in-memory stand-ins, like a flight simulator:
// same controls, no real plane. The FakeStore follows the same rules as the
// real database functions in experiment-1/sql/001_exp1.sql (which have their
// own tests in experiment-1/tests/db.test.sql), so the handlers can be tested
// quickly and without accounts.
// =============================================================================
import type { Button, EventRecord, NewNudge, Nudge, Parent, SendResult, Settings, Status, Store, TelegramApi } from "../../src/types.js";

// Telegram handles are matched ignoring capitals and a leading @.
const normalise = (handle: string) => handle.replace(/^@/, "").toLowerCase();

export class FakeStore implements Store {
  settings: Settings;
  parents: Parent[];
  nudges: Nudge[] = [];
  events: EventRecord[] = [];
  private nextId = 1000;

  constructor(settings: Settings, parents: Parent[], private clock: () => Date) {
    this.settings = settings;
    this.parents = parents.map((p) => ({ ...p }));
  }

  async getSettings() { return { ...this.settings }; }
  async listParents() { return this.parents.map((p) => ({ ...p })); }
  async listNudges() { return this.nudges.map((n) => ({ ...n })); }
  async getNudge(id: number) { const n = this.nudges.find((x) => x.id === id); return n ? { ...n } : null; }
  async findParentByUserId(userId: number) { const p = this.parents.find((x) => x.telegramUserId === userId); return p ? { ...p } : null; }
  async hasUpdate(updateId: number) { return this.events.some((e) => e.telegramUpdateId === updateId); }

  async linkParent(handle: string, userId: number) {
    const p = this.parents.find((x) => normalise(x.telegramHandle) === normalise(handle) && (x.telegramUserId === null || x.telegramUserId === userId));
    if (!p) return null;
    p.telegramUserId = userId;
    return { ...p };
  }

  async agree(userId: number) {
    const p = this.parents.find((x) => x.telegramUserId === userId);
    if (!p) return null;
    p.agreedAt ??= this.clock();
    return { ...p };
  }

  async stop(userId: number) {
    const p = this.parents.find((x) => x.telegramUserId === userId);
    if (!p) return null;
    p.stoppedAt ??= this.clock();
    for (const n of this.nudges) if (n.parentId === p.id && n.status === "waiting" && n.doneAt === null) n.status = "stopped";
    return { ...p };
  }

  async createNudge(n: NewNudge) {
    const exists = this.nudges.some((x) => !x.isTest && x.parentId === n.parentId && x.day === n.day && x.slot === n.slot);
    if (exists) return;
    this.nudges.push({ id: this.nextId++, ...n, isTest: false, nudgeAttemptedAt: null, nudgeSentAt: null, reminderAttemptedAt: null, reminderSentAt: null, doneAt: null });
  }

  async claimNudgeSend(id: number) {
    const n = this.find(id);
    if (n.status !== "waiting" || n.nudgeAttemptedAt !== null) return false;
    n.nudgeAttemptedAt = this.clock();
    return true;
  }

  async markNudgeSent(id: number, at: Date) { this.find(id).nudgeSentAt = at; }

  async setStatus(id: number, from: Status, to: Status) {
    const n = this.find(id);
    if (n.status !== from) return false;
    n.status = to;
    return true;
  }

  async claimReminder(id: number) {
    const n = this.find(id);
    if (n.status !== "waiting" || n.reminderAttemptedAt !== null || n.doneAt !== null) return false;
    n.reminderAttemptedAt = this.clock();
    return true;
  }

  async markReminderSent(id: number, at: Date) { this.find(id).reminderSentAt = at; }

  async recordDone(id: number, userId: number, at: Date, status: Status) {
    const n = this.find(id);
    const owner = this.parents.find((p) => p.id === n.parentId);
    if (owner?.telegramUserId !== userId || n.doneAt !== null || !["waiting", "no_action"].includes(n.status)) return false;
    n.doneAt = at;
    n.status = status;
    return true;
  }

  async claimEndMessage(parentId: number) {
    const p = this.parents.find((x) => x.id === parentId);
    if (!p || p.endMessageSentAt !== null) return false;
    p.endMessageSentAt = this.clock();
    return true;
  }

  async logEvent(e: EventRecord) {
    if (e.telegramUpdateId != null && (await this.hasUpdate(e.telegramUpdateId))) return;
    this.events.push(e);
  }

  // Test helper: the stored Nudge itself (not a copy), or a clear error.
  find(id: number): Nudge {
    const n = this.nudges.find((x) => x.id === id);
    if (!n) throw new Error(`No Nudge ${id}`);
    return n;
  }
}

// One message the fake Telegram "sent".
export interface SentMessage { chatId: number; text: string; button?: Button }

export class FakeTelegram implements TelegramApi {
  sent: SentMessage[] = [];
  answered: string[] = [];
  refuse = new Set<number>(); // chat IDs Telegram will refuse (for example, the bot was blocked)
  private nextMessageId = 1;

  async sendMessage(chatId: number, text: string, button?: Button): Promise<SendResult> {
    if (this.refuse.has(chatId)) return { ok: false, error: "Forbidden: bot was blocked by the user" };
    this.sent.push(button ? { chatId, text, button } : { chatId, text });
    return { ok: true, messageId: this.nextMessageId++ };
  }

  async answerCallback(callbackId: string) { this.answered.push(callbackId); }

  // Test helper: the texts sent to one chat, in order.
  textsTo(chatId: number) { return this.sent.filter((m) => m.chatId === chatId).map((m) => m.text); }
}

// A clock the test can move forward, like turning the hands of a watch.
export function makeClock(start: Date) {
  let current = start;
  return {
    now: () => current,
    set: (d: Date) => { current = d; },
  };
}
