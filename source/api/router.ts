import express, { Router } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import announceHandler from './controllers/announce';
import scrapeHandler from './controllers/scrape';
import { checkAnnounceParameters } from '../helpers/announceFunctions';
import path from 'path';

const router = Router();

//Max 10 announces per 5 minutes, per torrent it shouldn't be more than 1 every 30 anyway.
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    keyGenerator: function (req) {
        const result = checkAnnounceParameters(req.query);
        if (result === false){
            return req.ip;
        } else {
            const key = `${req.ip}:${result.infohash}`;
            return key;
        }
    }
})

router.use('/announce', limiter);
router.get('/announce', announceHandler);
router.get('/scrape', scrapeHandler);

//Handle all other requests by redirect to index.html
// router.use(morgan(':remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms (:user-agent)'))
router.use('/', express.static(path.join(__dirname, '../../public')));

export default router;