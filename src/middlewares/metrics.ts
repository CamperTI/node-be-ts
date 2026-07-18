import { Request, Response, NextFunction } from "express";
import { httpRequestsTotal, httpRequestDuration } from "../config/metrics";

// Records count + latency for every request once the response finishes.
// Uses the matched route pattern (not the raw URL) to keep label cardinality low.
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    // e.g. "/api/v1/stocks/:stockCode" instead of "/api/v1/stocks/AAPL"
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.baseUrl || req.path;

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    end(labels);
  });

  next();
};
