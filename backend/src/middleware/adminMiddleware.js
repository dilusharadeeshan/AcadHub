export const adminOnly = (req, res, next) => {
  const role = req.userRole || req.user?.role;

  if (role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin privileges required.",
    });
  }

  next();
};