import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import * as path from "path";
import * as util from "util";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type WorkerName = "create-post" | "notify-followers" | "delete-post" | (string & {});

export function getWorkerLogger(workerName: WorkerName) {
  const istTimestamp = format(info => {
    info.timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });
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
    const logDir = path.join(__dirname, "..", "..", "..", "logs", "workers", workerName);
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

  return {
    logInfo: (...args: unknown[]) => logger.info(util.format(...args)),
    logError: (...args: unknown[]) => logger.error(util.format(...args)),
  };
}
