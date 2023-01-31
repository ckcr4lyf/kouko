import { Redis } from "ioredis";
import { performance } from "perf_hooks";
import { getLoggerV3 } from "../helpers/logger.js";

const THIRTY_ONE_MINUTES = 1000 * 60 * 31;
const TORRENTS_KEY = `TORRENTS`;

export const updateTorrent = (redisClient: Redis, infohash: string): void => {
    redisClient.zadd(TORRENTS_KEY, Date.now(), infohash);
}

export const getOldTorrents = (redisClient: Redis): Promise<string[]> => {
    return redisClient.zrangebyscore(TORRENTS_KEY, 0, Date.now() - THIRTY_ONE_MINUTES);
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

    while(true){
        countIterations += 1;
        [cursor, zSets] = await redisClient.scan(cursor, "MATCH", "*_seeders");
        // logger.info(`Got ${zSets.length} torrents (Cursor: ${cursor})`);

        const pipeline = redisClient.pipeline();

        for (let zSet of zSets){
            countZSets += 1;
            pipeline.zremrangebyscore(zSet, 0, Date.now() - THIRTY_ONE_MINUTES);
        }

        // logger.info(`Going to execute pipeline to cleanup`);
        await pipeline.exec();
        // logger.info(`Cleaned ${zSets.length} torrents`)

        if (cursor === "0"){
            logger.info(`cursor return to zero (seeders)`);
            break;
        }
    }

    while(true){
        countIterations += 1;
        [cursor, zSets] = await redisClient.scan(cursor, "MATCH", "*_leechers");
        // logger.info(`Got ${zSets.length} torrents (Cursor: ${cursor})`);

        const pipeline = redisClient.pipeline();

        for (let zSet of zSets){
            countZSets += 1;
            pipeline.zremrangebyscore(zSet, 0, Date.now() - THIRTY_ONE_MINUTES);
        }

        // logger.info(`Going to execute pipeline to cleanup`);
        await pipeline.exec();
        // logger.info(`Cleaned ${zSets.length} torrents`)

        if (cursor === "0"){
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
    
    const oldHashes = await getOldTorrents(redisClient);
    logger.info(`[clean job] Total ${oldHashes.length} torrents to clean`);

    const BATCH_SIZE = 1000;
    const batches = Math.ceil(oldHashes.length / BATCH_SIZE);

    for (let i = 0; i < batches; i++){
        const pipeline = redisClient.pipeline();
        const batchTorrents = oldHashes.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

        for (let oldHash of batchTorrents){
            pipeline.del(oldHash)
            pipeline.del(`${oldHash}_seeders`)
            pipeline.del(`${oldHash}_leechers`);
            pipeline.zrem(TORRENTS_KEY, oldHash);
        }
        
        await pipeline.exec();
    }

    const end = performance.now();
    logger.info(`[clean job] Completed. Total time taken: ${(end - start).toFixed(2)}ms.`);
}