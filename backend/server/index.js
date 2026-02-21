const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/drinklogs");
const drinkRoutes = require("./routes/drinks");
const drinkLogRoutes = require("./routes/drinklogs");
const identifyDrinkRoutes = require("./routes/identifyDrink");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // 10mb to handle base64 images from camera

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/drinks", drinkRoutes);
app.use("/api/drinklogs", drinkLogRoutes);
app.use("/api/identifyDrink", identifyDrinkRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "SipSafe API is running" });
});

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI?.trim();
if (!mongoUri) {
  console.error("ERROR: MONGODB_URI environment variable is not set or is empty");
  process.exit(1);
}
if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
  console.error("ERROR: MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'");
  console.error("Current value (first 50 chars):", mongoUri.substring(0, 50));
  process.exit(1);
}
mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
