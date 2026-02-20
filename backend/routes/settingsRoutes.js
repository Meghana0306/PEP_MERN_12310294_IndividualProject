const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  getSettings,
  updateSettings,
  getAllSettings,
} = require("../controllers/settingsController");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User routes
router.get("/", getSettings);
router.put("/", updateSettings);

// Admin routes
router.get("/all", roleMiddleware("Admin"), getAllSettings);

module.exports = router;
