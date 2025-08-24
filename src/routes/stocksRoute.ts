import { Router } from 'express';
import { stocks } from '../controllers/stockController';

const router = Router();

router.get('/stocks/:stockCode', stocks);

export default router;
