import * as winston from 'winston';

export const winstonConfig = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf((info) => {
      return `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`;
    }),
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/global.log' }),
    new winston.transports.Console(),
  ],
});
