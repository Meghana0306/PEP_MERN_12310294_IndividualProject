const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const otpStore = new Map();

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "User",
    });

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      userId: user._id.toString(),
    });

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({
        message: "Email service is not configured on server. Set SMTP_* or EMAIL_USER/EMAIL_PASS in backend .env",
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "HRMS Login OTP",
      html: `<p>Your HRMS OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
    });

    return res.json({ message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedOtp = String(otp || "").trim();

    if (!email || !normalizedOtp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      return res.status(400).json({ message: "OTP not found. Please request a new OTP" });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ message: "OTP expired. Please request a new OTP" });
    }

    if (stored.otp !== normalizedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findById(stored.userId);
    otpStore.delete(normalizedEmail);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = generateToken(user);

    return res.json({
      message: "OTP verified. Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Update failed", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCurrentMatch = await user.matchPassword(currentPassword);
    if (!isCurrentMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const isSameAsCurrent = await user.matchPassword(newPassword);
    if (isSameAsCurrent) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to change password", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  getCurrentUser,
  updateUserProfile,
  changePassword,
};
