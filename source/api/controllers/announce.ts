import { Request, Response } from 'express';
import { checkAnnounceParameters } from '../../helpers/announceFunctions';
import { trackerError, announceReply } from '../../helpers/bencodedReplies';
import { ipv4ToBytes, redisToPeers } from '../../helpers/byteFunctions';
import redis from '../../db/redis';
import { shuffle } from '../../helpers/shuffle';
import { incrAnnounce, incrBadAnnounce } from '../../helpers/promExporter';
import { performance } from 'perf_hooks';
import { getLogger } from '../../helpers/logger';

export default async (req: Request, res: Response) => {

    const start = performance.now();

    const ip = req.ip;
    const query = req.query;
    const result = checkAnnounceParameters(query);

    if (result === false){
        incrBadAnnounce();
        res.send(trackerError('Bad Announce Request'));
        res.socket.end();
        return;
    }

    const peerAddress = Buffer.concat([ipv4ToBytes(ip), result.port]);

    const score = Date.now();
    const TWO_HOURS = 1000 * 60 * 60 * 2;

    // Get all seeders & leechers that have announced in the past TWO_HOURS
    const leechers = await redis.zrangebyscore(`${result.infohash}_leechers`, score - TWO_HOURS, score);
    const seeders = await redis.zrangebyscore(`${result.infohash}_seeders`, score - TWO_HOURS, score);

    // If they exist in redis, set to 0, else 1
    const existingSeeder = seeders.some(seeder => seeder === peerAddress.toString('latin1'))
    const existingLeecher = leechers.some(leecher => leecher === peerAddress.toString('latin1'))

    // Based on this announce, how we change the stats for scrape
    let seedCountMod = 0;
    let leechCountMod = 0;

    shuffle(leechers);
    shuffle(seeders);

    if (result.event === 'stopped'){

        // NOT a NEW seeder, so we need to remove
        if (existingSeeder === true){
            redis.zrem(`${result.infohash}_seeders`, peerAddress.toString('latin1'));
            seedCountMod -= 1;
        }

        if (existingLeecher === true){
            redis.zrem(`${result.infohash}_leechers`, peerAddress.toString('latin1'));
            leechCountMod -= 1;
        }

        const reply = announceReply(seeders.length + seedCountMod, leechers.length + leechCountMod, []);
        res.send(reply);        
    } else if (result.left === 0){

        // Has the complete file

        // A NEW seeder
        if (existingSeeder === false){
            redis.zadd(`${result.infohash}_seeders`, score, peerAddress.toString('latin1'));
            seedCountMod += 1;
        }

        if (result.event === 'completed'){
            
            // Not a NEW leecher, so we need to remove
            if (existingLeecher === true){
                redis.zrem(`${result.infohash}_leechers`, peerAddress.toString('latin1'));
                leechCountMod -= 1;
            }

            redis.hincrby(`${result.infohash}`, 'downloaded', 1);
        }

        const reply = announceReply(seeders.length + seedCountMod, leechers.length + leechCountMod, redisToPeers([...leechers.slice(0, 50), ...seeders.slice(0, 50)]));
        res.send(reply);
    } else {
        
        // A NEW leecher
        if (existingLeecher === false){
            redis.zadd(`${result.infohash}_leechers`, score, peerAddress.toString('latin1'));
            leechCountMod += 1;
        }

        const reply = announceReply(seeders.length + seedCountMod, leechers.length + leechCountMod, redisToPeers([...leechers.slice(0, 50), ...seeders.slice(0, 50)]));
        res.send(reply);
        res.socket.end();
    }

    if (Math.random() < 0.001){
        //0.1% chance to trigger a clean
        const cleanLogger = getLogger('clean');
        cleanLogger.info(`Removing stale peers`, { infohash: result.infohash });
        redis.zremrangebyscore(`${result.infohash}_leechers`, 0, score - TWO_HOURS);
        redis.zremrangebyscore(`${result.infohash}_seeders`, 0, score - TWO_HOURS);
    }

    redis.hmset(`${result.infohash}`, 'seeders', seeders.length + seedCountMod, 'leechers', leechers.length + leechCountMod);
    const end = performance.now();
    const timeFloored = Math.floor(end - start);
    incrAnnounce(timeFloored);
    return;
}