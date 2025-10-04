const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const fs = require("fs");
const supabase = require("./supabaseClient"); 

const BUCKET_NAME = "logs";
const SYNC_INTERVAL_MS = 10000; 

let logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function getCurrentLogFilename(prefix) {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return path.join(logDir, `${prefix}-${year}-${month}-${day}.log`);
}

async function syncLogFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }
    
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    if (fileContent.length === 0) {
      return;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileContent, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    console.log(`]: [Supabase Log writter] Successfully synced ${fileName} to Supabase.`);
  } catch (error) {
    console.error(`]: [Supabase Log writter] Failed to sync ${path.basename(filePath)} to Supabase:`, error.message);
  }
}

function syncAllLogs() {
    const infoLogPath = getCurrentLogFilename('application');
    const errorLogPath = getCurrentLogFilename('error');

    syncLogFile(infoLogPath);
    syncLogFile(errorLogPath);
}


const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

const infoTransport = new DailyRotateFile({
  filename: path.join(logDir, "application-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "20m",
  maxFiles: "3d",
  level: "info",
});

const errorTransport = new DailyRotateFile({
  filename: path.join(logDir, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "20m",
  maxFiles: "3d",
  level: "error",
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(winston.format.colorize(), logFormat),
});

const logger = winston.createLogger({
  format: logFormat,
  transports: [infoTransport, errorTransport, consoleTransport],
  exitOnError: false,
});

logger.stream = {
  write: function (message) {
    logger.info(message.trim());
  },
};

let syncIntervalId = null;
const startLogSync = () => {
    if (syncIntervalId) {
        console.warn('Log sync is already running.');
        return;
    }
    console.log(`]: [Supabase Log writter] Starting log sync to Supabase every ${SYNC_INTERVAL_MS / 1000} seconds.`);
    syncIntervalId = setInterval(syncAllLogs, SYNC_INTERVAL_MS);
};


module.exports = {
    logger,
    startLogSync
};