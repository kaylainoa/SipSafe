const mongoose = require("mongoose");

const drinkLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drinkId: { type: mongoose.Schema.Types.ObjectId, ref: "Drink", default: null },
    drinkName: { type: String, required: true },
    category: { type: String, required: true },
    abv: { type: Number, required: true },
    volumeMl: { type: Number, required: true },
    pureAlcoholMl: { type: Number, required: true },
    estimatedBacContribution: { type: Number, required: true },
    isCustom: { type: Boolean, default: false },
    spiritBase: { type: String, default: null },
    strengthSelection: { type: String, default: null },
    photoUrl: { type: String, default: null },
    aiScanResult: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DrinkLog", drinkLogSchema);
