import { cleanPeers } from '../db/redis-di.js';
import { redis } from '../db/redis.js';

cleanPeers(redis);