const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/stats", authMiddleware, dashboardController.getDashboardStats);

module.exports = router;