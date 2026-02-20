const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user?.role}' is not authorized.`,
            });
        }
        next();
    };
};

module.exports = { verifyRole };
