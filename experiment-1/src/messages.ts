// =============================================================================
// experiment-1/src/messages.ts: everything the bot says, word for word
//
// Why: the owner agreed this wording (SPEC.md section 5). Keeping it in one
// file means a wording change never touches the logic, and the tests
// (tests/messages.test.ts) check it stays as agreed.
// =============================================================================
import { formatTime } from "./time.js";
import type { Parent, Slot } from "./types.js";

// Every troubleshooting message ends with this line (owner, 4 Nov).
export const TROUBLESHOOTING_LINE = "For any issues, questions, ask them inside the Experiment Whatsapp group. Thanks!";

// /start from a listed parent: the welcome and what we record (shown with an "I agree" button).
export function welcome(p: Parent): string {
  return (
    `Hi ${p.parentName}! 👋 Welcome to Experiment 1. ` +
    `For 7 days I'll send you two short reminders a day to give ${p.childName} a hug, at ${formatTime(p.morningTime)} and ${formatTime(p.eveningTime)}. ` +
    `Just tap ✅ Done after the hug.\n\n` +
    `What we record: your name, ${p.childName}'s name, your Telegram handle, and when you get each reminder and tap ✅ Done, so we can learn whether reminders help. ` +
    `Your data stays in Singapore and is deleted 30 days after the experiment ends.`
  );
}

// After "I agree".
export function allSet(p: Parent): string {
  return `Thank you, ${p.parentName}! You're all set. Your first reminder arrives on day 1 of the experiment.`;
}

// /start from a handle that isn't on the list (owner's wording).
export function noMatch(): string {
  return "Hi I can't find your Telegram handle on the list yet. Please drop your question inside the Experiment Whatsapp group. Thanks!";
}

export function morningNudge(p: Parent): string {
  return `Good morning, ${p.parentName} ☀️ Time for a hug with ${p.childName}. Tap ✅ Done after your hug.`;
}

export function eveningNudge(p: Parent): string {
  return `Good evening, ${p.parentName} 🌙 Time for a hug with ${p.childName}. Tap ✅ Done after your hug.`;
}

export function reminder(p: Parent): string {
  return `A gentle reminder: a hug with ${p.childName} 🤗 Tap ✅ Done when it's done.`;
}

export function thankYou(p: Parent, slot: Slot): string {
  return `Thank you! ✅ Your hug with ${p.childName} is saved for this ${slot}.`;
}

export function alreadySaved(): string {
  return "Already saved, thank you!";
}

// Words typed instead of tapping the button.
export function typedWords(): string {
  return `Thanks! I only understand the ✅ Done button 🙂 ${TROUBLESHOOTING_LINE}`;
}

// /stop (owner's wording).
export function stopped(p: Parent): string {
  return `You've stopped the hug reminders, ${p.parentName}. Thank you for taking part.`;
}

// /start, a tap or I agree after /stop.
export function alreadyStopped(): string {
  return `You've already stopped the hug reminders. ${TROUBLESHOOTING_LINE}`;
}

// After the parent's last Nudge of day 7.
export function endOfExperiment(p: Parent): string {
  return `That's the end of the 7 days. Thank you for taking part, ${p.parentName}!`;
}
