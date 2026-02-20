const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  createHR,
  getHR,
  getHRById,
  updateHR,
  deleteHR,
} = require("../controllers/hrController");

const router = express.Router();

// All HR routes require authentication
router.use(authMiddleware);

// GET HR records (All authenticated users)
router.get("/", getHR);
router.get("/:id", getHRById);

// Admin only routes
router.post("/", roleMiddleware("Admin"), createHR);
router.put("/:id", roleMiddleware("Admin"), updateHR);
router.delete("/:id", roleMiddleware("Admin"), deleteHR);

module.exports = router;
