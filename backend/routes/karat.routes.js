const express = require("express");
const router = express.Router();
const karatController = require("../controllers/karat.controller");

router.get("/list", karatController.getKaratsList);

router.get("/", karatController.getAllKarats);
router.post("/", karatController.createKarat);
router.put("/:id", karatController.updateKaratById);
router.delete("/:id", karatController.deleteKaratById);

module.exports = router;