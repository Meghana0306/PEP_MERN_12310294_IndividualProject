const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  getEmployees,
  getEmployeeCount,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getEmployees);
router.get("/count", getEmployeeCount);

router.post("/", roleMiddleware("Admin"), createEmployee);
router.put("/:id", roleMiddleware("Admin"), updateEmployee);
router.delete("/:id", roleMiddleware("Admin"), deleteEmployee);

module.exports = router;
