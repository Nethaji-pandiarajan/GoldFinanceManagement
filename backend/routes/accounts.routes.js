const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accounts.controller');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require("../middleware/roleMiddleware");

router.get('/',authMiddleware, checkRole(['super_admin']), accountsController.getAccountsSummary);

module.exports = router;