import API from "./authInstance";

// ══════════════════════════════════════════════
// Telegram Chat API Service
// ──────────────────────────────────────────────
// Frontend calls YOUR backend (Python).
// Backend securely calls Telegram Bot API.
// BOT TOKEN never touches the frontend. 🔐
// ══════════════════════════════════════════════

// ── Types ──────────────────────────────────────
export interface TelegramMessage {
  message_id: number;
  chat_id: number | string;
  sender_id: number;
  sender_name: string;
  text: string;
  timestamp: string; // ISO string
  is_from_bot: boolean;
}

export interface TelegramChat {
  chat_id: number | string;
  chat_type: "private" | "group";
  title: string;
  username?: string;
  member_count?: number;
}

// ── API Calls (go through YOUR Python backend) ──

/** Send a message via your backend → Telegram Bot API */
export const sendTelegramMessageApi = (
  chatId: number | string,
  text: string,
) => {
  return API.post("/telegram/send", { chat_id: chatId, text });
};

/** Get message history for a chat */
export const getTelegramMessagesApi = (chatId: number | string, limit = 50) => {
  return API.get("/telegram/messages", {
    params: { chat_id: chatId, limit },
  });
};

/** Get list of chats/groups the bot is in */
export const getTelegramChatsApi = () => {
  return API.get("/telegram/chats");
};

/** Register/link current user's Telegram chat_id */
export const linkTelegramApi = (telegramChatId: number | string) => {
  return API.post("/telegram/link", { telegram_chat_id: telegramChatId });
};

/** Get current user's Telegram link status */
export const getTelegramStatusApi = () => {
  return API.get("/telegram/status");
};

/** Get batch group chat info */
export const getTelegramGroupApi = (batchId: number | string) => {
  return API.get(`/telegram/group/${batchId}`);
};
