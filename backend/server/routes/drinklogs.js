const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const DrinkLog = require("../models/DrinkLog");
const User = require("../models/User");
const jwtAuth = require("../middleware/jwtAuth");
const {
  calculatePureAlcohol,
  estimateBACContribution,
} = require("../utils/bacCalculator");
const { estimateCustomABV } = require("../utils/customDrinkAbv");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/drinklogs/scan - scan a drink image with Gemini
router.post("/scan", jwtAuth, async (req, res) => {
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
router.post("/", jwtAuth, async (req, res) => {
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
    if (!user?.profile) {
      return res.status(400).json({ error: "User profile required for logging drinks" });
    }
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
router.get("/", jwtAuth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    const logs = await DrinkLog.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drinklogs/stats - get consumption stats for dashboard
router.get("/stats", jwtAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [todayStats, weekStats, allTimeLogs] = await Promise.all([
      DrinkLog.aggregate([
        { $match: { userId: req.userId, createdAt: { $gte: startOfDay } } },
        {
          $group: {
            _id: null,
            totalDrinks: { $sum: 1 },
            totalPureAlcoholMl: { $sum: "$pureAlcoholMl" },
            totalBac: { $sum: "$estimatedBacContribution" },
          },
        },
      ]),
      DrinkLog.aggregate([
        { $match: { userId: req.userId, createdAt: { $gte: startOfWeek } } },
        {
          $group: {
            _id: null,
            totalDrinks: { $sum: 1 },
            totalPureAlcoholMl: { $sum: "$pureAlcoholMl" },
          },
        },
      ]),
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

// GET /api/drinklogs/analytics?range=1d|1w|1m|1y|all - bucketed consumption + trends
router.get("/analytics", jwtAuth, async (req, res) => {
  try {
    const range = (req.query.range || "1w").toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    let startDate;
    let bucketDays;
    let bucketLabelFormat;
    if (range === "1d") {
      startDate = new Date(startOfToday);
      startDate.setDate(startDate.getDate() - 1);
      bucketDays = 1;
      bucketLabelFormat = "hour";
    } else if (range === "1w") {
      startDate = new Date(startOfToday);
      startDate.setDate(startDate.getDate() - 7);
      bucketDays = 1;
      bucketLabelFormat = "day";
    } else if (range === "1m") {
      startDate = new Date(startOfToday);
      startDate.setDate(startDate.getDate() - 30);
      bucketDays = 1;
      bucketLabelFormat = "day";
    } else if (range === "1y") {
      startDate = new Date(startOfToday);
      startDate.setFullYear(startDate.getFullYear() - 1);
      bucketDays = 30;
      bucketLabelFormat = "month";
    } else {
      // all: last 12 months by month
      startDate = new Date(startOfToday);
      startDate.setFullYear(startDate.getFullYear() - 1);
      bucketDays = 30;
      bucketLabelFormat = "month";
    }

    const logs = await DrinkLog.find({
      userId: req.userId,
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: 1 })
      .lean();

    const buckets = [];
    const bucketCounts = new Map();
    const dayMs = 24 * 60 * 60 * 1000;

    if (range === "1d" && bucketLabelFormat === "hour") {
      for (let h = 0; h < 24; h++) {
        const key = `${h}`;
        bucketCounts.set(key, { count: 0, pureAlcoholMl: 0, label: `${h}:00` });
      }
      logs.forEach((log) => {
        const d = new Date(log.createdAt);
        const key = `${d.getHours()}`;
        if (bucketCounts.has(key)) {
          const b = bucketCounts.get(key);
          b.count += 1;
          b.pureAlcoholMl += log.pureAlcoholMl || 0;
        }
      });
      for (let h = 0; h < 24; h++) {
        const v = bucketCounts.get(`${h}`);
        buckets.push({ label: v.label, date: `${h}`, count: v.count, pureAlcoholMl: v.pureAlcoholMl });
      }
    } else if (bucketLabelFormat === "month") {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        bucketCounts.set(monthKey, {
          count: 0,
          pureAlcoholMl: 0,
          label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
        });
      }
      logs.forEach((log) => {
        const d = new Date(log.createdAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (bucketCounts.has(monthKey)) {
          const b = bucketCounts.get(monthKey);
          b.count += 1;
          b.pureAlcoholMl += log.pureAlcoholMl || 0;
        }
      });
      const sortedKeys = Array.from(bucketCounts.keys()).sort();
      sortedKeys.forEach((k) => {
        const v = bucketCounts.get(k);
        buckets.push({ label: v.label, date: k, count: v.count, pureAlcoholMl: v.pureAlcoholMl });
      });
    } else {
      const cursor = new Date(startDate);
      const endDate = new Date(now.getTime() + dayMs);
      while (cursor < endDate) {
        const key = cursor.toISOString().slice(0, 10);
        const label = cursor.toLocaleString("default", { weekday: "short" });
        bucketCounts.set(key, { count: 0, pureAlcoholMl: 0, label });
        cursor.setDate(cursor.getDate() + 1);
      }
      logs.forEach((log) => {
        const d = new Date(log.createdAt);
        const key = d.toISOString().slice(0, 10);
        if (bucketCounts.has(key)) {
          const b = bucketCounts.get(key);
          b.count += 1;
          b.pureAlcoholMl += log.pureAlcoholMl || 0;
        }
      });
      const sortedKeys = Array.from(bucketCounts.keys()).sort();
      sortedKeys.forEach((k) => {
        const v = bucketCounts.get(k);
        buckets.push({ label: v.label, date: k, count: v.count, pureAlcoholMl: v.pureAlcoholMl });
      });
    }

    let totalDrinks = 0;
    let totalPureAlcoholMl = 0;
    logs.forEach((log) => {
      totalDrinks += 1;
      totalPureAlcoholMl += log.pureAlcoholMl || 0;
    });

    // Previous period for trend
    const periodMs = now - startDate;
    const previousStart = new Date(startDate.getTime() - periodMs);
    const previousLogs = await DrinkLog.find({
      userId: req.userId,
      createdAt: { $gte: previousStart, $lt: startDate },
    }).lean();
    const previousDrinks = previousLogs.length;
    const previousPureAlcoholMl = previousLogs.reduce((s, l) => s + (l.pureAlcoholMl || 0), 0);

    let consumptionDirection = "same";
    if (totalDrinks > previousDrinks) consumptionDirection = "up";
    else if (totalDrinks < previousDrinks) consumptionDirection = "down";

    // Time between drinks (gaps in hours)
    const sortedTimes = logs.map((l) => new Date(l.createdAt).getTime()).sort((a, b) => a - b);
    let avgHoursBetween = 0;
    let longestGapHours = 0;
    if (sortedTimes.length >= 2) {
      const gaps = [];
      for (let i = 1; i < sortedTimes.length; i++) {
        gaps.push((sortedTimes[i] - sortedTimes[i - 1]) / (60 * 60 * 1000));
      }
      avgHoursBetween = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      longestGapHours = Math.max(...gaps);
    }

    res.json({
      buckets,
      totals: { totalDrinks, totalPureAlcoholMl },
      trends: {
        consumptionDirection,
        currentPeriodDrinks: totalDrinks,
        previousPeriodDrinks: previousDrinks,
        avgHoursBetweenDrinks: Math.round(avgHoursBetween * 10) / 10,
        longestGapHours: Math.round(longestGapHours * 10) / 10,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
