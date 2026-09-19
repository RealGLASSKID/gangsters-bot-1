// These mirror the JSON shapes returned by gangster-bot-brain's admin API.
// SQLite stores booleans as 0/1, and the brain's API passes them through
// as-is rather than coercing to true/false, so we match that here.

export type Role = "super_admin" | "admin" | "member";

export interface BotUser {
  phone: string; // international format, digits only, e.g. "2348012345678"
  role: Role;
  displayName: string | null;
  createdAt: number; // epoch ms
  lastSeenAt: number; // epoch ms
  banned: 0 | 1;
}

export type MessageDirection = "inbound" | "outbound";

export interface BotMessage {
  id: string;
  phone: string;
  direction: MessageDirection;
  text: string;
  messageId: string | null;
  replyToId: string | null;
  createdAt: number;
}

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  enabled: 0 | 1;
  createdAt: number;
}

export type SessionStatus = "active" | "completed" | "abandoned";

export interface GameSession {
  id: string;
  gameId: string;
  phone: string;
  status: SessionStatus;
  state: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}
