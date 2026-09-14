import { BotConfig } from "./types";

function envList(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const config: BotConfig = {
  prefix: process.env.PREFIX || "!",
  ownerJid: process.env.OWNER_JID || "YOUR_NUMBER@s.whatsapp.net",
  groupJid: process.env.GROUP_JID || "YOUR_GROUP@g.us",
  botName: process.env.BOT_NAME || "GANGSTER BOT",
};

export const dashboardConfig = {
  origin: process.env.DASHBOARD_ORIGIN || "*",
  devBypass: process.env.DASHBOARD_DEV_BYPASS === "1",
  adminEmails: envList("FIREBASE_ADMIN_EMAILS"),
};
