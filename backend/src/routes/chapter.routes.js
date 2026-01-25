const express = require("express");
const {
  createChapter,
  bulkCreateChapters,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter
} = require("../controllers/chapter.controller");

const router = express.Router();

router.post("/", createChapter);
router.post("/bulk", bulkCreateChapters);
router.get("/", getAllChapters);
router.get("/:id", getChapterById);
router.put("/:id", updateChapter);
router.delete("/:id", deleteChapter);

module.exports = router;
