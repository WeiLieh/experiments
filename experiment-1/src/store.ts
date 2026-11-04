// =============================================================================
// experiment-1/src/store.ts: talking to the Supabase database
//
// Why: reads the exp1 tables and calls the app_* functions in sql/001_exp1.sql
// through Supabase's ready-made web address for the database (its "REST API"),
// with plain web requests. Any failure throws an error, so the request fails
// visibly instead of carrying on with missing data (no fallbacks).
// =============================================================================
import type { EventRecord, NewNudge, Nudge, Parent, Settings, Status, Store } from "./types.js";

type Row = Record<string, unknown>;

// Database text → app values. Empty stays empty (null); nothing is invented.
const toDate = (v: unknown): Date | null => (v == null ? null : new Date(String(v)));
const toNumber = (v: unknown): number | null => (v == null ? null : Number(v));

function toParent(r: Row): Parent {
  return {
    id: Number(r.id),
    parentName: String(r.parent_name),
    childName: String(r.child_name),
    telegramHandle: String(r.telegram_handle),
    telegramUserId: toNumber(r.telegram_user_id),
    morningTime: String(r.morning_time).slice(0, 5), // "07:00:00" -> "07:00"
    eveningTime: String(r.evening_time).slice(0, 5),
    isTester: Boolean(r.is_tester),
    agreedAt: toDate(r.agreed_at),
    stoppedAt: toDate(r.stopped_at),
    endMessageSentAt: toDate(r.end_message_sent_at),
  };
}

function toNudge(r: Row): Nudge {
  return {
    id: Number(r.id),
    parentId: Number(r.parent_id),
    day: String(r.day),
    slot: r.slot === "evening" ? "evening" : "morning",
    scheduledFor: new Date(String(r.scheduled_for)),
    isTest: Boolean(r.is_test),
    nudgeAttemptedAt: toDate(r.nudge_attempted_at),
    nudgeSentAt: toDate(r.nudge_sent_at),
    reminderAttemptedAt: toDate(r.reminder_attempted_at),
    reminderSentAt: toDate(r.reminder_sent_at),
    doneAt: toDate(r.done_at),
    status: String(r.status) as Status,
  };
}

export function makeSupabaseStore(supabaseUrl: string, serviceRoleKey: string): Store {
  // One web request to Supabase, in the exp1 schema. Throws on any failure.
  async function request(path: string, init: { method?: string; body?: unknown } = {}): Promise<unknown> {
    const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      method: init.method ?? "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Accept-Profile": "exp1", // read from the exp1 schema
        "Content-Profile": "exp1", // and run exp1's functions
        "Content-Type": "application/json",
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
    const text = await res.text();
    // The error names the table or function only: the rest of the address can hold a
    // parent's Telegram number, and error texts end up in Vercel's logs.
    if (!res.ok) throw new Error(`Supabase ${init.method ?? "GET"} ${path.split("?")[0]} failed: ${res.status} ${text.slice(0, 300)}`);
    return text === "" ? null : JSON.parse(text);
  }
  const select = async (path: string) => (await request(path)) as Row[];
  const rpc = (fn: string, args: Row) => request(`rpc/${fn}`, { method: "POST", body: args });
  const parentOrNull = (v: unknown) => (v ? toParent(v as Row) : null);

  return {
    async getSettings(): Promise<Settings> {
      const [row] = await select("settings?select=start_date,test_mode");
      if (!row) throw new Error("exp1.settings has no row: run sql/001_exp1.sql");
      return { startDate: row.start_date == null ? null : String(row.start_date), testMode: Boolean(row.test_mode) };
    },
    listParents: async () => (await select("parents?select=*&order=id")).map(toParent),
    listNudges: async () => (await select("nudges?select=*&order=id")).map(toNudge),
    async getNudge(id) {
      const [row] = await select(`nudges?select=*&id=eq.${id}`);
      return row ? toNudge(row) : null;
    },
    async findParentByUserId(userId) {
      const [row] = await select(`parents?select=*&telegram_user_id=eq.${userId}`);
      return row ? toParent(row) : null;
    },
    hasUpdate: async (updateId) => (await select(`events?select=id&telegram_update_id=eq.${updateId}`)).length > 0,
    linkParent: async (handle, userId) => parentOrNull(await rpc("app_link_parent", { p_handle: handle, p_user_id: userId })),
    agree: async (userId) => parentOrNull(await rpc("app_agree", { p_user_id: userId })),
    stop: async (userId) => parentOrNull(await rpc("app_stop", { p_user_id: userId })),
    async createNudge(n: NewNudge) {
      await rpc("app_create_nudge", { p_parent_id: n.parentId, p_day: n.day, p_slot: n.slot, p_scheduled_for: n.scheduledFor.toISOString(), p_status: n.status });
    },
    claimNudgeSend: async (id) => (await rpc("app_claim_nudge_send", { p_id: id })) === true,
    async markNudgeSent(id, at, messageId) {
      await rpc("app_mark_nudge_sent", { p_id: id, p_at: at.toISOString(), p_message_id: messageId });
    },
    setStatus: async (id, from, to) => (await rpc("app_set_status", { p_id: id, p_from: from, p_to: to })) === true,
    claimReminder: async (id) => (await rpc("app_claim_reminder", { p_id: id })) === true,
    async markReminderSent(id, at) {
      await rpc("app_mark_reminder_sent", { p_id: id, p_at: at.toISOString() });
    },
    recordDone: async (id, userId, at, status) =>
      (await rpc("app_record_done", { p_id: id, p_user_id: userId, p_at: at.toISOString(), p_status: status })) === true,
    claimEndMessage: async (parentId) => (await rpc("app_claim_end_message", { p_parent_id: parentId })) === true,
    async logEvent(e: EventRecord) {
      await rpc("app_log_event", {
        p_kind: e.kind,
        p_parent_id: e.parentId ?? null,
        p_nudge_id: e.nudgeId ?? null,
        p_update_id: e.telegramUpdateId ?? null,
        p_user_id: e.telegramUserId ?? null,
        p_detail: e.detail ?? {},
      });
    },
  };
}
