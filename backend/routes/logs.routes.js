const express = require("express");
const router = express.Router();
const logsController = require("../controllers/logs.controller");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");

router.get("/download/:type", authMiddleware, checkRole(['super_admin']), logsController.downloadLogs);

module.exports = router;