const express = require("express");
const router = express.Router();
const Drink = require("../models/Drink");

// US standard drink ≈ 14g ethanol; ethanol ≈ 0.789 g/ml
// standardDrinks = (standardServingMl * abv/100 * 0.789) / 14
// Non-alcoholic (abv 0) = 0 standard drinks so Water never increases BAC
function standardDrinksFromServing(standardServingMl, abv) {
  if (abv == null || abv === 0) return 0;
  if (!standardServingMl) return 1;
  const gramsEthanol = standardServingMl * (abv / 100) * 0.789;
  return Math.round((gramsEthanol / 14) * 100) / 100;
}

// GET /api/drinks — list all drinks from database for "log a drink"
router.get("/", async (req, res) => {
  try {
    const drinks = await Drink.find({}).sort({ category: 1, name: 1 }).lean();
    const withStandard = drinks.map((d) => ({
      _id: d._id,
      name: d.name,
      brand: d.brand,
      category: d.category,
      abv: d.abv,
      standardServingMl: d.standardServingMl,
      standardDrinks: standardDrinksFromServing(d.standardServingMl, d.abv),
      isCustom: d.isCustom || false,
    }));
    res.json(withStandard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
