const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Employee = require("./models/Employee");

const TOTAL_EMPLOYEES = 150;
const INACTIVE_EMPLOYEES = 25;
const DEPARTMENTS = ["HR", "Engineering", "Finance", "Sales", "Operations"];
const DEPARTMENT_ROLES = {
  HR: ["HR Executive", "Talent Partner"],
  Engineering: ["Developer", "QA Engineer"],
  Finance: ["Accountant", "Financial Analyst"],
  Sales: ["Sales Executive", "Account Manager"],
  Operations: ["Ops Specialist", "Coordinator"],
};

const roleForDepartment = (department, index) => {
  const roles = DEPARTMENT_ROLES[department] || ["Employee"];
  return roles[index % roles.length];
};

const seed = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in environment");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for seeding");

    let admin = await User.findOne({ email: "admin@example.com" });

    if (!admin) {
      admin = await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "Admin@123",
        phone: "8888888888",
        role: "Admin",
      });
      console.log("Admin user created: admin@example.com / Admin@123");
    } else {
      console.log("Admin user already exists: admin@example.com / Admin@123");
    }

    let testUser = await User.findOne({ email: "test@example.com" });
    if (!testUser) {
      testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "Test@123",
        phone: "9999999999",
        role: "User",
      });
      console.log("Test user created: test@example.com / Test@123");
    }

    await Employee.deleteMany({});

    const docs = [];
    for (let serial = 1; serial <= TOTAL_EMPLOYEES; serial += 1) {
      const department = DEPARTMENTS[(serial - 1) % DEPARTMENTS.length];
      const role = roleForDepartment(department, serial);

      docs.push({
        name: `Employee ${serial}`,
        email: `employee${serial}@hrms.local`,
        phone: `9${String(100000000 + serial).slice(0, 9)}`,
        department,
        role,
        dateOfJoining: new Date(2022 + (serial % 4), serial % 12, (serial % 28) + 1),
        status: serial <= INACTIVE_EMPLOYEES ? "Inactive" : "Active",
        createdBy: admin._id,
      });
    }

    await Employee.insertMany(docs, { ordered: true });

    const inactiveNames = docs
      .filter((employee) => employee.status === "Inactive")
      .map((employee) => employee.name);

    console.log(`Seeded ${TOTAL_EMPLOYEES} employees.`);
    console.log(`Inactive employees: ${inactiveNames.length}`);
    console.log(inactiveNames.join(", "));
    console.log(`Active employees: ${TOTAL_EMPLOYEES - INACTIVE_EMPLOYEES}`);

    console.log("Seeding completed successfully");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
