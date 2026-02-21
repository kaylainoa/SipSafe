const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const DrinkLog = require("../models/DrinkLog");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const {
  calculatePureAlcohol,
  estimateBACContribution,
} = require("../utils/bacCalculator");
const { estimateCustomABV } = require("../utils/customDrinkAbv");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/drinklogs/scan - scan a drink image with Gemini
router.post("/scan", authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this drink image and return ONLY a valid JSON object with no extra text:
    {
      "drinkName": "identified drink name or Unknown",
      "estimatedABV": number between 0 and 100,
      "drinkCategory": "beer, wine, spirits, cocktail, or non-alcoholic",
      "colorAppearance": "description of color",
      "clarity": "clear, cloudy, very cloudy, or opaque",
      "tamperingRisk": "none, low, medium, or high",
      "tamperingReasons": ["array of reasons, empty if none"],
      "safetyAlert": true or false,
      "notes": "any other observations"
    }
    
    Set safetyAlert to true and tamperingRisk to high if:
    - The drink appears unexpectedly cloudy for its type
    - Unusual sediment or floating particles are visible
    - The color looks wrong for the identified drink type
    - Any visual anomaly inconsistent with a normal drink`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const scanResult = JSON.parse(cleaned);

    res.json(scanResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drinklogs - log a drink
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      drinkId,
      drinkName,
      category,
      abv,
      volumeMl,
      isCustom,
      spiritBase,
      strengthSelection,
      photoUrl,
      aiScanResult,
      notes,
    } = req.body;

    // Get user profile for BAC calculation
    const user = await User.findById(req.userId);
    const { weightLbs, gender } = user.profile;

    // If custom drink, calculate ABV from spirit + strength
    const finalABV =
      isCustom && spiritBase && strengthSelection
        ? estimateCustomABV(spiritBase, strengthSelection)
        : abv;

    // Calculate alcohol content and BAC contribution
    const pureAlcoholMl = calculatePureAlcohol(volumeMl, finalABV);
    const estimatedBacContribution = estimateBACContribution(
      pureAlcoholMl,
      weightLbs,
      gender,
    );

    const log = await DrinkLog.create({
      userId: req.userId,
      drinkId: drinkId || null,
      drinkName,
      category,
      abv: finalABV,
      volumeMl,
      pureAlcoholMl,
      estimatedBacContribution,
      isCustom: isCustom || false,
      spiritBase: spiritBase || null,
      strengthSelection: strengthSelection || null,
      photoUrl: photoUrl || null,
      aiScanResult: aiScanResult || null,
      notes: notes || "",
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drinklogs - get user's drink history
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    const logs = await DrinkLog.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drinklogs/stats - get consumption stats for dashboard
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [todayStats, weekStats, allTimeLogs] = await Promise.all([
      // Today's totals
      DrinkLog.aggregate([
        { $match: { userId: req.userId, timestamp: { $gte: startOfDay } } },
        {
          $group: {
            _id: null,
            totalDrinks: { $sum: 1 },
            totalPureAlcoholMl: { $sum: "$pureAlcoholMl" },
            totalBac: { $sum: "$estimatedBacContribution" },
          },
        },
      ]),
      // This week's totals
      DrinkLog.aggregate([
        { $match: { userId: req.userId, timestamp: { $gte: startOfWeek } } },
        {
          $group: {
            _id: null,
            totalDrinks: { $sum: 1 },
            totalPureAlcoholMl: { $sum: "$pureAlcoholMl" },
          },
        },
      ]),
      // Most logged drinks
      DrinkLog.aggregate([
        { $match: { userId: req.userId } },
        { $group: { _id: "$drinkName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      today: todayStats[0] || {
        totalDrinks: 0,
        totalPureAlcoholMl: 0,
        totalBac: 0,
      },
      week: weekStats[0] || { totalDrinks: 0, totalPureAlcoholMl: 0 },
      favoriteDrinks: allTimeLogs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
