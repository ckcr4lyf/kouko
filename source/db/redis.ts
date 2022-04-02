import Redis from 'ioredis';
import { getLogger } from '../helpers/logger';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

export const redis = new Redis(REDIS_PORT, REDIS_HOST);
const redisLogger = getLogger('redis');

redis.on('connect', () => {
    redisLogger.info(`Connected to redis at ${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on('error', error => {
    redisLogger.error(`Error from redis: ${error}`);
});

export default redis;
