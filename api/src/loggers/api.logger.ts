import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import * as path from "path";
import * as util from "util";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const istTimestamp = format(info => {
  const istDate = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });
  info.timestamp = istDate;
  return info;
});

const logger = createLogger({
  level: "info",
  format: format.combine(
    istTimestamp(),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}] ${message}`)
  ),
  transports: [],
});

if (process.env.MODE === "development") {
  const logDir = path.join(__dirname, "..", "..", "..", "logs", "api");
  fs.mkdirSync(logDir, { recursive: true });

  logger.add(
    new DailyRotateFile({
      dirname: logDir,
      filename: "info-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "info",
    })
  );

  logger.add(
    new DailyRotateFile({
      dirname: logDir,
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      level: "error",
    })
  );
} else {
  logger.add(new transports.Console({ format: format.combine(format.colorize(), istTimestamp(), format.simple()) }));
}

export function logApiInfo(...args: unknown[]) {
  logger.info(util.format(...args));
}

export function logApiError(...args: unknown[]) {
  logger.error(util.format(...args));
}
