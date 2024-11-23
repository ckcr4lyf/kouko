import { Redis } from "ioredis";
import { performance } from "perf_hooks";
import { getLoggerV3 } from "../helpers/logger.js";

const THIRTY_ONE_MINUTES = 1000 * 60 * 31;
const ONE_HOUR = 1000 * 60 * 60;
const TORRENTS_KEY = `TORRENTS`;

export const updateTorrent = (redisClient: Redis, infohash: string): void => {
    redisClient.zadd(TORRENTS_KEY, Date.now(), infohash);
}

export const getOldTorrents = (redisClient: Redis): Promise<string[]> => {
    return redisClient.zrangebyscore(TORRENTS_KEY, 0, Date.now() - THIRTY_ONE_MINUTES);
}

export const getOldTorrentsBuffer = (redisClient: Redis, offset: number, count: number): Promise<Buffer[]> => {
    return redisClient.zrangebyscoreBuffer(TORRENTS_KEY, 0, Date.now() - THIRTY_ONE_MINUTES, 'LIMIT', offset, count);
}

export const cleanTorrentData = async (redisClient: Redis, infohash: string): Promise<void> => {
    await redisClient.del([infohash, `${infohash}_seeders`, `${infohash}_leechers`]);
    await redisClient.zrem(TORRENTS_KEY, infohash);
}

export const getActiveTorrentCount = async (redisClient: Redis): Promise<number> => {
    return redisClient.zcount(TORRENTS_KEY, '-inf', '+inf');
}

// only for testing...
const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve, _) => {
        setTimeout(resolve, ms);
    })
}

export const cleanPeers = async (redisClient: Redis) => {
    const logger = getLoggerV3();
    const start = performance.now();
    logger.info(`[clean peers] starting`);

    let cursor = "0";
    let zSets = [];
    let countIterations = 0;
    let countZSets = 0;

    while (true) {
        countIterations += 1;
        [cursor, zSets] = await redisClient.scan(cursor, "MATCH", "*_seeders");
        // logger.info(`Got ${zSets.length} torrents (Cursor: ${cursor})`);

        const pipeline = redisClient.pipeline();

        for (let zSet of zSets) {
            countZSets += 1;
            pipeline.zremrangebyscore(zSet, 0, Date.now() - ONE_HOUR);
        }

        // logger.info(`Going to execute pipeline to cleanup`);
        await pipeline.exec();
        // logger.info(`Cleaned ${zSets.length} torrents`)

        if (cursor === "0") {
            logger.info(`cursor return to zero (seeders)`);
            break;
        }
    }

    while (true) {
        countIterations += 1;
        [cursor, zSets] = await redisClient.scan(cursor, "MATCH", "*_leechers");
        // logger.info(`Got ${zSets.length} torrents (Cursor: ${cursor})`);

        const pipeline = redisClient.pipeline();

        for (let zSet of zSets) {
            countZSets += 1;
            pipeline.zremrangebyscore(zSet, 0, Date.now() - ONE_HOUR);
        }

        // logger.info(`Going to execute pipeline to cleanup`);
        await pipeline.exec();
        // logger.info(`Cleaned ${zSets.length} torrents`)

        if (cursor === "0") {
            logger.info(`cursor return to zero (leechers)`);
            break;
        }
    }

    const end = performance.now();
    logger.info(`[clean peers] Completed. Total time taken: ${(end - start).toFixed(2)}ms.`);
    logger.info(`[clean peers] ${countIterations} SCANs done, and ${countZSets} ZSETS cleaned.`);

}

export const cleanJob = async (redisClient: Redis): Promise<void> => {
    const logger = getLoggerV3();
    logger.info(`[clean job] Starting`);
    const start = performance.now();

    let offset = 0;
    let cleanedCount = 0;
    const COUNT = 1000;
    const SEEDER_SUFFIX = Buffer.from("_seeders");
    const LEECHER_SUFFIX = Buffer.from("_leechers");

    while (true) {
        // logger.info(`offset: ${offset}`);
        const oldies = await getOldTorrentsBuffer(redisClient, offset, COUNT);

        if (oldies.length === 0) {
            logger.info(`no more! (offset=${offset})`);
            break;
        }

        const pipeline = redisClient.pipeline();
        for (let oldHash of oldies) {
            pipeline.del(oldHash)
            pipeline.del(Buffer.concat([oldHash, SEEDER_SUFFIX]));
            pipeline.del(Buffer.concat([oldHash, LEECHER_SUFFIX]));
            pipeline.zrem("TORRENTS", oldHash);
            cleanedCount++;
        }

        await pipeline.exec();
        offset += COUNT;
    }

    const end = performance.now();
    logger.info(`[clean job] Completed (${cleanedCount} total cleaned) Total time taken: ${(end - start).toFixed(2)}ms.`);
}