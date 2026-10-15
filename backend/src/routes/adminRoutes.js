import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/adminUserController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All routes require authentication + admin role
router.use(protect, adminOnly);

router.get("/users", getAllUsers);         // GET    /api/admin/users
router.get("/users/:id", getUserById);    // GET    /api/admin/users/:id
router.post("/users", createUser);        // POST   /api/admin/users
router.put("/users/:id", updateUser);     // PUT    /api/admin/users/:id
router.delete("/users/:id", deleteUser);  // DELETE /api/admin/users/:id

export default router;
