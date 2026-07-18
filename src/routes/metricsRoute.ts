import { Router, Request, Response } from "express";
import { registry } from "../config/metrics";

const router = Router();

router.get("/metrics", async (_req: Request, res: Response) => {
  res.set("Content-Type", registry.contentType);
  res.send(await registry.metrics());
});

export default router;
