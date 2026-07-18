import cors from "cors";
import express, { Request, Response } from "express";
import morgan from "morgan";
import logger from "./config/logger";
import newsRoutes from "./routes/newsRoute";
import dividendsRoutes from "./routes/dividendsRoute";
import healthRoute from "./routes/healthRoute";
import metricsRoute from "./routes/metricsRoute";
import { metricsMiddleware } from "./middlewares/metrics";
import { errorHandler } from "./middlewares/errorHandler";
import { requestTimeout } from "./middlewares/requestTimeout";
import { rateLimiter } from "./middlewares/rateLimiter";
import { resHandler } from "./middlewares/resHandler";
import { apiKeyAuth } from "./middlewares/apiKeyAuth";
import stocksRoute from "./routes/stocksRoute";
import courseRoute from "./routes/courseRoute";
import ticketsRoute from "./routes/ticketsRoute";
import freecourseRoute from "./routes/freecourseRoute";
import fixedDepositRoute from "./routes/fixedDepositRoute";
import fsmoneRoute from "./routes/fsmoneRoute";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3001" }));

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: { write: (message) => logger.http(message.trimEnd()) },
  }),
);

app.use(express.json());

app.use(resHandler);

// Record count + latency for every request
app.use(metricsMiddleware);

// Unauthenticated: must stay before apiKeyAuth for load balancer/uptime probes
app.use(healthRoute);
app.use(metricsRoute);

app.use(apiKeyAuth);

// Set a request timeout of 90 seconds for all incoming requests
app.use(requestTimeout(90_000));

app.use(rateLimiter);

// Routes
app.use("/api/v1", newsRoutes);
app.use("/api/v1", dividendsRoutes);
app.use("/api/v1", stocksRoute);
app.use("/api/v1", courseRoute);
app.use("/api/v1", ticketsRoute);
app.use("/api/v1", freecourseRoute);
app.use("/api/v1", fixedDepositRoute);
app.use("/api/v1", fsmoneRoute);

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, TypeScript + Node.js + Express!");
});

// Global error handler (must be last, after all routes)
app.use(errorHandler);

export default app;
