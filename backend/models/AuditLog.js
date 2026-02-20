const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // User who performed the action
        },
        action: {
            type: String,
            required: true, // e.g., "CREATE_EMPLOYEE", "UPDATE_SALARY"
        },
        details: {
            type: String, // Description of the change
        },
        targetId: {
            type: mongoose.Schema.Types.Mixed, // ID of the affected document
        },
        model: {
            type: String, // Target model name (e.g., "Employee", "Payroll")
        },
        ipAddress: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
