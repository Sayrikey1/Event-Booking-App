import winston from 'winston';

// Define log format
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Create the logger instance
const logger = winston.createLogger({
  level: 'info', // Default log level
  format: winston.format.combine(
    winston.format.timestamp(),
    logFormat
  ),
  transports: [
    // Console logging in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File logging in production
    new winston.transports.File({
      filename: 'logs/application.log',
      level: 'info', // Only log `info` level and above to the file
    }),
  ],
});

// If running in production, ensure logs are stored in a file
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ filename: 'logs/application.log' }));
}

export default logger;
