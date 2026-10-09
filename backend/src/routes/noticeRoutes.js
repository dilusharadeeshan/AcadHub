import express from "express";
import { getNotices,
      createNotice
 } from "../controllers/noticeController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", getNotices);
router.post("/", protect, adminOnly, createNotice);

export default router;