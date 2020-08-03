import { Request, Response } from 'express';
import { checkAnnounceParameters } from '../../helpers/announceFunctions';
import { trackerError, announceReply } from '../../helpers/bencodedReplies';
import { ipv4ToBytes, redisToPeers } from '../../helpers/byteFunctions';
import { client } from '../../db/redis';
import { shuffle } from '../../helpers/shuffle';

export default async (req: Request, res: Response) => {

    const userAgent = req.headers['user-agent'];
    const ip = req.ip;

    console.log(`Incoming announce from ${userAgent} @ ${ip}`);
    const query = req.query;

    const result = checkAnnounceParameters(query);

    if (result === false){
        return res.send(trackerError('Bad Announce Request'));
    } else {
        // console.log(result);
        // res.send(trackerError('All good!'));
    }

    const peerAddress = Buffer.concat([ipv4ToBytes(ip), result.port]);
    // console.log(peerAddress, peerAddress.toString(), peerAddress.toString('latin1'));

    const score = Date.now();
    const TWO_HOURS = 1000 * 60 * 60 * 2;

    // const leechers: string[] = await client.zrevrangebyscoreAsync(`${result.infohash}_leechers`, score, score - TWO_HOURS, 'limit', 0, 50);
    const leechers: string[] = await client.zrevrangebyscoreAsync(`${result.infohash}_leechers`, score, score - TWO_HOURS);
    const seeders: string[] = await client.zrevrangebyscoreAsync(`${result.infohash}_seeders`, score, score - TWO_HOURS);

    shuffle(leechers);
    shuffle(seeders);

    if (result.event === 'stopped'){
        //Remove this guy from the pool. Two async calls ezpz
        client.zrem(`${result.infohash}_seeders`, peerAddress.toString('latin1'));
        client.zrem(`${result.infohash}_leechers`, peerAddress.toString('latin1'));
        
    } else if (result.left === 0){

        await client.zaddAsync(`${result.infohash}_seeders`, score, peerAddress.toString('latin1'));

        if (result.event === 'completed'){
            //Remove from leechers
            client.zrem(`${result.infohash}_leechers`, peerAddress.toString('latin1'));
        }

        // console.log(`Nothing left. Leechers =`, redisToPeers(leechers));

        const reply = announceReply(seeders.length, leechers.length, redisToPeers(leechers.slice(0, 50)));
        // console.log(reply);
        res.send(reply);
    } else {
        await client.zaddAsync(`${result.infohash}_leechers`, score, peerAddress.toString('latin1'));
        // console.log(`We've ${result.left} left. Leechers =`, redisToPeers(leechers), `and Seeders=`, redisToPeers(seeders));

        const reply = announceReply(seeders.length, leechers.length, redisToPeers([...leechers.slice(0, 50), ...seeders.slice(0, 50)]));
        // console.log(reply);
        res.send(reply);
    }

    if (Math.random() < 0.1){
        //10% chance to trigger a clean
        console.log(`Cleaning up ${result.infohash}`);
        client.zremrangebyscore(`${result.infohash}_leechers`, 0, score - TWO_HOURS);
        client.zremrangebyscore(`${result.infohash}_seeders`, 0, score - TWO_HOURS);
    }

    return;

    client.zrevrangebyscore(result.infohash, score, score - TWO_HOURS, 'withscores', (a, b) => {
        console.log(a, b);

        for (let x = 0; x < b.length; x+= 2){
            console.log(`Peer ${Buffer.from(b[x], 'latin1').toString('hex')} has score ${b[x+1]}`);
        }
        // for (let x of b){
        //     console.log(Buffer.from(x, 'latin1'));
        // }
        client.zadd(result.infohash, score, peerAddress.toString('latin1'), r => {
            console.log(r);
        });
    })

    return;
}