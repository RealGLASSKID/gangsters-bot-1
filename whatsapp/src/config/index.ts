import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

function parseApiKeys(raw: string): Set<string> {
  return new Set(
    raw
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
  );
}

const apiKeysRaw = process.env.RELAY_API_KEYS || process.env.RELAY_API_KEY || '';
const apiKeys = parseApiKeys(apiKeysRaw);

if (apiKeys.size === 0 && process.env.NODE_ENV !== 'test') {
  console.warn(
    '[config] WARNING: No RELAY_API_KEYS configured. All authenticated requests will be rejected.'
  );
}

// BACKEND_URL is the "brain" that receives inbound WhatsApp messages —
// e.g. your Next.js app's API route. This relay knows nothing about
// what the backend does with them.
const backendUrl = optionalEnv('BACKEND_URL', 'http://localhost:3001').replace(/\/$/, '');
const backendInboundPath = optionalEnv('BACKEND_INBOUND_PATH', '/api/whatsapp/inbound');

export const config = {
  port: parseInt(optionalEnv('PORT', '5000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',

  apiKeys,

  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  },

  rateLimit: {
    max: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),
    windowSeconds: parseInt(optionalEnv('RATE_LIMIT_WINDOW_SECONDS', '900'), 10),
  },

  whatsapp: {
    sessionPath: path.resolve(
      optionalEnv('WHATSAPP_SESSION_PATH', './.wwebjs_auth')
    ),
    // Used to normalize inbound numbers on @lid payloads, which WhatsApp
    // sometimes sends without a resolvable phone number. If a local-format
    // number (leading 0, 11 digits) shows up, this prefix replaces the 0.
    // Set to your primary market's country code, or '' to disable normalization.
    defaultCountryCode: optionalEnv('WHATSAPP_DEFAULT_COUNTRY_CODE', '234'),
  },

  backend: {
    apiUrl: backendUrl,
    inboundUrl: `${backendUrl}${backendInboundPath}`,
    webhookSecret: optionalEnv('BACKEND_WEBHOOK_SECRET', ''),
  },

  logLevel: optionalEnv('LOG_LEVEL', 'info'),
} as const;

export type Config = typeof config;
