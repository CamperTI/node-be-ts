import { Router } from 'express';
import { course } from '../controllers/courseController';

const router = Router();

router.get('/course', course);

export default router;
