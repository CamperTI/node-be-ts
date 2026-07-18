import { Registry, Counter, Histogram, collectDefaultMetrics } from "prom-client";

// Single registry for the whole process
export const registry = new Registry();

// Node process / GC / event-loop metrics out of the box
collectDefaultMetrics({ register: registry });

// Total HTTP requests, labelled by route, method and status class
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [registry],
});

// Request latency in seconds
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

// Cache lookups, labelled by result (hit/miss)
export const cacheOperationsTotal = new Counter({
  name: "cache_operations_total",
  help: "Total number of cache get operations by result",
  labelNames: ["result"] as const, // "hit" | "miss"
  registers: [registry],
});
