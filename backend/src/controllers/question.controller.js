const Question = require("../models/question");
const Exam = require("../models/exam");
const Subject = require("../models/subject");
const Chapter = require("../models/chapter");

/**
 * ➕ Create Single Question
 * POST /api/questions
 */
exports.createQuestion = async (req, res) => {
  try {
    const {
      examId,
      subjectId,
      chapterId,
      questionText,
      options,
      correctOptionIndex,
      difficulty
    } = req.body;

    if (
      !examId ||
      !subjectId ||
      !chapterId ||
      !questionText ||
      !options ||
      correctOptionIndex === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    const question = await Question.create({
      exam: examId,
      subject: subjectId,
      chapter: chapterId,
      questionText,
      options,
      correctOptionIndex,
      difficulty,
      createdBy: req.user?._id || null, // optional (auth later)
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: "Question added (pending approval)",
      data: question
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Question creation failed",
      error: error.message
    });
  }
};

/**
 * ➕➕ Bulk Create Questions
 * POST /api/questions/bulk
 */
exports.bulkCreateQuestions = async (req, res) => {
  try {
    const { examId, subjectId, chapterId,createdBy, questions } = req.body;
    const addedby = req.user?._id || createdBy;
    if (
      !examId ||
      !subjectId ||
      !chapterId ||
      !addedby ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid bulk question payload"
      });
    }

    const preparedQuestions = questions.map(q => ({
      exam: examId,
      subject: subjectId,
      chapter: chapterId,
      createdBy: addedby || null,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      difficulty: q.difficulty || "medium",
      isApproved: true,
    }));

    const inserted = await Question.insertMany(preparedQuestions);

    res.status(201).json({
      success: true,
      message: "Bulk questions added (pending approval)",
      addedCount: inserted.length,
      data: inserted
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bulk insert failed",
      error: error.message
    });
  }
};


exports.bulkCreateQuestionsByChapters = async (req, res) => {
  try {
    const { examId, subjectId, data, createdBy } = req.body;

    const addedBy = req.user?._id || createdBy;

    // 🔴 Basic validation
    if (!examId || !subjectId || !addedBy || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "examId, subjectId, createdBy and data array are required"
      });
    }

    // 🔴 Validate exam & subject
    const examExists = await Exam.findById(examId);
    const subjectExists = await Subject.findById(subjectId);

    if (!examExists || !subjectExists) {
      return res.status(404).json({
        success: false,
        message: "Exam or Subject not found"
      });
    }

    let questionsToInsert = [];

    // 🔁 Loop chapters
    for (const chapterBlock of data) {
      const { chapterId, questions } = chapterBlock;

      if (!chapterId || !Array.isArray(questions) || questions.length === 0) {
        continue;
      }

      // optional: validate chapter
      const chapterExists = await Chapter.findById(chapterId);
      if (!chapterExists) continue;

      for (const q of questions) {
        if (
          !q.questionText ||
          !Array.isArray(q.options) ||
          q.correctOptionIndex === undefined
        ) {
          continue;
        }

        questionsToInsert.push({
          exam: examId,
          subject: subjectId,
          chapter: chapterId,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          difficulty: q.difficulty || "medium",
          createdBy: addedBy,
          isApproved: false
        });
      }
    }

    if (questionsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid questions found to insert"
      });
    }

    // 🚀 Bulk insert
    const inserted = await Question.insertMany(questionsToInsert);

    res.status(201).json({
      success: true,
      message: "Questions added successfully (pending approval)",
      addedCount: inserted.length,
      data: inserted
    });

  } catch (error) {
    console.error("bulkCreateQuestionsByChapters error:", error);
    res.status(500).json({
      success: false,
      message: "Bulk question insert failed",
      error: error.message
    });
  }
};


/**
 * 📥 Get Questions (with filters + pagination)
 * GET /api/questions
 */
exports.getAllQuestions = async (req, res) => {
  try {
    const {
      examId,
      subjectId,
      chapterId,
      difficulty,
      approved,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};
    if (examId) filter.exam = examId;
    if (subjectId) filter.subject = subjectId;
    if (chapterId) filter.chapter = chapterId;
    if (difficulty) filter.difficulty = difficulty;
    if (approved !== undefined) filter.isApproved = approved === "true";

    const questions = await Question.find(filter)
      .populate("exam subject chapter", "name")
      .select("questionText options correctOptionIndex difficulty exam subject chapter")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean();

    const total = await Question.countDocuments(filter);

    let meta = null;

    // ✅ Only build meta if user filtered by at least one dimension
    if ((examId || subjectId || chapterId) && questions.length > 0) {
      meta = {
        exam: questions[0].exam,
        subject: questions[0].subject,
        chapter: questions[0].chapter
      };
    }

    const cleanedQuestions = questions.map(q => {
      const { exam, subject, chapter, ...rest } = q;
      return rest;
    });

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      meta,
      data: cleanedQuestions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Fetching questions failed",
      error: error.message
    });
  }
};

/**
 * 📥 Get Single Question
 * GET /api/questions/:id
 */
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("exam subject chapter", "name");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Invalid question ID",
      error: error.message
    });
  }
};

/**
 * ✏️ Update Question
 * PUT /api/questions/:id
 */
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        isApproved: false // re-approval required
      },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Question updated (approval reset)",
      data: question
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message
    });
  }
};

/**
 * ✅ Approve Question (Admin)
 * PATCH /api/questions/:id/approve
 */
exports.approveQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Question approved",
      data: question
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Approval failed",
      error: error.message
    });
  }
};


exports.approveQuestionsByChapter = async (req, res) => {
  try {
    const { examId, subjectId, chapterId, forceAll = false } = req.body;

    // ✅ Validation
    if (!examId || !subjectId || !chapterId) {
      return res.status(400).json({
        success: false,
        message: "examId, subjectId and chapterId are required"
      });
    }

    // ✅ Create filter condition
    let filterCondition = {
      exam: examId,
      subject: subjectId,
      chapter: chapterId
    };
    
    // If not forcing all, only approve unapproved questions
    if (!forceAll) {
      filterCondition.isApproved = false;
    }

    // ✅ Bulk approve
    const result = await Question.updateMany(
      filterCondition,
      {
        $set: { isApproved: true }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: forceAll 
          ? "No questions found for this chapter" 
          : "No pending questions found to approve"
      });
    }

    res.status(200).json({
      success: true,
      message: forceAll 
        ? "All questions approved successfully (forced)" 
        : "Pending questions approved successfully",
      approvedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    console.error("Bulk approve error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

exports.approveQuestionsBulkByIds = async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "questionIds array is required"
      });
    }

    const validIds = questionIds.filter(id =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid question IDs provided"
      });
    }

    const result = await Question.updateMany(
      { _id: { $in: validIds } },
      { $set: { isApproved: true } }
    );

    res.status(200).json({
      success: true,
      approvedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Bulk approve by IDs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/**
 * ❌ Delete Question
 * DELETE /api/questions/:id
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Question deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message
    });
  }
};
