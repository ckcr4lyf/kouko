import Redis from 'ioredis';
import Logger from '../helpers/logger';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

const redis = new Redis(REDIS_PORT, REDIS_HOST);
const redisLogger = new Logger('REDIS');

redis.on('connect', () => {
    redisLogger.log('REDIS', `Connected to redis!`);
});

redis.on('error', error => {
    redisLogger.log('REDIS', `Error from redis: ${error}`);
});

export default redis;