import { Client, QueryResult } from 'pg';
import { getLoggerV3 } from '../helpers/logger.js';
import { Redis } from 'ioredis';

type row = {
    infohash: Buffer;
}

const THIRTY_ONE_MINUTES = 1000 * 60 * 31;
export const getOldTorrents = (client: Client): Promise<QueryResult<row>> => {
    return client.query<row>(`SELECT infohash FROM torrents WHERE last_announce < $1`, [Date.now() - THIRTY_ONE_MINUTES]);
}

export const cleanJob = async(client: Client, redisClient: Redis): Promise<void> => {
    const logger = getLoggerV3();

    logger.info(`going to query db`);

    const r = await getOldTorrents(client);

    // console.log(r);

    logger.info(`got ${r.rowCount} torrents.`);

    if (r.rowCount === null){
        logger.error(`no rows`);
        return;
    }

    const BATCH_SIZE = 1000;
    const batches = Math.ceil(r.rowCount / BATCH_SIZE);

    for (let i = 0; i < r.rowCount; i++){
        const infohash = r.rows[i].infohash.toString();
        const pipeline = redisClient.pipeline();
        
        pipeline.del(infohash);
        pipeline.del(`${infohash}_seeders`);
        pipeline.del(`${infohash}_leechers`);

        await pipeline.exec();
        await client.query(`DELETE FROM torrents WHERE infohash = $1`, [infohash]);
    }
}