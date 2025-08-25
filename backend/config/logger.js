//config/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const os = require('os');
const fs = require('fs');
const documentsDir = path.join(os.homedir(), 'Documents');
const logDir = path.join(documentsDir, 'MaayaGoldFinanceLogs');
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create log directory:', logDir, error);
    logDir = 'logs'; 
  }
}
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
);

const infoTransport = new DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',  
  maxFiles: '14d',  
  level: 'info',  
});
const errorTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    logFormat
  )
});

const logger = winston.createLogger({
  format: logFormat,
  transports: [
    infoTransport,
    errorTransport,
    consoleTransport
  ],
  exitOnError: false
});

logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  },
};

module.exports = logger;