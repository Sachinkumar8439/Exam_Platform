const mongoose = require("mongoose");
const Attempt = require("../models/attempt");
const Test = require("../models/test");
const Question = require("../models/question");

/**
 * ➕ Create Test (Manual Question Selection)
 * POST /api/tests
 */
exports.createTest = async (req, res) => {
  try {
    const {
      examId,
      subjectId,
      chapterId,
      title,
      questions,
      duration,
      startTime,
      endTime,
      allowMultipleAttempts,
      showResultAfterSubmit,
      password,
    } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (!examId || !subjectId || !title || !password) {
      return res.status(400).json({
        success: false,
        message: "Exam, Subject, password and Title are required"
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one question is required"
      });
    }

    if (!duration || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid duration is required"
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and End time are required"
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time"
      });
    }

    // =====================
    // CREATE TEST
    // =====================
    const test = await Test.create({
      exam: examId,
      subject: subjectId,
      chapter: chapterId || null,
      user: req.user._id,           // 🔐 logged-in user
      title,
      password,
      questions,
      duration,
      startTime: start,
      endTime: end,
      isPublished: false,            // default = draft
      allowMultipleAttempts: !!allowMultipleAttempts,
      showResultAfterSubmit: showResultAfterSubmit !== false
    });

    res.status(201).json({
      success: true,
      message: "Test created successfully (Draft)",
      test
    });

  } catch (error) {
    console.error("CreateTest Error:", error);
    res.status(500).json({
      success: false,
      message: "Test creation failed"
    });
  }
};

exports.getTestAttemptsReport = async (req, res) => {
  try {
    const { testId } = req.params;

    // 1️⃣ Invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test"
      });
    }

    // 2️⃣ Test exist check (no user filter)
    const testExists = await Test.findById(testId)
      .select("title duration questions user");

    if (!testExists) {
      return res.status(404).json({
        success: false,
        message: "Requested test not found"
      });
    }

    // 3️⃣ Ownership check
    if (testExists.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this test"
      });
    }

    const totalMarks = testExists.questions.length;

    // 4️⃣ Attempts aggregation
    const attempts = await Attempt.aggregate([
      {
        $match: {
          test: testExists._id,
          submittedAt: { $ne: null }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          score: 1,
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$score", totalMarks] },
                  100
                ]
              },
              2
            ]
          },
          startedAt: 1,
          submittedAt: 1,
          timeTakenMinutes: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$submittedAt", "$startedAt"] },
                  1000 * 60
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { score: -1, submittedAt: 1 } }
    ]);

    // 5️⃣ Success response
    return res.status(200).json({
      success: true,
      test: {
        id: testExists._id,
        title: testExists.title,
        duration: testExists.duration,
        totalMarks
      },
      totalAttempts: attempts.length,
      attempts
    });

  } catch (error) {
    console.error("Test Report Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test report"
    });
  }
};


/**
 * ⚙️ Auto Generate Test (Random Approved Questions)
 * POST /api/tests/auto
 */

exports.autoGenerateTest = async (req, res) => {
  try {
    const {
      examId,
      subjectId,
      chapterId,
      title,
      totalQuestions,
      duration,
      startTime,
      endTime
    } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (!examId || !subjectId || !title) {
      return res.status(400).json({
        success: false,
        message: "Exam, Subject and Title are required"
      });
    }

    if (!totalQuestions || totalQuestions <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid totalQuestions required"
      });
    }

    if (!duration || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid duration required"
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "StartTime and EndTime are required"
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time"
      });
    }

    // =====================
    // QUESTION FILTER
    // =====================
    const filter = {
      exam: new mongoose.Types.ObjectId(examId),
      subject: new mongoose.Types.ObjectId(subjectId),
      isApproved: true
    };

    if (chapterId) {
      filter.chapter = new mongoose.Types.ObjectId(chapterId);
    }

    // =====================
    // COUNT CHECK
    // =====================
    const totalApproved = await Question.countDocuments(filter);

    if (totalApproved < totalQuestions) {
      return res.status(400).json({
        success: false,
        message: `Only ${totalApproved} approved questions available`
      });
    }

    // =====================
    // RANDOM QUESTIONS
    // =====================
    const randomQuestions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: Number(totalQuestions) } }
    ]);

    // =====================
    // CREATE TEST
    // =====================
    const test = await Test.create({
      exam: examId,
      subject: subjectId,
      chapter: chapterId || null,
      user: req.user._id, // 🔐 creator
      title,
      questions: randomQuestions.map(q => q._id),
      duration,
      startTime: start,
      endTime: end,
      isPublished: false // Draft
    });

    res.status(201).json({
      success: true,
      message: "Auto-generated test created successfully (Draft)",
      test
    });

  } catch (error) {
    console.error("AutoGenerateTest Error:", error);
    res.status(500).json({
      success: false,
      message: "Auto test generation failed"
    });
  }
};


