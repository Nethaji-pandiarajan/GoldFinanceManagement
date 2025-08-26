// backend/routes/machine.routes.js

const express = require("express");
const router = express.Router();
const machineController = require("../controllers/machine.controller");
const checkRole = require("../middleware/roleMiddleware");


router.get("/", machineController.getAllAllowedMachines);
router.post("/",machineController.addAllowedMachine);
router.delete("/:id", machineController.deleteAllowedMachine);

module.exports = router;