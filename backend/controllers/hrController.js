const HR = require("../models/HR");
const User = require("../models/User");

// CREATE HR RECORD (Admin only)
const createHR = async (req, res) => {
  try {
    const { userId, employeeId, leaveBalance, performanceRating } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if HR record already exists
    const existingHR = await HR.findOne({ userId });
    if (existingHR) {
      return res.status(400).json({ message: "HR record already exists for this user" });
    }

    const hrRecord = new HR({
      userId,
      employeeId,
      leaveBalance: leaveBalance || 20,
      performanceRating: performanceRating || 0,
    });

    await hrRecord.save();

    res.status(201).json({
      message: "HR record created successfully",
      data: hrRecord,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create HR record", error: err.message });
  }
};

// GET ALL HR RECORDS (Admin) or OWN HR RECORD (User)
const getHR = async (req, res) => {
  try {
    let hrRecords;

    if (req.user.role === "Admin") {
      hrRecords = await HR.find().populate("userId", "name email department designation");
    } else {
      hrRecords = await HR.findOne({ userId: req.user.id }).populate("userId");
    }

    if (!hrRecords) {
      return res.status(404).json({ message: "No HR records found" });
    }

    res.json({ data: hrRecords });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch HR records", error: err.message });
  }
};

// GET HR RECORD BY ID
const getHRById = async (req, res) => {
  try {
    const hrRecord = await HR.findById(req.params.id).populate("userId");

    if (!hrRecord) {
      return res.status(404).json({ message: "HR record not found" });
    }

    // Users can only view their own HR record
    if (req.user.role === "User" && hrRecord.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ data: hrRecord });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch HR record", error: err.message });
  }
};

// UPDATE HR RECORD (Admin only)
const updateHR = async (req, res) => {
  try {
    const { leaveBalance, performanceRating, overtimeHours, status, usedLeaves } = req.body;

    const hrRecord = await HR.findByIdAndUpdate(
      req.params.id,
      {
        leaveBalance,
        performanceRating,
        overtimeHours,
        status,
        usedLeaves,
        lastReviewDate: new Date(),
      },
      { new: true, runValidators: true }
    ).populate("userId");

    if (!hrRecord) {
      return res.status(404).json({ message: "HR record not found" });
    }

    res.json({ message: "HR record updated successfully", data: hrRecord });
  } catch (err) {
    res.status(500).json({ message: "Failed to update HR record", error: err.message });
  }
};

// DELETE HR RECORD (Admin only)
const deleteHR = async (req, res) => {
  try {
    const hrRecord = await HR.findByIdAndDelete(req.params.id);

    if (!hrRecord) {
      return res.status(404).json({ message: "HR record not found" });
    }

    res.json({ message: "HR record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete HR record", error: err.message });
  }
};

module.exports = {
  createHR,
  getHR,
  getHRById,
  updateHR,
  deleteHR,
};
