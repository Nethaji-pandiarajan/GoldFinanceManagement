// backend/middleware/roleMiddleware.js

const logger = require("../config/logger");

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      logger.warn(`[AUTH] Role check failed: No user or role found in request.`);
      return res.status(403).json({ message: "Access denied. No role specified." });
    }

    const userRole = req.user.role;
    if (roles.includes(userRole)) {
      next(); // Role is allowed, proceed to the next middleware/controller
    } else {
      logger.warn(`[AUTH] Unauthorized access attempt by user '${req.user.username}' (Role: ${userRole}). Required roles: ${roles.join(', ')}.`);
      return res.status(403).json({ message: "Forbidden. You do not have the required permissions." });
    }
  };
};

module.exports = checkRole;