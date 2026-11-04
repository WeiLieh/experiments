// =============================================================================
// experiment-1/tests/http.test.ts: only Telegram and our scheduler may call us
//
// What it checks: the two web addresses refuse callers without the right secret
// (test 18), and pass genuine calls on to the handlers.
// =============================================================================
import { describe, expect, it, vi } from "vitest";
import { tickEndpoint, webhookEndpoint } from "../src/http.js";

const post = (headers: Record<string, string>, body: unknown = { update_id: 1 }) =>
  new Request("https://example.test/api", { method: "POST", headers, body: JSON.stringify(body) });

describe("[18] the Telegram web address", () => {
  it("refuses a message without Telegram's secret, and never handles it", async () => {
    const handle = vi.fn(async () => {});
    const wrong = await webhookEndpoint(post({ "x-telegram-bot-api-secret-token": "guess" }), "s3cret", handle);
    const missing = await webhookEndpoint(post({}), "s3cret", handle);
    expect([wrong.status, missing.status]).toEqual([401, 401]);
    expect(handle).not.toHaveBeenCalled();
  });

  it("handles a message carrying the right secret", async () => {
    const handle = vi.fn(async () => {});
    const res = await webhookEndpoint(post({ "x-telegram-bot-api-secret-token": "s3cret" }, { update_id: 7 }), "s3cret", handle);
    expect(res.status).toBe(200);
    expect(handle).toHaveBeenCalledWith({ update_id: 7 });
  });

  it("reports a failure as a failure, so Telegram tries again (never a fake success)", async () => {
    const res = await webhookEndpoint(post({ "x-telegram-bot-api-secret-token": "s3cret" }), "s3cret", async () => {
      throw new Error("database down");
    });
    expect(res.status).toBe(500);
  });
});

describe("[18] the scheduler's web address", () => {
  it("refuses a call without the scheduler's secret", async () => {
    const tick = vi.fn(async () => ({}));
    const res = await tickEndpoint(post({ authorization: "Bearer nope" }), "t1ck", tick);
    expect(res.status).toBe(401);
    expect(tick).not.toHaveBeenCalled();
  });

  it("runs the scheduler when the secret is right", async () => {
    const tick = vi.fn(async () => ({ sent: 1 }));
    const res = await tickEndpoint(post({ authorization: "Bearer t1ck" }), "t1ck", tick);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 1 });
  });
});
