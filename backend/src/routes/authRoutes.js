import express from "express";
import { registerStudent,
        loginStudent,
        getProfile,
        logoutStudent 
 } from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.get("/profile", protect, getProfile);
router.post("/logout", logoutStudent);

export default router;