const express = require("express");
const {
  createQuestion,
  bulkCreateQuestions,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  approveQuestion,
  deleteQuestion,
  approveQuestionsByChapter,
  approveQuestionsBulkByIds,
  bulkCreateQuestionsByChapters
} = require("../controllers/question.controller");
const auth = require("../middlewares/auth");

const router = express.Router();
router.use(auth)

router.post("/", createQuestion);
router.post("/bulk-of-chapter", bulkCreateQuestions);
router.post("/bulk-of-chapters", bulkCreateQuestionsByChapters);
router.get("/", getAllQuestions);
router.get("/:id", getQuestionById);
router.put("/:id", updateQuestion);
router.patch("/:id/approve", approveQuestion);
router.patch("/approve-by-chapter", approveQuestionsByChapter);
router.patch("/approve-bulk", approveQuestionsBulkByIds);
router.delete("/:id", deleteQuestion);

module.exports = router;
