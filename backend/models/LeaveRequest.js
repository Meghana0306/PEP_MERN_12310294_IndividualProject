const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
        },
        type: {
            type: String,
            enum: ["Sick", "Casual", "Annual", "Unpaid"],
            default: "Casual",
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Can be Manager or HR
        },
        rejectionReason: {
            type: String,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
