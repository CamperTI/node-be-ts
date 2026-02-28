import { Router } from "express";
import { getFixedDepositRates } from "../controllers/fixedDepositController";

const router = Router();

router.get("/fixed-deposit", getFixedDepositRates);

export default router;
