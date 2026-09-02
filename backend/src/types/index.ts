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

export interface GroupActions {
  kick: (jid: string) => Promise<boolean>;
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
  isOwner: boolean;
  isAdmin: boolean;
  isGroup: boolean;
  groupJid: string | null;
  args: string[];
  body: string;
  actions?: GroupActions;
}

export type CommandHandler = (
  ctx: CommandContext,
  reply: (text: string) => Promise<void>
) => Promise<void>;

export interface Command {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  ownerOnly?: boolean;
  adminOnly?: boolean;
  cooldown?: number;
  execute: CommandHandler;
}
