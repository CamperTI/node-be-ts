import { Router } from 'express';
import { ticketmaster } from '../controllers/ticketmasterController';

const router = Router();

router.get('/ticketmaster', ticketmaster);

export default router;
