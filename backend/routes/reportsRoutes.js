const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
} = require("../controllers/reportsController");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET reports (All authenticated users)
router.get("/", getReports);
router.get("/:id", getReportById);

// Admin only routes
router.post("/", roleMiddleware("Admin"), createReport);
router.put("/:id", roleMiddleware("Admin"), updateReport);
router.delete("/:id", roleMiddleware("Admin"), deleteReport);

module.exports = router;
