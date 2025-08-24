import { Router } from 'express';
import {
  hotSinChew,
  sinChew,
  testSinChew,
} from '../controllers/sinChewControllers';
import { chinapress } from '../controllers/chinapressController';
import { nanyang } from '../controllers/nanyangController';
import { guangming } from '../controllers/guangmingController';
import { kwongwah } from '../controllers/kwongwahController';
import { theedgemarket } from '../controllers/theedgemarketController';
import { juejin } from '../controllers/juejinController';

const router = Router();

router.get('/test-sinchew', testSinChew);
router.get('/sinchew', sinChew);
router.get('/hot-sinchew', hotSinChew);

router.get('/chinapress', chinapress);

router.get('/nanyang', nanyang);

router.get('/guangming', guangming);

router.get('/kwongwah', kwongwah);

router.get('/theedgemarket', theedgemarket);

router.get('/juejin', juejin);

export default router;
