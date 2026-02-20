const mongoose = require("mongoose");

const reportsSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ["Attendance", "Performance", "Payroll", "Leaves"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    period: {
      type: String,
      default: new Date().toISOString().split("T")[0],
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reports", reportsSchema);
