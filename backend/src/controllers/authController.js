import Student from "../models/Student.js";
import bcrypt from "bcrypt";

//register route with validation
export const registerStudent = async (req, res) => {
  const { name, email, password } = req.body;
  try {
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required"
    });
  }

  if (name.length < 2) {
    return res.status(400).json({
      message: "Name must be at least 2 characters long"
    });
  }

  if (!email.includes("@")) {
    return res.status(400).json({
      message: "Please enter a valid email address"
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long"
    });
  }

  const existingStudent = await Student.findOne({ email });

if (existingStudent) {
  return res.status(409).json({
    message: "Email is already registered"
  });
}

const hashedPassword = await bcrypt.hash(password, 10);

const student = await Student.create({
  name,
  email,
  password: hashedPassword
});
} catch (error) {
 return res.status(201).json({
  message: "Student registered successfully",
  user: {
    id: student._id,
    name: student.name,
    email: student.email
  }
});
}
};