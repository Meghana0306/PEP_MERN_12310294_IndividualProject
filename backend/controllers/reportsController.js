const Reports = require("../models/Reports");
const HR = require("../models/HR");

// CREATE REPORT (Admin only)
const createReport = async (req, res) => {
  try {
    const { reportType, userId, data, description } = req.body;

    const report = new Reports({
      reportType,
      userId,
      data,
      description,
      generatedBy: req.user.id,
    });

    await report.save();
    await report.populate(["userId", "generatedBy"], "name email");

    res.status(201).json({
      message: "Report created successfully",
      data: report,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create report", error: err.message });
  }
};

// GET ALL REPORTS (Admin) or OWN REPORTS (User)
const getReports = async (req, res) => {
  try {
    let reports;

    if (req.user.role === "Admin") {
      reports = await Reports.find()
        .populate("userId", "name email")
        .populate("generatedBy", "name email")
        .sort({ createdAt: -1 });
    } else {
      reports = await Reports.find({ userId: req.user.id })
        .populate("userId", "name email")
        .populate("generatedBy", "name email")
        .sort({ createdAt: -1 });
    }

    res.json({ data: reports });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reports", error: err.message });
  }
};

// GET REPORT BY ID
const getReportById = async (req, res) => {
  try {
    const report = await Reports.findById(req.params.id)
      .populate("userId", "name email")
      .populate("generatedBy", "name email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Users can only view their own reports
    if (req.user.role === "User" && report.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ data: report });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch report", error: err.message });
  }
};

// UPDATE REPORT (Admin only)
const updateReport = async (req, res) => {
  try {
    const { status, data, description } = req.body;

    const report = await Reports.findByIdAndUpdate(
      req.params.id,
      { status, data, description },
      { new: true, runValidators: true }
    ).populate(["userId", "generatedBy"], "name email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ message: "Report updated successfully", data: report });
  } catch (err) {
    res.status(500).json({ message: "Failed to update report", error: err.message });
  }
};

// DELETE REPORT (Admin only)
const deleteReport = async (req, res) => {
  try {
    const report = await Reports.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete report", error: err.message });
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
};
