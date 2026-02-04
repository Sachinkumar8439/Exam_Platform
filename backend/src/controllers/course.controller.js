const Exam = require("../models/exam");
const slugify = require("slugify");


/**
 * ➕ Create New Course (Exam)
 * POST /api/courses
 */
exports.createExam = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Exam name is required",
      });
    }

    const slug = slugify(name, { lower: true, strict: true });

    // duplicate check
    const existingExam = await Exam.findOne({
      $or: [
        { name: name.toUpperCase() },
        { slug }
      ]
    });

    if (existingExam) {
      return res.status(409).json({
        success: false,
        message: "Exam already exists",
      });
    }

    const exam = await Exam.create({
      name,
      slug,
      description,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });

  } catch (error) {
    console.error("createExam error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.bulkCreateExams = async (req, res) => {
  try {
    const { exams } = req.body;

    if (!Array.isArray(exams) || exams.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Exams array is required",
      });
    }

    // prepare docs
    const examDocs = exams.map(exam => ({
      name: exam.name,
      slug: slugify(exam.name, { lower: true, strict: true }),
      description: exam.description || "",
      createdBy: req.user._id,
    }));

    /**
     * ordered:false →
     * agar ek duplicate fail ho jaye
     * to baaki insert ho jaye
     */
    const insertedExams = await Exam.insertMany(examDocs, {
      ordered: false,
    });

    res.status(201).json({
      success: true,
      message: "Exams added successfully",
      count: insertedExams.length,
      data: insertedExams,
    });

  } catch (error) {
    console.error("bulkCreateExams error:", error);

    // duplicate key error handle
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Some exams already exist",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * 📥 Get All Courses
 * GET /api/courses
 */
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Exam.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: courses.length,
      data: courses
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
 * 📥 Get Single Course by ID
 * GET /api/courses/:id
 */
exports.getCourseById = async (req, res) => {
  try {
    const course = await Exam.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Invalid course ID",
      error: error.message
    });
  }
};

/**
 * ✏️ Update Course
 * PUT /api/courses/:id
 */
exports.updateCourse = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // 🔹 If name is updated, regenerate slug
    if (updateData.name) {
      updateData.slug = slugify(updateData.name, { lower: true, strict: true });
      updateData.name = updateData.name.toUpperCase();
    }

    const course = await Exam.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course
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
 * ❌ Delete Course
 * DELETE /api/courses/:id
 */
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Exam.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message
    });
  }
};