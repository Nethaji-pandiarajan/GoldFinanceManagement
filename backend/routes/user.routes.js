const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/authMiddleware");
router.get("/investments", authMiddleware, userController.getUsersWithInvestments);
router.post("/investments", authMiddleware, userController.updateUserInvestment);
router.get("/me", authMiddleware, userController.getMyProfile);
router.put("/me", authMiddleware, userController.updateMyProfile);
module.exports = router;