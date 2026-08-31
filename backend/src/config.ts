import "dotenv/config";
import path from "node:path";

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function parseApiKeys(raw: string): Set<string> {
  return new Set(
    raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
  );
}

function parsePhoneSet(raw: string): Set<string> {
  return new Set(
    raw
      .split(",")
      .map((p) => p.trim().replace(/\D/g, ""))
      .filter(Boolean)
  );
}

const dashboardApiKeys = parseApiKeys(process.env.DASHBOARD_API_KEYS || process.env.DASHBOARD_API_KEY || "");
if (dashboardApiKeys.size === 0 && process.env.NODE_ENV !== "test") {
  console.warn(
    "[config] WARNING: No DASHBOARD_API_KEYS configured. All dashboard API requests will be rejected."
  );
}

export const config = {
  port: parseInt(optionalEnv("PORT", "4000"), 10),
  nodeEnv: optionalEnv("NODE_ENV", "development"),

  db: {
    path: path.resolve(optionalEnv("DB_PATH", "./data/gangster-bot.sqlite3")),
  },

  // Relay ("the mouth") — the dumb WhatsApp service this brain sends through.
  relay: {
    url: optionalEnv("RELAY_URL", "http://localhost:3000").replace(/\/$/, ""),
    apiKey: optionalEnv("RELAY_API_KEY", ""),
  },

  // Shared secret the relay must send on its inbound webhook calls.
  relayWebhookSecret: optionalEnv("RELAY_WEBHOOK_SECRET", ""),

  // Dashboard (Next.js) auth — simple API keys, one per deployment/admin tool.
  // The dashboard itself still gates human login via Firebase Auth; this key
  // just authenticates the Next.js server as a caller of this brain's API.
  dashboardApiKeys,

  // WhatsApp phone numbers that are always super_admin, not demotable via
  // the dashboard. Digits only, with country code.
  superAdminPhones: parsePhoneSet(optionalEnv("SUPER_ADMIN_PHONES", "")),

  logLevel: optionalEnv("LOG_LEVEL", "info"),
} as const;
