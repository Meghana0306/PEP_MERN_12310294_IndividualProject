const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: {
      type: String, // format: YYYY-MM
      required: true,
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    basicPay: {
      type: Number,
      default: 0,
      min: 0,
    },
    hra: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimePay: {
      type: Number,
      default: 0,
      min: 0,
    },
    additionalAllowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    pfDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    leaveDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    loanDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowancesTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductionsTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Paid", "On Hold"],
      default: "Pending",
    },
    paymentDate: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

payrollSchema.index({ employeeId: 1, month: 1 }, { unique: true });
payrollSchema.index({ month: 1, department: 1, status: 1 });

module.exports = mongoose.model("Payroll", payrollSchema);
