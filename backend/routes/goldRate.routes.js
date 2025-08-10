const express = require("express");
const router = express.Router();
const goldRateController = require("../controllers/goldRate.controller");

router.get("/", goldRateController.getAllGoldRates);
router.post("/", goldRateController.createGoldRate);
router.put("/:id", goldRateController.updateGoldRateById);

module.exports = router;