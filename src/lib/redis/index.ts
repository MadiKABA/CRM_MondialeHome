import Redis from "ioredis";
import { logger } from "@/lib/logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null;
};

function createRedisClient(): Redis | null {
  // En dev sans Redis, retourner null
  if (process.env["NODE_ENV"] !== "production" && !process.env["REDIS_URL"]) {
    logger.warn("Redis disabled (dev mode, no REDIS_URL)");
    return null;
  }

  const client = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on("connect", () => logger.info("Redis connected"));
  client.on("error", (err) => logger.error({ err }, "Redis error"));
  client.on("reconnecting", () => logger.warn("Redis reconnecting"));

  return client;
}

export const redis = (globalForRedis.redis ?? createRedisClient()) as Redis | null;

if (process.env["NODE_ENV"] !== "production") {
  globalForRedis.redis = redis;
}
