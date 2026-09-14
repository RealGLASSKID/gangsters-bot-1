export interface BotConfig {
  prefix: string;
  ownerJid: string;
  groupJid: string;
  botName: string;
}

export interface GroupInfo {
  jid: string;
  subject: string;
  desc: string;
  owner: string | null;
  ownerPn: string | null;
  created: number | null;
  size: number;
  restrict: boolean;
  announce: boolean;
  addressingMode: string | null;
  participants: Array<{ id: string; pn: string | null; lid: string | null; admin: string | null }>;
}

export type GroupSetting = "announcement" | "not_announcement" | "locked" | "unlocked";

export interface QuotedMessage {
  id: string;
  participant: string | null;
  fromMe: boolean;
}

export interface GroupActions {
  kick: (jid: string) => Promise<boolean>;
  promote: (jid: string) => Promise<boolean>;
  demote: (jid: string) => Promise<boolean>;
  deleteMessage: (quoted: QuotedMessage) => Promise<boolean>;
  setSetting: (setting: GroupSetting) => Promise<boolean>;
  setSubject: (subject: string) => Promise<boolean>;
  setDescription: (desc: string) => Promise<boolean>;
  isGroupAdmin: (jid: string) => Promise<boolean>;
  getParticipants: () => Promise<string[]>;
  getGroupInfo: () => Promise<GroupInfo | null>;
}

export interface SenderIdentity {
  raw: string;
  pn: string | null;
  lid: string | null;
  primary: string;
}

export interface CommandContext {
  from: string;
  senderName: string;
  sender: SenderIdentity;
  botJid: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isGroup: boolean;
  groupJid: string | null;
  args: string[];
  body: string;
  mentionedJids: string[];
  quoted: QuotedMessage | null;
  actions?: GroupActions;
}

export type ReplyPayload = string | { text: string; mentions?: string[] };

export type CommandHandler = (
  ctx: CommandContext,
  reply: (payload: ReplyPayload) => Promise<void>
) => Promise<void>;

export type CommandCategory = "identity" | "general" | "economy" | "games" | "admin" | "owner";

export interface Command {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  ownerOnly?: boolean;
  adminOnly?: boolean;
  cooldown?: number;
  category?: CommandCategory;
  execute: CommandHandler;
}

export type SessionStatus = "idle" | "connecting" | "qr" | "connected" | "logged_out" | "error";

export interface SessionState {
  status: SessionStatus;
  connected: boolean;
  qrDataUrl: string | null;
  user: string | null;
  lastError: string | null;
  updatedAt: number;
}
