import { Injectable, Logger } from "@nestjs/common";
import IORedis from "ioredis";
import type { Redis } from "ioredis";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly limits = new Map<string, RateLimitEntry>();
  private readonly MAX_FAILS = 5;
  private readonly WINDOW_MS = 5 * 60 * 1000;
  private readonly WINDOW_SECONDS = Math.ceil(this.WINDOW_MS / 1000);
  private readonly redis: Redis | null = null;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new IORedis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          connectTimeout: 2000,
        });
        // Do not await connect here — avoid blocking boot. Commands fall back
        // to the in-memory store when Redis is unreachable.
      } catch (error) {
        this.logger.warn(`[auth] Redis client could not be created, using in-memory rate limit: ${error}`);
        this.redis = null;
      }
    }
  }

  private key(email: string): string {
    return `ratelimit:${email.toLowerCase().trim()}`;
  }

  public async isRateLimited(email: string): Promise<boolean> {
    const key = this.key(email);
    if (this.redis) {
      try {
        const count = await this.redis.get(key);
        const c = count ? parseInt(count, 10) : 0;
        return c >= this.MAX_FAILS;
      } catch (error) {
        this.logger.warn(`[auth] rate limit Redis GET error, falling back to memory: ${error}`);
      }
    }
    const entry = this.limits.get(key);
    if (!entry) return false;
    const now = Date.now();
    if (now > entry.resetAt) {
      this.limits.delete(key);
      return false;
    }
    return entry.count >= this.MAX_FAILS;
  }

  public async recordFailure(email: string): Promise<void> {
    const key = this.key(email);
    if (this.redis) {
      try {
        const count = await this.redis.incr(key);
        if (count === 1) {
          await this.redis.expire(key, this.WINDOW_SECONDS);
        }
        return;
      } catch (error) {
        this.logger.warn(`[auth] rate limit Redis INCR error, falling back to memory: ${error}`);
      }
    }
    const now = Date.now();
    const entry = this.limits.get(key);
    if (!entry || now > entry.resetAt) {
      this.limits.set(key, { count: 1, resetAt: now + this.WINDOW_MS });
      return;
    }
    entry.count += 1;
    if (entry.count >= this.MAX_FAILS) {
      this.logger.warn(`[auth] rate limit hit for email ${key} (${entry.count} failures)`);
    }
  }

  public async reset(email: string): Promise<void> {
    const key = this.key(email);
    if (this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (error) {
        this.logger.warn(`[auth] rate limit Redis DEL error, falling back to memory: ${error}`);
      }
    }
    this.limits.delete(key);
  }
}
