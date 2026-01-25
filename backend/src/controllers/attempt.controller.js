const Attempt = require("../models/attempt");
const Test = require("../models/test");
const Question = require("../models/question");
/**
 * ▶️ Start Test Attempt
 * POST /api/attempts/start
 */
exports.startAttempt = async (req, res) => {
  try {
    const { testId } = req.body;
    const userId = req.user?._id || req.body.userId;

    if (!testId || !userId) {
      return res.status(400).json({
        success: false,
        message: "testId and userId are required"
      });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    // Check if test is published
    if (!test.isPublished) {
      return res.status(403).json({
        success: false,
        message: "Test is not published yet"
      });
    }

    // Check if test has started
    const now = new Date();
    if (now < test.startTime) {
      return res.status(403).json({
        success: false,
        message: "Test has not started yet"
      });
    }

    // Check if test has ended
    if (now > test.endTime) {
      return res.status(403).json({
        success: false,
        message: "Test has ended"
      });
    }

    // ✅ FIRST: Check for existing ACTIVE (unsubmitted) attempt
    const existingAttempt = await Attempt.findOne({
      user: userId,
      test: testId,
      score: 0, // Not submitted yet
    });

    // ✅ If existing unsubmitted attempt exists, return it
    if (existingAttempt) {
      return res.status(200).json({
        success: true,
        message: "Existing attempt found",
        data: existingAttempt,
        isResume: true // Flag to indicate this is a resume
      });
    }

    // ✅ Check for SUBMITTED attempts
    const submittedAttempts = await Attempt.find({
      user: userId,
      test: testId,
      score: { $gt: 0 } // Already submitted
    });

    // ✅ If user has already submitted and test doesn't allow multiple attempts
    if (submittedAttempts.length > 0 && !test.allowMultipleAttempts) {
      return res.status(400).json({
        success: false,
        message: "You have already attempted this test",
        attempts: submittedAttempts
      });
    }

    // ✅ Create new attempt
    const attempt = await Attempt.create({
      user: userId,
      test: testId,
      answers: [],
      score: 0,
      totalMarks: test.questions.length,
      startedAt: new Date() // Add startedAt timestamp
    });

    res.status(201).json({
      success: true,
      message: "Test attempt started",
      data: attempt,
      isResume: false // Flag to indicate this is a new attempt
    });

  } catch (error) {
    console.error("Start attempt error:", error);
    res.status(500).json({
      success: false,
      message: "Start attempt failed",
      error: error.message
    });
  }
};

/**
 * 📝 Submit Test Attempt
 * POST /api/attempts/submit
 */
exports.submitAttempt = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    if (!attemptId || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "attemptId and answers array are required"
      });
    }

    const attempt = await Attempt.findById(attemptId).populate("test");
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    // Check if already submitted
    if (attempt.submittedAt) {
      return res.status(400).json({
        success: false,
        message: "Attempt already submitted"
      });
    }

    const questionIds = answers.map(a => a.question);
    const questions = await Question.find({
      _id: { $in: questionIds }
    }).select("questionText options correctOptionIndex");

    let score = 0;

    const evaluatedAnswers = answers.map(ans => {
      const q = questions.find(q => q._id.toString() === ans.question.toString());
      const isCorrect = q ? q.correctOptionIndex === Number(ans.selectedOptionIndex) : false;
      if (isCorrect) score += 1;
      return {
        question: ans.question,
        selectedOptionIndex: Number(ans.selectedOptionIndex),
        isCorrect
      };
    });

    attempt.answers = evaluatedAnswers;
    attempt.score = score;
    attempt.totalMarks = questions.length;
    attempt.submittedAt = new Date();

    await attempt.save();

    res.status(200).json({
      success: true,
      message: "Test submitted successfully",
      score,
      totalMarks: attempt.totalMarks,
      data: attempt
    });

  } catch (error) {
    console.error("Submit attempt error:", error);
    res.status(500).json({
      success: false,
      message: "Submit attempt failed",
      error: error.message
    });
  }
};

/**
 * 📥 Get All Attempts of Logged-in User
 * GET /api/attempts/my
 */
exports.getMyAttempts = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;

    const attempts = await Attempt.find({ user: userId })
      .populate({
        path: "test",
        populate: {
          path: "exam subject chapter",
          select: "name"
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: attempts.length,
      data: attempts
    });

  } catch (error) {
    console.error("Get attempts error:", error);
    res.status(500).json({
      success: false,
      message: "Fetching attempts failed",
      error: error.message
    });
  }
};

/**
 * 📥 Get Single Attempt Detail
 * GET /api/attempts/:id
 */
exports.getAttemptById = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "test",
        populate: {
          path: "exam subject chapter",
          select: "name"
        }
      })
      .populate({
        path: "answers.question",
        select: "questionText options correctOptionIndex"
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    res.status(200).json({
      success: true,
      data: attempt
    });

  } catch (error) {
    console.error("Get attempt by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Invalid attempt ID",
      error: error.message
    });
  }
};