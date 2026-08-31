export type Role = "super_admin" | "admin" | "member";

export interface BotUser {
  phone: string;
  role: Role;
  displayName: string | null;
  createdAt: number;
  lastSeenAt: number;
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

export interface RelayInboundPayload {
  from: string;
  text: string;
  messageId: string | null;
  replyToId: string | null;
}
