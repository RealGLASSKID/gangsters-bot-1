import { BotConfig } from "./types";

// Edit these before running, or set OWNER_JID / GROUP_JID env vars
export const config: BotConfig = {
  prefix: "!",
  ownerJid: process.env.OWNER_JID || "YOUR_NUMBER@s.whatsapp.net",
  groupJid: process.env.GROUP_JID || "YOUR_GROUP@g.us",
  botName: "GANGSTER BOT",
};
