// =============================================================================
// experiment-1/src/live.ts: connects the bot to the real Supabase and Telegram
//
// Why: the secret keys live in Vercel's settings (never in Git). This file
// reads them and builds the real database and Telegram connections. A missing
// key stops the request with a clear error instead of running half-connected.
// =============================================================================
import { makeSupabaseStore } from "./store.js";
import { makeTelegram } from "./telegram.js";
import type { Deps } from "./types.js";

// Read one setting from Vercel's environment, or fail loudly.
export function setting(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing setting ${name}: add it in Vercel (see GO-LIVE.md)`);
  return value;
}

export function liveDeps(): Deps {
  return {
    store: makeSupabaseStore(setting("SUPABASE_URL"), setting("SUPABASE_SERVICE_ROLE_KEY")),
    telegram: makeTelegram(setting("TELEGRAM_BOT_TOKEN")),
    now: () => new Date(),
  };
}
