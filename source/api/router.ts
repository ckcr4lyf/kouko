import { Router } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import announceHandler from './controllers/announce';
import scrapeHandler from './controllers/scrape';

const router = Router();

//Max 10 announces per 5 minutes, per torrent it shouldn't be more than 1 every 30 anyway.
//TODO: Limit based on IP + hash.
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10
})

router.use('/announce', limiter);
router.get('/announce', announceHandler);

router.use(morgan(':remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms (:user-agent)'))
router.get('/scrape', scrapeHandler);

//Handle all other requests
router.use('/', (req, res, next) => {
    res.sendStatus(204);
})

export default router;