import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LEVELS[config.logLevel as LogLevel] ?? LEVELS.info;

function formatMessage(level: string, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    try {
      // Avoid logging sensitive data by stringifying carefully
      const safe = typeof meta === 'object' && meta !== null
        ? JSON.stringify(meta, (key, value) => {
            if (
              typeof key === 'string' &&
              (key.toLowerCase().includes('key') ||
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('secret') ||
                key.toLowerCase().includes('authorization') ||
                key.toLowerCase().includes('password'))
            ) {
              return '[REDACTED]';
            }
            return value;
          })
        : String(meta);
      return `${base} ${safe}`;
    } catch {
      return `${base} [unserializable]`;
    }
  }
  return base;
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    if (currentLevel <= LEVELS.debug) {
      console.debug(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: unknown): void {
    if (currentLevel <= LEVELS.info) {
      console.info(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: unknown): void {
    if (currentLevel <= LEVELS.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: unknown): void {
    if (currentLevel <= LEVELS.error) {
      console.error(formatMessage('error', message, meta));
    }
  },
};
