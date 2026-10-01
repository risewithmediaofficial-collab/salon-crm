import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import env from '../config/environment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logDir = path.resolve(__dirname, '../../', env.LOG_DIR);

const { combine, timestamp, json, colorize, simple, errors } = winston.format;

const fileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: combine(errors({ stack: true }), timestamp(), json()),
});

const errorFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: combine(errors({ stack: true }), timestamp(), json()),
});

const transports = [fileTransport, errorFileTransport];

if (env.isDevelopment()) {
  transports.push(
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    })
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports,
  exitOnError: false,
});

export default logger;
