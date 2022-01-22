import redis from '../../db/redis';
import { Request, Response } from 'express';
import { urlHashToHexString } from '../../helpers/byteFunctions';
import { scrapeReply } from '../../helpers/bencodedReplies';
import { getLogger } from '../../helpers/logger';


export default async (req: Request, res: Response) => {

    const logger = getLogger('scrape');
    const query = req.query;
    const userAgent = req.headers['user-agent'];
    const infohash = query.info_hash;

    if (!infohash){
        return res.status(400).send();
    }

    if (typeof infohash !== 'string'){
        return res.status(400).send();
    }

    const cleaned = urlHashToHexString(infohash).toLowerCase();

    if (cleaned.length !== 40){
        return res.status(400).send();
    }

    // logger.info(`New scrape request`, {
    //     userAgent: userAgent,
    //     ip: req.ip,
    //     hash: cleaned
    // });

    const stats = await redis.hmget(cleaned, 'seeders', 'leechers', 'downloaded');
    const cleanedStats = stats.map(value => value === null ? '0' : value);
    const reply = scrapeReply(cleaned, cleanedStats[0], cleanedStats[1], cleanedStats[2]);
    res.send(reply);
    res.socket?.end();
}