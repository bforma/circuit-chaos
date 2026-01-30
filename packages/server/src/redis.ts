import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!REDIS_URL) {
    console.log('No REDIS_URL configured, using in-memory storage');
    return null;
  }

  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
