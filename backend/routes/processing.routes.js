const express = require("express");
const router = express.Router();
const processingController = require("../controllers/processing.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", processingController.getProcessingData);

module.exports = router;