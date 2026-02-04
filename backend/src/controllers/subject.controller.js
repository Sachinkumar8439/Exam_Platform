const Subject = require("../models/subject");
const Exam = require("../models/exam");

/**
 * ➕ Create Subject (Under a Course / Exam)
 * POST /api/subjects
 */
exports.createSubject = async (req, res) => {
  try {
    const { name, examId } = req.body;

    if (!name || !examId) {
      return res.status(400).json({
        success: false,
        message: "Subject name and examId are required"
      });
    }

    // check exam exists
    const examExists = await Exam.findById(examId);
    if (!examExists) {
      return res.status(404).json({
        success: false,
        message: "Exam not found"
      });
    }

    // prevent duplicate subject in same exam
    const duplicate = await Subject.findOne({
      name,
      exam: examId
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Subject already exists for this exam"
      });
    }

    const subject = await Subject.create({
      name,
      exam: examId
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * 📥 Get All Subjects (Optional filter by exam)
 * GET /api/subjects?examId=
 */
exports.getAllSubjects = async (req, res) => {
  try {
    const { examId } = req.query;

    const filter = {};
    if (examId) filter.exam = examId;

    const subjects = await Subject.find(filter)
      .populate("exam", "name");

    res.status(200).json({
      success: true,
      total: subjects.length,
      data: subjects
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * 📥 Get Single Subject by ID
 * GET /api/subjects/:id
 */
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate("exam", "name");

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      data: subject
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Invalid subject ID",
      error: error.message
    });
  }
};

/**
 * ✏️ Update Subject
 * PUT /api/subjects/:id
 */
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject
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
 * ❌ Delete Subject
 * DELETE /api/subjects/:id
 */
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message
    });
  }
};

/**
 * ➕➕ Bulk Create Subjects (One Exam)
 * POST /api/subjects/bulk
 */
exports.bulkCreateSubjects = async (req, res) => {
  try {
    const { examId, subjects } = req.body;

    if (!examId || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "examId and subjects array are required",
      });
    }

    // check exam exists
    const examExists = await Exam.findById(examId);
    if (!examExists) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // normalize subjects
    const normalizedSubjects = subjects
      .map(s => s?.trim()?.toUpperCase())
      .filter(Boolean);

    if (normalizedSubjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid subjects provided",
      });
    }

    // prepare docs
    const subjectDocs = normalizedSubjects.map(name => ({
      name,
      exam: examId,
      createdBy: req.user._id,
    }));

    /**
     * ordered:false
     * duplicate aaye to skip ho jaye
     */
    const insertedSubjects = await Subject.insertMany(subjectDocs, {
      ordered: false,
    });

    res.status(201).json({
      success: true,
      message: "Subjects added successfully",
      addedCount: insertedSubjects.length,
      data: insertedSubjects,
    });

  } catch (error) {
    // duplicate key error (exam + name)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Some subjects already exist for this exam",
      });
    }

    console.error("bulkCreateSubjects error:", error);
    res.status(500).json({
      success: false,
      message: "Bulk insert failed",
      error: error.message,
    });
  }
};
