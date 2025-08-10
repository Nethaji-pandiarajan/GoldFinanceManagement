const express = require("express");
const router = express.Router();
const loanController = require("../controllers/loan.controller");
const upload = require("../middleware/upload.middleware");

router.get("/pending", loanController.getPendingLoans);
router.get("/closed", loanController.getClosedLoans);

router.get("/", loanController.getAllLoans);
router.post("/", upload.loanImages, loanController.createLoan);
router.get("/:id", loanController.getLoanById);
router.delete("/:id", loanController.deleteLoanById);
router.post("/:id/payment", loanController.recordPayment);

module.exports = router;