import { Router } from 'express';

import announceHandler from './controllers/announce';

const router = Router();

router.get('/announce', announceHandler);

export default router;