import express from "express";
import { registerStudent } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerStudent);

export default router;