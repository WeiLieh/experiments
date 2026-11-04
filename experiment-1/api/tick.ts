// =============================================================================
// experiment-1/api/tick.ts: the web address the scheduler calls every minute
//
// Why: Supabase Cron (the scheduler, an alarm clock) calls this once a minute.
// This thin file only checks the secret and runs handleTick, which sends due
// Nudges and reminders. Lives at https://<your-vercel-project>.vercel.app/api/tick
// =============================================================================
import { handleTick } from "../src/handlers.js";
import { tickEndpoint } from "../src/http.js";
import { liveDeps } from "../src/live.js";

export async function POST(request: Request): Promise<Response> {
  return tickEndpoint(request, process.env.CRON_SECRET ?? "", () => handleTick(liveDeps()));
}
