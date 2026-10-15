import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// register route with validation
export const registerUser = async (req, res) => {
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

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong"
    });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { userId: user._id, studentId: user._id, role: user.role },
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
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
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
    const userId = req.userId || req.studentId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong"
    });
  }
};

// remove the token from the cookie to log out the user
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax"
  });

  return res.status(200).json({
    message: "Logout successful"
  });
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId || req.studentId;
    const { name, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters long" });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      const lowerEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: lowerEmail, _id: { $ne: userId } });
      if (existing) {
        return res.status(409).json({ message: "Email is already registered" });
      }
      user.email = lowerEmail;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.userId || req.studentId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId || req.studentId;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("deleteAccount error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Backward-compatible aliases
export const registerStudent = registerUser;
export const loginStudent = loginUser;
export const logoutStudent = logoutUser;