import { cleanJob } from '../db/redis-di.js';
import { redis } from '../db/redis.js';

await cleanJob(redis);

process.exit(0);