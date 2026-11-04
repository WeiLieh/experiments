// =============================================================================
// experiment-1/api/telegram.ts: the web address Telegram calls (the webhook)
//
// Why: each time a parent types or taps, Telegram sends it here. This thin file
// only checks the secret and hands the message to handlers.ts.
// Lives at https://<your-vercel-project>.vercel.app/api/telegram
// =============================================================================
import { handleUpdate } from "../src/handlers.js";
import { webhookEndpoint } from "../src/http.js";
import { liveDeps } from "../src/live.js";

export async function POST(request: Request): Promise<Response> {
  // An empty secret refuses everything (see http.ts), so a missing setting is never "open".
  return webhookEndpoint(request, process.env.TELEGRAM_WEBHOOK_SECRET ?? "", (update) => handleUpdate(update, liveDeps()));
}
