import { Router } from 'express';
import { freecourseEnroll } from '../controllers/freecourseController';

const router = Router();

router.post('/freecourse/enroll', freecourseEnroll);

export default router;
