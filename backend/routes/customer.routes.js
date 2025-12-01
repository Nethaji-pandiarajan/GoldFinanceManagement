const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const upload = require("../middleware/upload.middleware");

router.get("/export", customerController.getAllCustomersForExport);

router.get("/", customerController.getAllCustomers);
router.post("/", upload.customerImages, customerController.createCustomer);
router.get("/:uuid", customerController.getCustomerByUuid);
router.put("/:uuid", upload.customerImages, customerController.updateCustomerByUuid);
router.delete("/:uuid", customerController.deleteCustomerByUuid);

module.exports = router;