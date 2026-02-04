const Attempt = require("../models/attempt");
const Test = require("../models/test");
const Question = require("../models/question");
const { default: mongoose } = require("mongoose");
/**
 * ▶️ Start Test Attempt
 * POST /api/attempts/start
 */
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

    /* =====================
       1️⃣ Fetch Test
       ===================== */
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    /* =====================
       2️⃣ Test Validations
       ===================== */
    if (!test.isPublished) {
      return res.status(403).json({
        success: false,
        message: "Test is not published yet"
      });
    }

    const now = new Date();

    if (now < test.startTime) {
      return res.status(403).json({
        success: false,
        message: "Test has not started yet"
      });
    }

    if (now > test.endTime) {
      return res.status(403).json({
        success: false,
        message: "Test has ended"
      });
    }

    /* =====================
       3️⃣ Check ACTIVE attempt (NOT submitted)
       ===================== */
    const activeAttempt = await Attempt.findOne({
      user: userId,
      test: testId,
      submittedAt: null
    });

    // ✅ Resume same attempt
    if (activeAttempt) {
      return res.status(200).json({
        success: true,
        message: "Resuming existing attempt",
        data: activeAttempt,
        isResume: true
      });
    }

    /* =====================
       4️⃣ Check submitted attempts
       ===================== */
    const submittedAttemptsCount = await Attempt.countDocuments({
      user: userId,
      test: testId,
      submittedAt: { $ne: null }
    });

    // ❌ Multiple attempts not allowed
    if (submittedAttemptsCount > 0 && !test.allowMultipleAttempts) {
      return res.status(400).json({
        success: false,
        message: "You have already attempted this test"
      });
    }

    /* =====================
       5️⃣ Create NEW attempt
       ===================== */
    const newAttempt = await Attempt.create({
      user: userId,
      test: testId,
      answers: [],
      score: 0,
      totalMarks: test.questions.length,
      startedAt: new Date(),
      submittedAt: null
    });

    return res.status(201).json({
      success: true,
      message: "New attempt started",
      data: newAttempt,
      isResume: false
    });

  } catch (error) {
    console.error("Start attempt error:", error);
    return res.status(500).json({
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


exports.getMyAttemptsList = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    const attempts = await Attempt.aggregate([
      // 1️⃣ User filter
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId)
        }
      },

      // 2️⃣ Join Test
      {
        $lookup: {
          from: "tests",
          localField: "test",
          foreignField: "_id",
          as: "test"
        }
      },
      { $unwind: "$test" },

      // 3️⃣ Join Exam
      {
        $lookup: {
          from: "exams",
          localField: "test.exam",
          foreignField: "_id",
          as: "exam"
        }
      },
      { $unwind: "$exam" },

      // 4️⃣ Compute totalMarks from TEST (✔ correct)
      {
        $addFields: {
          totalMarks: { $size: "$test.questions" }
        }
      },

      // 5️⃣ Shape LIST response
      {
        $project: {
          _id: 0,
          attemptId: "$_id",
          testId: "$test._id",
          testTitle: "$test.title",
          exam: {
            id: "$exam._id",
            name: "$exam.name"
          },

          score: { $ifNull: ["$score", 0] },
          totalMarks: 1,

          percentage: {
            $cond: [
              { $gt: ["$totalMarks", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$score", "$totalMarks"] },
                      100
                    ]
                  },
                  2
                ]
              },
              0
            ]
          },

          status: {
            $cond: [
              { $ifNull: ["$submittedAt", false] },
              "submitted",
              "in-progress"
            ]
          },

          // ⏱ time in SECONDS (better UX)
          timeTakenSeconds: {
            $cond: [
              { $ifNull: ["$submittedAt", false] },
              {
                $round: [
                  {
                    $divide: [
                      { $subtract: ["$submittedAt", "$startedAt"] },
                      1000
                    ]
                  },
                  0
                ]
              },
              null
            ]
          },

          startedAt: 1,
          submittedAt: 1,
          createdAt: 1
        }
      },

      { $sort: { createdAt: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      totalAttempts: attempts.length,
      attempts
    });

  } catch (error) {
    console.error("Get My Attempts List Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attempts list"
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