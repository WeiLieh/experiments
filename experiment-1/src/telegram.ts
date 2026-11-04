// =============================================================================
// experiment-1/src/telegram.ts: talking to Telegram
//
// Why: sends the bot's messages through Telegram's Bot API with plain web
// requests (no library, as agreed). A refused message comes back as
// { ok: false } with Telegram's reason, so the app can record it honestly
// (status 6, "Not sent: Telegram refused").
// =============================================================================
import type { Button, SendResult, TelegramApi } from "./types.js";

export function makeTelegram(botToken: string): TelegramApi {
  const call = async (method: string, body: unknown): Promise<{ ok: boolean; result?: { message_id?: number }; description?: string }> => {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as { ok: boolean; result?: { message_id?: number }; description?: string };
  };

  return {
    async sendMessage(chatId: number, text: string, button?: Button): Promise<SendResult> {
      try {
        const reply = await call("sendMessage", {
          chat_id: chatId,
          text,
          // One button under the message; Telegram sends `data` back when it's tapped.
          ...(button ? { reply_markup: { inline_keyboard: [[{ text: button.text, callback_data: button.data }]] } } : {}),
        });
        const messageId = reply.result?.message_id;
        if (reply.ok && typeof messageId === "number") return { ok: true, messageId };
        return { ok: false, error: reply.description ?? "Telegram refused the message" };
      } catch (error) {
        // No connection to Telegram counts as not sent, with the reason kept.
        return { ok: false, error: `Could not reach Telegram: ${String(error)}` };
      }
    },

    async answerCallback(callbackId: string): Promise<void> {
      // Tells Telegram we received the tap (stops the button's spinner).
      // If this fails, the tap is still handled; the reason goes to the server log.
      try {
        await call("answerCallbackQuery", { callback_query_id: callbackId });
      } catch (error) {
        console.error("answerCallbackQuery failed:", error);
      }
    },
  };
}
