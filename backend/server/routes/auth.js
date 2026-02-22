const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const jwtAuth = require("../middleware/jwtAuth");

// POST /api/auth/register — create account and profile
router.post("/register", async (req, res) => {
  try {
    const { email, password, profile } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, profile });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — current user profile (for drink tracking and profile screen)
router.get("/me", jwtAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user._id,
      email: user.email,
      profile: user.profile,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/me — update profile (name, weight, emergency contacts, etc.)
router.patch("/me", jwtAuth, async (req, res) => {
  try {
    const { profile: updates } = req.body;
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ error: "Profile updates required" });
    }

    const allowed = [
      "name", "weightLbs", "heightFt", "heightIn", "gender",
      "dateOfBirth", "cell", "address", "bloodType", "emergencyContacts",
    ];
    const setFields = {};
    for (const key of allowed) {
      if (!(key in updates)) continue;
      if (key === "dateOfBirth") {
        const val = updates[key];
        const d = typeof val === "string" ? new Date(val) : val;
        if (d && !isNaN(d.getTime())) setFields[`profile.${key}`] = d;
      } else if (key === "emergencyContacts" && Array.isArray(updates[key])) {
        setFields["profile.emergencyContacts"] = updates[key].slice(0, 4).map((c) => ({
          label: String(c?.label ?? ""),
          phone: String(c?.phone ?? ""),
        }));
      } else {
        setFields[`profile.${key}`] = updates[key];
      }
    }

    if (Object.keys(setFields).length === 0) {
      const user = await User.findById(req.userId).select("-passwordHash");
      return user
        ? res.json({ id: user._id, email: user.email, profile: user.profile })
        : res.status(404).json({ error: "User not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: setFields },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      profile: user.profile,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
