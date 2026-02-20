const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  getCurrentUser,
  updateUserProfile,
  changePassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.get("/me", authMiddleware, getCurrentUser);
router.put("/profile", authMiddleware, updateUserProfile);
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;
