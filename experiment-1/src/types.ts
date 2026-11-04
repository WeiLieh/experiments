// =============================================================================
// experiment-1/src/types.ts: the shapes of the data Experiment 1 works with
//
// Why: one place that says what "a parent", "a Nudge" or "a message from
// Telegram" looks like, so every other file (and TypeScript's checks) agree.
// It also describes the two outside services as "interfaces" (a list of what
// they can do), so tests can swap in pretend versions (tests/helpers/fakes.ts).
// =============================================================================

// The two daily Nudges.
export type Slot = "morning" | "evening";

// Where a Nudge stands (SPEC.md rule E1.6). "waiting" = its 60 minutes are still running.
export type Status =
  | "waiting"
  | "acted_on_nudge" // 1. Acted on Nudge
  | "acted_on_reminder" // 2. Did not act on Nudge. Acted on reminder
  | "acted_late" // 3. Did not act on Nudge. Acted on reminder late
  | "no_action" // 4. Did not act on Nudge. Did not act on reminder
  | "not_started" // 5. Not sent: hadn't started
  | "not_delivered" // 6. Not sent: Telegram refused
  | "stopped"; // 7. Stopped

// The one-row settings table: the start date (empty until the owner starts) and test mode.
export interface Settings {
  startDate: string | null; // a Singapore date, "YYYY-MM-DD"
  testMode: boolean;
}

// One row of exp1.parents.
export interface Parent {
  id: number;
  parentName: string;
  childName: string;
  telegramHandle: string; // the public nickname, e.g. "alexdemo"
  telegramUserId: number | null; // Telegram's permanent number for the account, known after /start
  morningTime: string; // "07:00", "08:00" or "09:00"
  eveningTime: string; // "19:00", "20:00" or "21:00"
  isTester: boolean;
  agreedAt: Date | null;
  stoppedAt: Date | null;
  endMessageSentAt: Date | null;
}

// One row of exp1.nudges: one Nudge to one parent.
export interface Nudge {
  id: number;
  parentId: number;
  day: string; // Singapore date, "YYYY-MM-DD"
  slot: Slot;
  scheduledFor: Date;
  isTest: boolean; // sent by hand in test mode ("send now")
  nudgeAttemptedAt: Date | null; // when the app started sending it
  nudgeSentAt: Date | null; // when Telegram accepted it
  reminderAttemptedAt: Date | null;
  reminderSentAt: Date | null;
  doneAt: Date | null; // the first ✅ Done tap
  status: Status;
}

// A Nudge the scheduler should add to the table.
export interface NewNudge {
  parentId: number;
  day: string;
  slot: Slot;
  scheduledFor: Date;
  status: Status;
}

// What the scheduler should do next with an existing Nudge (or parent).
export type FollowUp =
  | { kind: "send" | "too_late" | "remind" | "close" | "unconfirmed"; nudgeId: number }
  | { kind: "end_message"; parentId: number };

// One line for the raw log (exp1.events).
export interface EventRecord {
  kind: string;
  parentId?: number | null;
  nudgeId?: number | null;
  telegramUpdateId?: number | null;
  telegramUserId?: number | null;
  detail?: Record<string, unknown>;
}

// Everything the bot needs from the database. The real version is store.ts;
// the test version is tests/helpers/fakes.ts. The "claim" steps make sure two
// scheduler runs at the same moment can never send the same message twice.
export interface Store {
  getSettings(): Promise<Settings>;
  listParents(): Promise<Parent[]>;
  listNudges(): Promise<Nudge[]>;
  getNudge(id: number): Promise<Nudge | null>;
  findParentByUserId(userId: number): Promise<Parent | null>;
  hasUpdate(updateId: number): Promise<boolean>;
  linkParent(handle: string, userId: number): Promise<Parent | null>;
  agree(userId: number): Promise<Parent | null>;
  stop(userId: number): Promise<Parent | null>;
  createNudge(n: NewNudge): Promise<void>;
  claimNudgeSend(id: number): Promise<boolean>;
  markNudgeSent(id: number, at: Date, messageId: number): Promise<void>;
  setStatus(id: number, from: Status, to: Status): Promise<boolean>;
  claimReminder(id: number): Promise<boolean>;
  markReminderSent(id: number, at: Date): Promise<void>;
  recordDone(id: number, userId: number, at: Date, status: Status): Promise<boolean>;
  claimEndMessage(parentId: number): Promise<boolean>;
  logEvent(e: EventRecord): Promise<void>;
}

// One button under a message: what it says, and the code Telegram sends back when tapped.
export interface Button {
  text: string;
  data: string;
}

// Telegram either accepts a message (and gives it a number) or refuses it.
export type SendResult = { ok: true; messageId: number } | { ok: false; error: string };

// Everything the bot needs from Telegram.
export interface TelegramApi {
  sendMessage(chatId: number, text: string, button?: Button): Promise<SendResult>;
  answerCallback(callbackId: string): Promise<void>;
}

// What the handlers are given: the database, Telegram and a clock.
export interface Deps {
  store: Store;
  telegram: TelegramApi;
  now: () => Date;
}

// The parts of a Telegram "update" (one event from a chat) that we use.
export interface TelegramUser {
  id: number;
  username?: string;
}
export interface TelegramUpdate {
  update_id: number;
  message?: { from?: TelegramUser; chat: { id: number }; text?: string };
  callback_query?: { id: string; from: TelegramUser; data?: string };
}
