const express = require("express");
const router = express.Router();
const loanController = require("../controllers/loan.controller");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload.middleware");

router.get("/pending", authMiddleware, loanController.getPendingLoans);
router.get("/closed", authMiddleware, loanController.getClosedLoans);
router.get("/next-id", authMiddleware, loanController.getNextLoanId);
router.get("/calculation-data", authMiddleware, loanController.getCalculationData);

router.get("/", authMiddleware, loanController.getAllLoans);
router.post("/", authMiddleware, upload.loanImages, loanController.createLoan);

router.get("/:id/next-payment", authMiddleware, loanController.getNextPaymentDue); 
router.get("/:id", authMiddleware, loanController.getLoanById);
router.delete("/:id", authMiddleware, loanController.deleteLoanById);
router.post("/:id/payment", authMiddleware, loanController.recordPayment);


module.exports = router;