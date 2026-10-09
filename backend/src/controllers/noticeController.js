import Notice from "../models/Notice.js";

export const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      count: notices.length,
      notices,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve notices",
    });
  }
};

export const createNotice = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title?.trim() || !content?.trim() || !category) {
      return res.status(400).json({
        message: "Title, content and category are required",
      });
    }

    const allowedCategories = [
      "general",
      "ca",
      "exam",
      "academic",
      "event",
    ];

    const normalizedCategory = category.toLowerCase().trim();

    if (!allowedCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        message: "Invalid notice category",
      });
    }

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      category: normalizedCategory,
      createdBy: req.studentId,
    });

    return res.status(201).json({
      message: "Notice created successfully",
      notice,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create notice",
    });
  }
};