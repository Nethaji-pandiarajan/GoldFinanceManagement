const logger = require('../config/logger');
const errorHandler = (err, req, res, next) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    message: 'An unexpected error occurred on the server. Please try again later.'
  });
};

module.exports = errorHandler;