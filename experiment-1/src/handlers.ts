// =============================================================================
// experiment-1/src/handlers.ts: what the bot does with each message and each minute
//
// Why: two things happen in Experiment 1. (1) Telegram tells us a parent typed
// or tapped something: handleUpdate replies and records it. (2) Every minute
// the scheduler wakes us: handleTick creates due Nudges, sends them, sends
// reminders and closes finished ones. The decisions come from rules.ts; this
// file carries them out, and logs every step in exp1.events (rule E1.7).
// =============================================================================
import * as msg from "./messages.js";
import { planCreates, planFollowUps, statusForTap, windowMinutes } from "./rules.js";
import type { Button, Deps, EventRecord, Nudge, Parent, TelegramUpdate } from "./types.js";

const AGREE_BUTTON: Button = { text: "I agree", data: "agree" };
const doneButton = (nudgeId: number): Button => ({ text: "✅ Done", data: `done:${nudgeId}` });

// Send a reply. If Telegram refuses it, record that (never pretend it went).
// The log keeps only the reason: the reply may be to someone not on the list.
async function reply(deps: Deps, chatId: number, text: string, button?: Button): Promise<void> {
  const result = await deps.telegram.sendMessage(chatId, text, button);
  if (!result.ok) await deps.store.logEvent({ kind: "reply_failed", detail: { error: result.error } });
}

// ---------------------------------------------------------------------------
// (1) A message or tap from Telegram
// ---------------------------------------------------------------------------
export async function handleUpdate(update: TelegramUpdate, deps: Deps): Promise<void> {
  // Telegram may deliver the same update twice: handle each one once (test 11).
  if (await deps.store.hasUpdate(update.update_id)) return;
  let event: EventRecord;
  if (update.callback_query) event = await onTap(update.callback_query, deps);
  else if (update.message?.from) event = await onMessage(update.message.from, update.message.text ?? "", deps);
  else event = { kind: "ignored" };
  await deps.store.logEvent({ ...event, telegramUpdateId: update.update_id });
}

// Typed text: /start, /stop, or anything else.
async function onMessage(from: { id: number; username?: string }, text: string, deps: Deps): Promise<EventRecord> {
  const { store } = deps;
  const userId = from.id;
  // "/start", "/start@BotName" and "/START" all count as /start.
  const command = (text.trim().split(/\s+/)[0] ?? "").split("@")[0]?.toLowerCase() ?? "";
  const base = { telegramUserId: userId };

  if (command === "/start") {
    // Already linked? Use that. Otherwise find the parent by Telegram handle (rule E1.3).
    const known = await store.findParentByUserId(userId);
    const p = known ?? (from.username ? await store.linkParent(from.username, userId) : null);
    if (!p) {
      await reply(deps, userId, msg.noMatch());
      // Not on the list: they never agreed to anything, so keep no number or handle.
      return { kind: "start_no_match" };
    }
    if (p.stoppedAt) {
      await reply(deps, userId, msg.alreadyStopped()); // /start never restarts after /stop (test 20)
      return { ...base, kind: "start_after_stop", parentId: p.id };
    }
    if (p.agreedAt) await reply(deps, userId, msg.allSet(p));
    else await reply(deps, userId, msg.welcome(p), AGREE_BUTTON);
    return { ...base, kind: "start", parentId: p.id };
  }

  const p = await store.findParentByUserId(userId);
  if (!p) {
    await reply(deps, userId, msg.noMatch());
    return { kind: command === "/stop" ? "stop_no_match" : "text_no_match" }; // nothing kept about them
  }
  if (command === "/stop") {
    const stopped = await store.stop(userId); // also ends any waiting Nudge as "stopped" (rule E1.13)
    await reply(deps, userId, msg.stopped(stopped ?? p));
    return { ...base, kind: "stop", parentId: p.id };
  }
  // Anything else typed: only the button counts (rule E1.4). The words themselves are not stored.
  await reply(deps, userId, p.stoppedAt ? msg.alreadyStopped() : msg.typedWords());
  return { ...base, kind: "typed_text", parentId: p.id };
}

// A button tap: "I agree" or "✅ Done".
async function onTap(cq: { id: string; from: { id: number }; data?: string }, deps: Deps): Promise<EventRecord> {
  const { store } = deps;
  const userId = cq.from.id;
  const base = { telegramUserId: userId };
  await deps.telegram.answerCallback(cq.id); // stops the button's loading spinner

  const p = await store.findParentByUserId(userId);
  if (!p) {
    await reply(deps, userId, msg.noMatch());
    return { kind: "tap_no_match" }; // nothing kept about them
  }
  if (p.stoppedAt) {
    await reply(deps, userId, msg.alreadyStopped());
    return { ...base, kind: "tap_after_stop", parentId: p.id };
  }

  if (cq.data === "agree") {
    const agreed = await store.agree(userId); // keeps the first time if tapped again (test 14)
    await reply(deps, userId, msg.allSet(agreed ?? p));
    return { ...base, kind: "agree", parentId: p.id };
  }

  const match = /^done:(\d+)$/.exec(cq.data ?? "");
  const nudge = match ? await store.getNudge(Number(match[1])) : null;
  if (!nudge || nudge.parentId !== p.id) return { ...base, kind: "tap_unknown", parentId: p.id, detail: { data: cq.data ?? null } };
  return onDone(p, nudge, userId, deps);
}

