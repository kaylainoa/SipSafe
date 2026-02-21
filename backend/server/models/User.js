const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    profile: {
      name: { type: String, required: true },
      weightLbs: { type: Number, required: true },
      heightFt: { type: Number, required: true },
      heightIn: { type: Number, required: true },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true,
      },
      dateOfBirth: { type: Date },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
