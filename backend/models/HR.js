const mongoose = require("mongoose");

const hrSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    attendanceCount: {
      type: Number,
      default: 0,
    },
    leaveBalance: {
      type: Number,
      default: 20,
    },
    usedLeaves: {
      type: Number,
      default: 0,
    },
    performanceRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    lastReviewDate: {
      type: Date,
      default: null,
    },
    nextReviewDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Leave", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HR", hrSchema);
