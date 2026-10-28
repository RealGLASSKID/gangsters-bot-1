import Redis from "ioredis";
import { logger } from "./utils/logger";

let client: Redis | null = null;

export function redisUrl(): string {
  return (process.env.REDIS_URL || "").trim();
}

export function hasRedis(): boolean {
  return Boolean(redisUrl());
}

export function getRedis(): Redis {
  if (client) return client;

  const url = redisUrl();
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }

  client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on("error", (err) => logger.error(err, "redis"));
  client.on("connect", () => logger.info("Redis connected"));

  return client;
}

export async function closeRedis(): Promise<void> {
  if (!client) return;
  await client.quit();
  client = null;
}
