const jwt = require("jsonwebtoken");
const { logger } = require("../config/logger");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");

  if (!token) {
    logger.info("[AUTH] Access denied. No token provided.");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    logger.info(`[AUTH] Invalid token received.`);
    res.status(401).json({ message: "Token is not valid" });
  }
};
