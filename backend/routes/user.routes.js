const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

router.get("/processed-amounts", userController.getUsersProcessedAmounts);
router.post("/processed-amounts", userController.recordTransaction);

module.exports = router;