// ✅ Done on one Nudge: work out its status from the tap time (rule E1.6).
async function onDone(p: Parent, nudge: Nudge, userId: number, deps: Deps): Promise<EventRecord> {
  const base = { telegramUserId: userId, parentId: p.id, nudgeId: nudge.id };
  if (nudge.doneAt) {
    await reply(deps, userId, msg.alreadySaved());
    return { ...base, kind: "done_repeat" };
  }
  const tapAt = deps.now();
  const status = statusForTap(nudge, tapAt, windowMinutes(await deps.store.getSettings()));
  if (!status) {
    // After midnight (or a Nudge that was never sent): logged, no status change.
    await reply(deps, userId, msg.thankYou(p, nudge.slot));
    return { ...base, kind: "done_after_midnight" };
  }
  const recorded = await deps.store.recordDone(nudge.id, userId, tapAt, status);
  await reply(deps, userId, recorded ? msg.thankYou(p, nudge.slot) : msg.alreadySaved());
  return { ...base, kind: recorded ? "done" : "done_repeat", detail: { status } };
}

// ---------------------------------------------------------------------------
// (2) The scheduler, every minute
// ---------------------------------------------------------------------------
export interface TickReport {
  created: number;
  sent: number;
  notDelivered: number;
  reminded: number;
  closed: number;
  endMessages: number;
}

export async function handleTick(deps: Deps): Promise<TickReport> {
  const { store, telegram } = deps;
  const now = deps.now();
  const settings = await store.getSettings();
  const parents = await store.listParents();
  let nudges = await store.listNudges();
  const report: TickReport = { created: 0, sent: 0, notDelivered: 0, reminded: 0, closed: 0, endMessages: 0 };

  // Step 1: add the Nudges whose time has come.
  const creates = planCreates(now, settings, parents, nudges);
  for (const c of creates) await store.createNudge(c);
  report.created = creates.length;
  if (creates.length > 0) nudges = await store.listNudges();

  // Step 2: send, remind, close.
  const parentById = new Map(parents.map((p) => [p.id, p]));
  for (const action of planFollowUps(now, settings, parents, nudges)) {
    if (action.kind === "end_message") {
      const p = parentById.get(action.parentId);
      if (!p?.telegramUserId || !(await store.claimEndMessage(p.id))) continue;
      const result = await telegram.sendMessage(p.telegramUserId, msg.endOfExperiment(p));
      await store.logEvent({ kind: result.ok ? "end_message_sent" : "end_message_failed", parentId: p.id, detail: result.ok ? {} : { error: result.error } });
      if (result.ok) report.endMessages++;
      continue;
    }

    const n = nudges.find((x) => x.id === action.nudgeId);
    const p = n ? parentById.get(n.parentId) : undefined;
    if (!n || !p) continue;
    const ids = { parentId: p.id, nudgeId: n.id };

    if (action.kind === "send") {
      if (!(await store.claimNudgeSend(n.id))) continue; // another run got there first (test 4)
      const text = n.slot === "morning" ? msg.morningNudge(p) : msg.eveningNudge(p);
      const result = p.telegramUserId
        ? await telegram.sendMessage(p.telegramUserId, text, doneButton(n.id))
        : ({ ok: false, error: "no Telegram account linked" } as const);
      if (result.ok) {
        await store.markNudgeSent(n.id, deps.now(), result.messageId);
        await store.logEvent({ ...ids, kind: "nudge_sent" });
        report.sent++;
      } else {
        await store.setStatus(n.id, "waiting", "not_delivered"); // test 10
        await store.logEvent({ ...ids, kind: "nudge_failed", detail: { error: result.error } });
        report.notDelivered++;
      }
    } else if (action.kind === "too_late" || action.kind === "unconfirmed") {
      await store.setStatus(n.id, "waiting", "not_delivered");
      await store.logEvent({ ...ids, kind: action.kind === "too_late" ? "nudge_too_late" : "nudge_unconfirmed" });
      report.notDelivered++;
    } else if (action.kind === "remind") {
      if (!p.telegramUserId || !(await store.claimReminder(n.id))) continue;
      const result = await telegram.sendMessage(p.telegramUserId, msg.reminder(p), doneButton(n.id));
      if (result.ok) {
        await store.markReminderSent(n.id, deps.now());
        report.reminded++;
      }
      await store.logEvent({ ...ids, kind: result.ok ? "reminder_sent" : "reminder_failed", detail: result.ok ? {} : { error: result.error } });
    } else if (action.kind === "close") {
      if (await store.setStatus(n.id, "waiting", "no_action")) {
        await store.logEvent({ ...ids, kind: "nudge_closed" });
        report.closed++;
      }
    }
  }
  return report;
}
