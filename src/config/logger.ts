import dotenv from "dotenv";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

dotenv.config();

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}]: ${message}${extra}`;
  }),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "http",
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      format: jsonFormat,
      maxFiles: "7d",
    }),
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      format: jsonFormat,
      maxFiles: "7d",
    }),
  ],
});

export default logger;
