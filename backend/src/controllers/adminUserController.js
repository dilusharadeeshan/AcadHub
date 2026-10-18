import User from "../models/User.js";
import bcrypt from "bcrypt";

/**
 * GET /api/admin/users
 * Get all users with optional filtering and pagination
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    const filter = {};

    // Filter by role if provided
    if (role && ["student", "admin"].includes(role)) {
      filter.role = role;
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getAllUsers error:", error.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * GET /api/admin/users/:id
 * Get a single user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("getUserById error:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * POST /api/admin/users
 * Create a new user (admin can set role)
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    if (name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Name must be at least 2 characters long" });
    }

    if (!email.includes("@")) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    if (role && !["student", "admin"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Role must be either 'student' or 'admin'" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || "student",
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("createUser error:", error.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * PUT /api/admin/users/:id
 * Update a user's details (name, email, role, password)
 */
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate fields only if provided
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res
          .status(400)
          .json({ message: "Name must be at least 2 characters long" });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.includes("@")) {
        return res
          .status(400)
          .json({ message: "Please enter a valid email address" });
      }
      const emailInUse = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id },
      });
      if (emailInUse) {
        return res
          .status(409)
          .json({ message: "Email is already used by another account" });
      }
      user.email = email.toLowerCase().trim();
    }

    if (role !== undefined) {
      if (!["student", "admin"].includes(role)) {
        return res
          .status(400)
          .json({ message: "Role must be either 'student' or 'admin'" });
      }
      user.role = role;
    }

    if (password !== undefined) {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters long" });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("updateUser error:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user by ID (admin cannot delete themselves)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting their own account
    if (id === req.userId) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("deleteUser error:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};
