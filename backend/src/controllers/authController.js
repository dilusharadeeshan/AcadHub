import Student from "../models/Student.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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


export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const student = await Student.findOne({ email }).select("+password");

    if (!student) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(password, student.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }
    const token = jwt.sign(
  { studentId: student._id },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.cookie("token", token, {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000
});
    return res.status(200).json({
      message: "Login successful",
      
      user: {
        id: student._id,
        name: student.name,
        email: student.email
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong"
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    return res.status(200).json({
      user: {
        id: student._id,
        name: student.name,
        email: student.email
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong"
    });
  }
};

//remove the token from the cookie to log out the user
export const logoutStudent = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax"
  });

  return res.status(200).json({
    message: "Logout successful"
  });
};