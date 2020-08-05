import { Router } from 'express';
import morgan from 'morgan';

import announceHandler from './controllers/announce';
import scrapeHandler from './controllers/scrape';

const router = Router();

router.get('/announce', announceHandler);

router.use(morgan(':remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms (:user-agent)'))
router.get('/scrape', scrapeHandler);

//Handle all other requests
router.use('/', (req, res, next) => {
    res.sendStatus(204);
})

export default router;