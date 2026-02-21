const mongoose = require("mongoose");

const drinkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, default: "Generic" },
    category: {
      type: String,
      enum: ["beer", "wine", "spirits", "cocktail", "cider", "non-alcoholic"],
      required: true,
    },
    subcategory: { type: String },
    abv: { type: Number, required: true },
    standardServingMl: { type: Number, required: true },
    color: { type: String },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Drink", drinkSchema);
