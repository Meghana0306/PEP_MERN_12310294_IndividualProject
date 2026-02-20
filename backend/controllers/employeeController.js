const Employee = require("../models/Employee");

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
};

const getEmployeeCount = async (req, res) => {
  try {
    const count = await Employee.countDocuments();
    return res.status(200).json({
      success: true,
      totalEmployees: count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error counting employees",
      error: error.message,
    });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { name, email, phone, department, role, dateOfJoining, status } = req.body;

    if (!name || !email || !department || !role || !dateOfJoining) {
      return res.status(400).json({ message: "Name, email, department, role and dateOfJoining are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await Employee.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Employee already exists with this email" });
    }

    const employee = await Employee.create({
      name: name.trim(),
      email: normalizedEmail,
      phone,
      department: department.trim(),
      role: role.trim(),
      dateOfJoining,
      status: status || "Active",
      createdBy: req.user?.id,
    });

    return res.status(201).json({ message: "Employee added successfully", employee });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add employee", error: error.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();
    }

    const employee = await Employee.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json({ message: "Employee updated successfully", employee });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update employee", error: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete employee", error: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployeeCount,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
