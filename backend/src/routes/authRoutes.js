import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);
router.post("/logout", logoutUser);

export default router;