const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ["Public", "Private", "RestrictedToOffice"],
        default: "RestrictedToOffice",
      },
      showPhone: {
        type: Boolean,
        default: false,
      },
      showEmail: {
        type: Boolean,
        default: true,
      },
    },
    language: {
      type: String,
      default: "en",
    },
    twoFactorAuth: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
