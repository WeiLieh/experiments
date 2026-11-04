// =============================================================================
// experiment-1/tests/settings-sql.test.ts: the code and the database agree
//
// Why: the allowed Nudge times live in src/settings.ts (rule E1.8). The database
// also refuses other times, so a typing mistake in Supabase is caught at once.
// This test makes sure the two lists can never drift apart.
// =============================================================================
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EVENING_TIMES, MORNING_TIMES } from "../src/settings.js";

const sql = readFileSync(new URL("../sql/001_exp1.sql", import.meta.url), "utf8");

describe("allowed Nudge times", () => {
  it("are the same in the code and in the database's check", () => {
    const listIn = (column: string) => {
      const match = sql.match(new RegExp(`${column} in \\(([^)]*)\\)`));
      return (match?.[1] ?? "").split(",").map((t) => t.trim().replace(/'/g, ""));
    };
    expect(listIn("morning_time")).toEqual([...MORNING_TIMES]);
    expect(listIn("evening_time")).toEqual([...EVENING_TIMES]);
  });
});
