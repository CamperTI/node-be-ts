import { Router } from 'express';
import { dividends } from '../controllers/dividendsController';

const router = Router();

router.get('/dividends', dividends);

export default router;
