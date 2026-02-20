const mongoose = require("mongoose");
const Employee = require("./models/Employee");

mongoose.connect("mongodb://127.0.0.1:27017/hrms");

const TOTAL_EMPLOYEES = 150;
const INACTIVE_EMPLOYEES = 25;
const departments = ["HR", "Engineering", "Finance", "Sales", "Operations"];
const departmentRoles = {
  HR: ["HR Executive", "Talent Partner"],
  Engineering: ["Developer", "QA Engineer"],
  Finance: ["Accountant", "Financial Analyst"],
  Sales: ["Sales Executive", "Account Manager"],
  Operations: ["Ops Specialist", "Coordinator"],
};

const generateEmployees = () => {
  const employees = [];

  for (let i = 1; i <= TOTAL_EMPLOYEES; i++) {
    const department = departments[(i - 1) % departments.length];
    const roles = departmentRoles[department] || ["Employee"];
    const role = roles[i % roles.length];

    employees.push({
      name: `Employee ${i}`,
      email: `employee${i}@company.com`,
      phone: `9876543${100 + i}`,
      department,
      role,
      dateOfJoining: new Date(2022, i % 12, (i % 28) + 1),
      status: i <= INACTIVE_EMPLOYEES ? "Inactive" : "Active",
    });
  }

  return employees;
};

const seedData = async () => {
  try {
    await Employee.deleteMany({});
    await Employee.insertMany(generateEmployees());

    console.log("150 employees inserted: 25 inactive, 125 active.");
    process.exit();
  } catch (error) {
    console.error("Error inserting employees:", error);
    process.exit(1);
  }
};

seedData();
