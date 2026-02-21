const express = require("express");
const router = express.Router();
const {
  identifyDrinkController,
} = require("../controllers/identifyDrinkController");

// POST /identify-drink
router.post("/", identifyDrinkController);

module.exports = router;
