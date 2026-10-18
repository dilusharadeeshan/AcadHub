import express from "express";
import { getCourse } from "../controllers/courseController.js";

const router = express.Router();

router.get("/", getCourse);

export default router;