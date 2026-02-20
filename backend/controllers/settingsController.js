const Settings = require("../models/Settings");

// CREATE SETTINGS (Auto on user creation)
const createSettings = async (userId) => {
  try {
    const settings = new Settings({ userId });
    await settings.save();
    return settings;
  } catch (err) {
    console.error("Failed to create settings:", err.message);
  }
};

// GET USER SETTINGS
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = await Settings.create({ userId: req.user.id });
    }

    res.json({ data: settings });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings", error: err.message });
  }
};

// UPDATE SETTINGS
const updateSettings = async (req, res) => {
  try {
    const { theme, notifications, privacy, language, twoFactorAuth } = req.body;

    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = new Settings({ userId: req.user.id });
    }

    if (theme) settings.theme = theme;
    if (notifications) {
      settings.notifications = { ...settings.notifications, ...notifications };
    }
    if (privacy) {
      settings.privacy = { ...settings.privacy, ...privacy };
    }
    if (language) settings.language = language;
    if (twoFactorAuth !== undefined) settings.twoFactorAuth = twoFactorAuth;

    await settings.save();

    res.json({ message: "Settings updated successfully", data: settings });
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings", error: err.message });
  }
};

// GET ALL USERS SETTINGS (Admin only)
const getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.find()
      .populate("userId", "name email department")
      .sort({ createdAt: -1 });

    res.json({ data: settings });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings", error: err.message });
  }
};

module.exports = {
  createSettings,
  getSettings,
  updateSettings,
  getAllSettings,
};
