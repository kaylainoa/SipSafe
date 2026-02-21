const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/drinklogs");
const drinkRoutes = require("./routes/drinks");
const drinkLogRoutes = require("./routes/drinklogs");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // 10mb to handle base64 images from camera

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/drinks", drinkRoutes);
app.use("/api/drinklogs", drinkLogRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "SipSafe API is running" });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
