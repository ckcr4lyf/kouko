import { Request, Response } from 'express';
import { checkAnnounceParameters } from '../../helpers/announceFunctions';
import { trackerError, announceReply } from '../../helpers/bencodedReplies';
import { ipv4ToBytes, redisToPeers } from '../../helpers/byteFunctions';
import redis from '../../db/redis';
import { shuffle } from '../../helpers/shuffle';
import { incrAnnounce, incrBadAnnounce } from '../../helpers/promExporter';
import { performance } from 'perf_hooks';
import { getLogger } from '../../helpers/logger';
import { updateTorrent } from '../../db/redis-di';

export default async (req: Request, res: Response) => {

    const start = performance.now();

    const ip = req.ip;

    if (ip === undefined){
        return;
    }
    
    const query = req.query;
    const result = checkAnnounceParameters(query);

    if (result === false){
        incrBadAnnounce();
        res.send(trackerError('Bad Announce Request'));
        res.socket?.end();
        return;
    }

    updateTorrent(redis, result.infohash);
    
    const peerAddress = Buffer.concat([ipv4ToBytes(ip), result.port]);

    const score = Date.now();
    const THIRTY_ONE_MINUTES = 1000 * 60 * 31;

    // Get all seeders & leechers that have announced in the past TWO_HOURS
    const leechers = await redis.zrangebyscoreBuffer(`${result.infohash}_leechers`, score - THIRTY_ONE_MINUTES, score);
    const seeders = await redis.zrangebyscoreBuffer(`${result.infohash}_seeders`, score - THIRTY_ONE_MINUTES, score);

    // If they exist in redis, set to 0, else 1
    const existingSeeder = seeders.some(seeder => seeder === peerAddress)
    const existingLeecher = leechers.some(leecher => leecher === peerAddress)

    // Based on this announce, how we change the stats for scrape
    let seedCountMod = 0;
    let leechCountMod = 0;

    shuffle(leechers);
    shuffle(seeders);

    if (result.event === 'stopped'){

        // NOT a NEW seeder, so we need to remove
        if (existingSeeder === true){
            redis.zrem(`${result.infohash}_seeders`, peerAddress);
            seedCountMod -= 1;
        }

        if (existingLeecher === true){
            redis.zrem(`${result.infohash}_leechers`, peerAddress);
            leechCountMod -= 1;
        }

        const reply = announceReply(seeders.length + seedCountMod, leechers.length + leechCountMod, []);
        res.send(reply);        
    } else if (result.left === 0){

        // Has the complete file

        // A NEW seeder
        if (existingSeeder === false){
            redis.zaddBuffer(`${result.infohash}_seeders`, score, peerAddress);
            seedCountMod += 1;
        }

        if (result.event === 'completed'){
            
            // Not a NEW leecher, so we need to remove
            if (existingLeecher === true){
                redis.zrem(`${result.infohash}_leechers`, peerAddress);
                leechCountMod -= 1;
            }

            redis.hincrby(`${result.infohash}`, 'downloaded', 1);
        }

        const reply = announceReply(seeders.length + seedCountMod, leechers.length + leechCountMod, [...leechers.slice(0, 50), ...seeders.slice(0, 50)]);
        res.send(reply);
    } else {
        
        // A NEW leecher
        if (existingLeecher === false){
            redis.zaddBuffer(`${result.infohash}_leechers`, score, peerAddress);
            leechCountMod += 1;
        }

        const reply = announceReply(seeders.length + seedCountMod, leechers.length + leechCountMod, [...leechers.slice(0, 50), ...seeders.slice(0, 50)]);
        res.send(reply);
        res.socket?.end();
    }

    if (Math.random() < 0.001){
        //0.1% chance to trigger a clean
        const cleanLogger = getLogger('clean');
        cleanLogger.info(`Removing stale peers`, { infohash: result.infohash });
        // redis.zremrangebyscore(`${result.infohash}_leechers`, 0, score - THIRTY_ONE_MINUTES);
        // redis.zremrangebyscore(`${result.infohash}_seeders`, 0, score - THIRTY_ONE_MINUTES);
    }

    redis.hmset(`${result.infohash}`, 'seeders', seeders.length + seedCountMod, 'leechers', leechers.length + leechCountMod);
    const end = performance.now();
    const timeFloored = Math.floor(end - start);
    incrAnnounce(timeFloored);
    return;
}