import { Redis } from "ioredis";
import { performance } from "perf_hooks";
import { getLogger } from "../helpers/logger";

const TORRENTS_KEY = `TORRENTS`;

export const updateTorrent = (redisClient: Redis, infohash: string): void => {
    redisClient.zadd(TORRENTS_KEY, Date.now(), infohash);
}

export const getOldTorrents = (redisClient: Redis): Promise<string[]> => {
    const THIRTY_ONE_MINUTES = 1000 * 60 * 31;
    return redisClient.zrangebyscore(TORRENTS_KEY, 0, Date.now() - THIRTY_ONE_MINUTES);
}

export const cleanTorrentData = async (redisClient: Redis, infohash: string): Promise<void> => {
    await redisClient.del([infohash, `${infohash}_seeders`, `${infohash}_leechers`]);
    await redisClient.zrem(TORRENTS_KEY, infohash);
}

export const getActiveTorrentCount = async (redisClient: Redis): Promise<number> => {
    return redisClient.zcount(TORRENTS_KEY, '-inf', '+inf');
}

export const cleanJob = async (redisClient: Redis): Promise<void> => {
    const logger = getLogger(`Redis.cleanJob`);
    logger.info(`Starting`);
    const start = performance.now();
    const oldHashes = await getOldTorrents(redisClient);
    logger.info(`Total ${oldHashes.length} torrents to clean`);

    // const batches = Math.ceil(oldHashes)

    await Promise.all(oldHashes.map(oldHash => cleanTorrentData(redisClient, oldHash)));
    const end = performance.now();
    logger.info(`Completed. Total time taken: ${(end - start).toFixed(2)}ms.`);
}