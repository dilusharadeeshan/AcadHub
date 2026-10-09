import jwt from "jsonwebtoken";

import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.studentId;

    const user = await User.findById(userId).select("_id role");

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    req.user = user;
    req.userId = user._id.toString();
    req.studentId = user._id.toString();
    req.userRole = user.role || "student";

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      message: "Invalid or expired authentication"
    });
  }
};