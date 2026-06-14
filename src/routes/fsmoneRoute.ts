import { Router } from 'express';
import { getFundPrice } from '../controllers/fsmoneController';

const router = Router();

// GET /api/v1/fund-price?fund=MYKNGAPTR&slug=kenanga-asia-pacific-total-return-fund
router.get('/fund-price', getFundPrice);

export default router;
