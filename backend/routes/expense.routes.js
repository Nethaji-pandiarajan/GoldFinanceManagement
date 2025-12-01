const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expense.controller");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");

router.use(authMiddleware, checkRole(['super_admin']));

router.get("/", expenseController.getExpensesGroupedByMonth);
router.post("/", expenseController.addExpense);

module.exports = router;