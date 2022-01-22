import { Redis } from "ioredis";
import { performance } from "perf_hooks";
import { getLogger } from "../helpers/logger";

const TORRENTS_KEY = `TORRENTS`;

export const updateTorrent = (redisClient: Redis, infohash: string): void => {
    redisClient.zadd(TORRENTS_KEY, Date.now(), infohash);
}

export const getOldTorrents = (redisClient: Redis): Promise<string[]> => {
    const TWO_HOURS = 1000 * 60 * 60 * 2;
    return redisClient.zrangebyscore(TORRENTS_KEY, 0, Date.now() - TWO_HOURS);
}

export const cleanTorrentData = async (redisClient: Redis, infohash: string): Promise<void> => {
    await redisClient.del([infohash, `${infohash}_seeders`, `${infohash}_leechers`]);
    await redisClient.zrem(TORRENTS_KEY, infohash);
}

export const cleanJob = async (redisClient: Redis): Promise<void> => {
    const logger = getLogger(`Redis.cleanJob`);
    logger.info(`Starting`);
    const start = performance.now();
    const oldHashes = await getOldTorrents(redisClient);
    logger.info(`Total ${oldHashes.length} torrents to clean`);
    await Promise.all(oldHashes.map(oldHash => cleanTorrentData(redisClient, oldHash)));
    const end = performance.now();
    logger.info(`Completed. Total time taken: ${(end - start).toFixed(2)}ms.`);
}