/**
 * 📥 Get All Tests (Filters)
 * GET /api/tests
 */

exports.getMyTests = async (req, res) => {
  try {
    const { examId, subjectId, chapterId } = req.query;

    // ✅ Base filter: sirf current user
    const filter = {
      user: req.user._id
    };

    // Optional filters
    if (examId) filter.exam = examId;
    if (subjectId) filter.subject = subjectId;
    if (chapterId) filter.chapter = chapterId;

    const tests = await Test.find(filter)
      .populate("exam subject chapter", "name")
      .sort({ createdAt: -1 });

    const now = new Date();

    const formattedTests = tests.map(test => {
      let status = "draft";

      if (test.isPublished) {
        if (now < test.startTime) status = "upcoming";
        else if (now > test.endTime) status = "completed";
        else status = "live";
      }

      return {
        _id: test._id,
        title: test.title,
        exam: test.exam,
        subject: test.subject,
        chapter: test.chapter,
        duration: test.duration,
        questionsCount: test.questions.length,
        startTime: test.startTime,
        endTime: test.endTime,
        isPublished: test.isPublished,
        status,
        createdAt: test.createdAt
      };
    });

    res.status(200).json({
      success: true,
      total: formattedTests.length,
      tests: formattedTests
    });

  } catch (error) {
    console.error("GetMyTests Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your tests"
    });
  }
};

exports.getAllTests = async (req, res) => {
  try {
    const { examId, subjectId, chapterId } = req.query;

    const filter = {};
    if (examId) filter.exam = examId;
    if (subjectId) filter.subject = subjectId;
    if (chapterId) filter.chapter = chapterId;

    const tests = await Test.find(filter)
      .populate("exam subject chapter", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: tests.length,
      data: tests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Fetching tests failed",
      error: error.message
    });
  }
};

/**
 * 📥 Get Single Test (With Questions)
 * GET /api/tests/:id
 */
exports.getTestById = async (req, res) => {
  try {
    const {password} = req.body;
    const test = await Test.findById(req.params.id)
      .populate("exam subject chapter", "name")
      .populate({
        path: "questions",
        select: "-correctOptionIndex" 
      });

    if (!test || !test.isPublished) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }
    if(test.password !== password ){
       return res.status(400).json({
        success: false,
        message: "Test password does not match"
      });
    }

    return res.status(200).json({
      success: true,
      data: test
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Invalid test ID",
      error: error.message
    });
  }
};

/**
 * ✏️ Update Test
 * PUT /api/tests/:id
 */
exports.updateTest = async (req, res) => {
  try {
    const allowedUpdates = [
      "title",
      "isPublished",
      "startTime",
      "endTime",
      "duration",
      "allowMultipleAttempts",
      "showResultAfterSubmit"
    ];

    const updateData = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: test
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
 * ❌ Delete Test
 * DELETE /api/tests/:id
 */
exports.deleteTest = async (req, res) => {
  try {
    console.log(req.params.id)
    const test = await Test.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Test deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message
    });
  }
};
