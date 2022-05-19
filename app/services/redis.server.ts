import type { Redis as RedisType } from "ioredis";
import Redis from "ioredis";

let redis: RedisType;

declare global {
  var __redis: RedisType | undefined;
}

if (process.env.NODE_ENV === "production") {
  redis = new Redis(process.env.REDIS_URL);
} else {
  if (!global.__redis) {
    global.__redis = new Redis(process.env.REDIS_URL);
  }

  redis = global.__redis;
}

export { redis };
