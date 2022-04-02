import { cleanJob } from '../db/redis-di.js';
import { redis } from '../db/redis.js';

cleanJob(redis);