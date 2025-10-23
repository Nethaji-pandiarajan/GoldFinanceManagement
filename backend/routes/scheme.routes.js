const express = require("express");
const router = express.Router();
const schemeController = require("../controllers/scheme.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.get("/export", schemeController.exportAllSchemes);
router.get("/", schemeController.getAllSchemes);
router.post("/", schemeController.createScheme);
router.get("/:id", schemeController.getSchemeById);
router.put("/:id", schemeController.updateScheme);
router.delete("/:id", schemeController.deleteScheme);
router.get("/utils/list", schemeController.getSchemesList);
module.exports = router;