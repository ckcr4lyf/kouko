import { client } from '../../db/redis';
import { Request, Response } from 'express';
import { urlHashToHexString } from '../../helpers/byteFunctions';
import { scrapeReply } from '../../helpers/bencodedReplies';
import { scrapeLogger } from '../../helpers/logger';

// import 

export default async (req: Request, res: Response) => {

    const query = req.query;
    const userAgent = req.headers['user-agent'];
    const infohash = query.info_hash;

    if (!infohash){
        return res.status(400).send();
    }

    if (typeof infohash !== 'string'){
        console.log(infohash);
        return res.status(400).send();
    }

    const cleaned = urlHashToHexString(infohash).toLowerCase();

    if (cleaned.length !== 40){
        return res.status(400).send();
    }

    scrapeLogger.log(cleaned, `Scrape request from  ${userAgent} @ ${req.ip}`);
    const stats: string[] = await client.hmgetAsync(cleaned, 'seeders', 'leechers', 'downloaded');
    const cleanedStats = stats.map(value => value === null ? '0' : value);
    const reply = scrapeReply(cleaned, cleanedStats[0], cleanedStats[1], cleanedStats[2]);
    res.send(reply);
}