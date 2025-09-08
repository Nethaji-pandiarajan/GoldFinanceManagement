const express = require("express");
const router = express.Router();
const ornamentController = require("../controllers/ornament.controller");

router.get("/list", ornamentController.getOrnamentsList);
router.get("/all", ornamentController.getAllOrnamentsForLoan);
router.get("/export", ornamentController.exportAllOrnaments);
router.get("/", ornamentController.getAllOrnaments);
router.post("/", ornamentController.createOrnament);
router.put("/:id", ornamentController.updateOrnamentById);
router.delete("/:id", ornamentController.deleteOrnamentById);

module.exports = router;