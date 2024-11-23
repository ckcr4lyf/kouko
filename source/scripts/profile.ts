/**
 * Used to profile via heaptrack
 * See: https://github.com/ckcr4lyf/kouko/issues/44
 */
import { getOldTorrents, getOldTorrentsBuffer } from '../db/redis-di.js';
import { redis } from '../db/redis.js';
import { performance } from "perf_hooks";
import { getLoggerV3 } from '../helpers/logger.js';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const start = performance.now();

const logger = getLoggerV3();
logger.info(`starting`);
// await sleep()
// const oldies = await getOldTorrentsBuffer(redis);

let offset = 0;
const COUNT = 1000;

const SEEDER_SUFFIX = Buffer.from("_seeders");
const LEECHER_SUFFIX = Buffer.from("_leechers");

while (true) {
    // logger.info(`offset: ${offset}`);
    const oldies = await getOldTorrentsBuffer(redis, offset, COUNT);    
    offset += COUNT;

    if (oldies.length === 0){
        logger.info(`no more! (offset=${offset})`);
        break;
    }

    const pipeline = redis.pipeline();

    for (let oldHash of oldies){
        pipeline.del(oldHash)
        pipeline.del(Buffer.concat([oldHash, SEEDER_SUFFIX]));
        pipeline.del(Buffer.concat([oldHash, LEECHER_SUFFIX]));
        pipeline.zrem("TORRENTS", oldHash);
    }
    
    await pipeline.exec();
}
// const oldies = await getOldTorrents(redis);
// logger.info(`got ${oldies.length} torrents`);

const end = performance.now();
logger.info(`[clean job] Completed. Total time taken: ${(end - start).toFixed(2)}ms.`);

process.exit(0);