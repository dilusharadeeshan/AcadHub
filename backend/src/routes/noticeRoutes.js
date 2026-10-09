import express from "express";
import { getNotices,
      createNotice
 } from "../controllers/noticeController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getNotices);
router.post("/", protect, createNotice);

export default router;