const express = require("express");
const router = express.Router();
const investmentController = require("../controllers/investment.controller");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");

router.use(authMiddleware, checkRole(['super_admin']));

router.get("/", investmentController.getInvestmentData);
router.post("/", investmentController.addInvestment);

module.exports = router;