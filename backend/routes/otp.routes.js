const express = require("express");
const router = express.Router();
const otpController = require("../controllers/otp.controller.js");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/send", authMiddleware, otpController.sendOtp);
router.post("/verify", authMiddleware, otpController.verifyOtp);

module.exports = router;