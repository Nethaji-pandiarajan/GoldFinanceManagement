const express = require("express");
const router = express.Router();
const utilityController = require("../controllers/utility.controller");
const customerController = require("../controllers/customer.controller");
const ornamentController = require("../controllers/ornament.controller");
const karatController = require("../controllers/karat.controller");

router.post("/check-email", utilityController.checkEmail);
router.post("/check-phone", utilityController.checkPhone);
router.post('/check-proof-id', utilityController.checkProofId);

router.get("/customers-list", customerController.getCustomersList);
router.get("/ornaments-list", ornamentController.getOrnamentsList);
router.get("/karats-list", karatController.getKaratsList);
router.get("/nominees-list", utilityController.getNomineesList);
module.exports = router;