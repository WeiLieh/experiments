// =============================================================================
// experiment-1/src/http.ts: the two front doors, and their locks
//
// Why: the bot has two web addresses. Telegram knocks on one when a parent
// types or taps (a "webhook"); Supabase's scheduler knocks on the other every
// minute. Each caller must show a secret, like a key to a door, so nobody else
// can pretend to be Telegram or the scheduler (test 18).
// =============================================================================
import { createHash, timingSafeEqual } from "node:crypto";
import type { TelegramUpdate } from "./types.js";

// Compare a presented secret with the real one in constant time, so an attacker
// can't guess it letter by letter from how long the check takes. Both sides are
// turned into fixed-length fingerprints first. An empty real secret never matches.
function sameSecret(presented: string | null, secret: string): boolean {
  if (!secret || presented === null) return false;
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(presented), digest(secret));
}

// Telegram's door. Telegram sends our secret in a special header we chose when
// connecting the bot (see GO-LIVE.md).
export async function webhookEndpoint(request: Request, secret: string, handle: (update: TelegramUpdate) => Promise<void>): Promise<Response> {
  if (!sameSecret(request.headers.get("x-telegram-bot-api-secret-token"), secret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return new Response("Not a valid message", { status: 400 });
  }
  try {
    await handle(update);
    return new Response("OK");
  } catch (error) {
    // A failure is reported as a failure (rule E1.7): Telegram will try again.
    console.error("Webhook failed:", error);
    return new Response("Failed", { status: 500 });
  }
}

// The scheduler's door. Supabase sends "Authorization: Bearer <secret>".
export async function tickEndpoint(request: Request, secret: string, tick: () => Promise<unknown>): Promise<Response> {
  if (!sameSecret(request.headers.get("authorization"), `Bearer ${secret}`) || !secret) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    return Response.json(await tick());
  } catch (error) {
    console.error("Tick failed:", error);
    return new Response("Failed", { status: 500 });
  }
}
