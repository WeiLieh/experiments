// =============================================================================
// experiment-1/tests/messages.test.ts: the wording the owner agreed
//
// What it checks: the fixed messages say what SPEC.md section 5 says, with the
// parent's and child's names filled in, and every troubleshooting message ends
// with the WhatsApp group line (test 23).
// =============================================================================
import { describe, expect, it } from "vitest";
import * as msg from "../src/messages.js";
import { parent } from "./helpers/builders.js";

const alex = parent({ morningTime: "08:00", eveningTime: "21:00" });

describe("[23] troubleshooting messages", () => {
  it("end with the Experiment WhatsApp group line", () => {
    for (const text of [msg.typedWords(), msg.alreadyStopped()]) {
      expect(text.endsWith(msg.TROUBLESHOOTING_LINE)).toBe(true);
    }
    expect(msg.TROUBLESHOOTING_LINE).toBe("For any issues, questions, ask them inside the Experiment Whatsapp group. Thanks!");
  });

  it("the 'can't find you' reply uses the owner's own wording", () => {
    expect(msg.noMatch()).toBe("Hi I can't find your Telegram handle on the list yet. Please drop your question inside the Experiment Whatsapp group. Thanks!");
  });
});

describe("the agreed wording", () => {
  it("the welcome names the parent, the child and both times, and says what is recorded and when it's deleted", () => {
    const text = msg.welcome(alex);
    expect(text).toContain("Hi Alex!");
    expect(text).toContain("give Sam a hug, at 8:00 am and 9:00 pm");
    expect(text).toContain("What we record:");
    expect(text).toContain("deleted 30 days after the experiment ends");
  });

  it("/stop uses the owner's wording", () => {
    expect(msg.stopped(alex)).toBe("You've stopped the hug reminders, Alex. Thank you for taking part.");
  });

  it("Nudges, reminder and thank-you name the child", () => {
    expect(msg.morningNudge(alex)).toBe("Good morning, Alex ☀️ Time for a hug with Sam. Tap ✅ Done after your hug.");
    expect(msg.eveningNudge(alex)).toBe("Good evening, Alex 🌙 Time for a hug with Sam. Tap ✅ Done after your hug.");
    expect(msg.reminder(alex)).toBe("A gentle reminder: a hug with Sam 🤗 Tap ✅ Done when it's done.");
    expect(msg.thankYou(alex, "evening")).toBe("Thank you! ✅ Your hug with Sam is saved for this evening.");
  });
});
