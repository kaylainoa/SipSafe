/**
 * Seed the drinks collection so "log a drink" shows database drinks.
 * Run from backend/server: node scripts/seedDrinks.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Drink = require("../models/Drink");

const SEED_DRINKS = [
  { name: "Bud Light", brand: "Budweiser", category: "beer", abv: 4.2, standardServingMl: 355 },
  { name: "IPA", brand: "Generic", category: "beer", abv: 6.5, standardServingMl: 355 },
  { name: "Chardonnay", brand: "Generic", category: "wine", abv: 13, standardServingMl: 148 },
  { name: "Cabernet", brand: "Generic", category: "wine", abv: 14, standardServingMl: 148 },
  { name: "Vodka Shot", brand: "Generic", category: "spirits", abv: 40, standardServingMl: 44 },
  { name: "Whiskey", brand: "Generic", category: "spirits", abv: 40, standardServingMl: 44 },
  { name: "Margarita", brand: "Generic", category: "cocktail", abv: 15, standardServingMl: 200 },
  { name: "White Claw", brand: "White Claw", category: "cider", abv: 5, standardServingMl: 355 },
  { name: "Hard Seltzer", brand: "Generic", category: "cider", abv: 5, standardServingMl: 355 },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in backend/server/.env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const existing = await Drink.countDocuments();
  if (existing > 0) {
    console.log(`Drinks collection already has ${existing} documents. Skipping seed (no duplicates added).`);
    await mongoose.disconnect();
    return;
  }
  await Drink.insertMany(SEED_DRINKS);
  console.log(`Seeded ${SEED_DRINKS.length} drinks.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
