const jwt = require("jsonwebtoken");

// Verify JWT Token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
};

// Role-based Authorization Middleware
const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${requiredRole}, Your role: ${req.user.role}` 
      });
    }

    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
