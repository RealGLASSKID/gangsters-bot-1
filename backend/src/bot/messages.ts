import { randomUUID } from "node:crypto";
import { db } from "../db/connection";
import type { BotMessage, MessageDirection } from "../types";

const insertMessage = db.prepare(`
  INSERT INTO messages (id, phone, direction, text, messageId, replyToId, createdAt)
  VALUES (@id, @phone, @direction, @text, @messageId, @replyToId, @createdAt)
`);
const listRecentStmt = db.prepare<[number], BotMessage>(
  `SELECT * FROM messages ORDER BY createdAt DESC LIMIT ?`
);
const listForPhoneStmt = db.prepare<[string, number], BotMessage>(
  `SELECT * FROM messages WHERE phone = ? ORDER BY createdAt DESC LIMIT ?`
);

export function logMessage(input: {
  phone: string;
  direction: MessageDirection;
  text: string;
  messageId?: string | null;
  replyToId?: string | null;
}): BotMessage {
  const message: BotMessage = {
    id: randomUUID(),
    phone: input.phone,
    direction: input.direction,
    text: input.text,
    messageId: input.messageId ?? null,
    replyToId: input.replyToId ?? null,
    createdAt: Date.now(),
  };
  insertMessage.run(message);
  return message;
}

export function listRecentMessages(limit = 200): BotMessage[] {
  return listRecentStmt.all(limit);
}

export function listMessagesForPhone(phone: string, limit = 100): BotMessage[] {
  return listForPhoneStmt.all(phone, limit);
}
