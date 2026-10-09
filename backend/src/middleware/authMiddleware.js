import jwt from "jsonwebtoken";

import Student from "../models/Student.js";

export const protect =async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const student = await Student.findById(decoded.studentId).select("_id role");

    if (!student) {
      return res.status(401).json({
        message: "Student account not found",
      });
    }

     req.studentId = student._id.toString();
    req.userRole = student.role || "student";

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired authentication"
    });
  }
};