// backend/routes/machine.routes.js

const express = require("express");
const router = express.Router();
const machineController = require("../controllers/machine.controller");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");

// Apply authentication to all routes in this file
router.use(authMiddleware);

// Define routes
router.get("/", checkRole(['super_admin']), machineController.getAllAllowedMachines);
router.post("/", checkRole(['super_admin']), machineController.addAllowedMachine);
router.delete("/:id", checkRole(['super_admin']), machineController.deleteAllowedMachine);

module.exports = router;