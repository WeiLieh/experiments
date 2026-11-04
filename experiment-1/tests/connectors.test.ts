// =============================================================================
// experiment-1/tests/connectors.test.ts: the Supabase and Telegram connectors
//
// What it checks: that requests go to the exp1 schema with the key, that
// database rows are read correctly, and that failures are reported as
// failures (never as made-up values). The network is replaced by a pretend
// "fetch" that records each request and returns a prepared answer.
// =============================================================================
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseStore } from "../src/store.js";
import { makeTelegram } from "../src/telegram.js";

// Replace the network: each call returns the next prepared answer.
function fakeFetch(...answers: Array<{ status?: number; body: unknown } | Error>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = answers.shift();
    if (!next) throw new Error("no prepared answer");
    if (next instanceof Error) throw next;
    return new Response(next.body === null ? "" : JSON.stringify(next.body), { status: next.status ?? 200 });
  });
  vi.stubGlobal("fetch", fn);
  return calls;
}
afterEach(() => vi.unstubAllGlobals());

describe("the Supabase connector", () => {
  const store = makeSupabaseStore("https://db.example", "service-key");

  it("reads from the exp1 schema with the key, and turns rows into parents", async () => {
    const calls = fakeFetch({
      body: [{ id: 1, parent_name: "Alex", child_name: "Sam", telegram_handle: "alexdemo", telegram_user_id: 111, morning_time: "07:00:00", evening_time: "19:00:00", is_tester: false, agreed_at: "2026-11-08T02:00:00+00:00", stopped_at: null, end_message_sent_at: null }],
    });
    const [p] = await store.listParents();
    expect(calls[0]?.url).toBe("https://db.example/rest/v1/parents?select=*&order=id");
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers["Accept-Profile"]).toBe("exp1");
    expect(headers.Authorization).toBe("Bearer service-key");
    expect(p).toMatchObject({ parentName: "Alex", morningTime: "07:00", eveningTime: "19:00", telegramUserId: 111, stoppedAt: null });
    expect(p?.agreedAt).toEqual(new Date("2026-11-08T02:00:00Z"));
  });

  it("calls the app functions with the agreed names and values", async () => {
    const calls = fakeFetch({ body: true });
    const ok = await store.recordDone(10, 111, new Date("2026-11-08T23:10:00Z"), "acted_on_nudge");
    expect(ok).toBe(true);
    expect(calls[0]?.url).toBe("https://db.example/rest/v1/rpc/app_record_done");
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ p_id: 10, p_user_id: 111, p_at: "2026-11-08T23:10:00.000Z", p_status: "acted_on_nudge" });
  });

  it("treats 'no such parent' as nothing, never as a made-up parent", async () => {
    fakeFetch({ body: null });
    expect(await store.linkParent("nobody", 5)).toBeNull();
  });

  it("fails loudly when Supabase refuses", async () => {
    fakeFetch({ status: 401, body: { message: "bad key" } });
    await expect(store.listNudges()).rejects.toThrow(/Supabase GET nudges.* failed: 401/);
  });
});

describe("the Telegram connector", () => {
  const telegram = makeTelegram("bot-token");

  it("sends a message with one button, and returns Telegram's message number", async () => {
    const calls = fakeFetch({ body: { ok: true, result: { message_id: 42 } } });
    expect(await telegram.sendMessage(111, "Hi", { text: "✅ Done", data: "done:10" })).toEqual({ ok: true, messageId: 42 });
    expect(calls[0]?.url).toBe("https://api.telegram.org/botbot-token/sendMessage");
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      chat_id: 111, text: "Hi", reply_markup: { inline_keyboard: [[{ text: "✅ Done", callback_data: "done:10" }]] },
    });
  });

  it("reports a refusal (for example, a blocked bot) with Telegram's reason", async () => {
    fakeFetch({ status: 403, body: { ok: false, description: "Forbidden: bot was blocked by the user" } });
    expect(await telegram.sendMessage(111, "Hi")).toEqual({ ok: false, error: "Forbidden: bot was blocked by the user" });
  });

  it("reports no connection as not sent", async () => {
    fakeFetch(new Error("network down"));
    const result = await telegram.sendMessage(111, "Hi");
    expect(result.ok).toBe(false);
  });
});
