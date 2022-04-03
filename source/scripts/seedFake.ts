// Seeds a fake torrent with seeders & leechers in redis for stress testing later

import { randomBytes } from 'crypto';
import { redis } from '../db/redis.js';
import { getLogger } from '../helpers/logger.js';

// 100 seeders & 100 leechers

const TORRENT_HASH = `c341414141414141414141414141414141414142`;
const logger = getLogger('seedFake');

const timenow = Date.now();


(async () => {
    logger.info(`Starting seed`);

    for (let i = 0; i < 100; i++) {

        // 4 bytes IPv4 , 2 bytes port
        const fakeSeeder = randomBytes(6);
        await redis.zadd(`${TORRENT_HASH}_seeders`, timenow, fakeSeeder);

        const fakeLeecher = randomBytes(6);
        await redis.zadd(`${TORRENT_HASH}_leechers`, timenow, fakeLeecher);

    }
    logger.info(`finished`);

})();

