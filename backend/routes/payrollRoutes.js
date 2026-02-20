const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  getPayrollRecords,
  getPayrollSummary,
  getPayrollAnalytics,
  updatePayrollComponents,
  updatePayrollStatus,
  processPayroll,
  getPayslip,
} = require("../controllers/payrollController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getPayrollRecords);
router.get("/summary", getPayrollSummary);
router.get("/analytics", getPayrollAnalytics);
router.get("/:id/payslip", getPayslip);

router.post("/process", roleMiddleware("Admin"), processPayroll);
router.patch("/:id/components", roleMiddleware("Admin"), updatePayrollComponents);
router.patch("/:id/status", roleMiddleware("Admin"), updatePayrollStatus);

module.exports = router;
