const Exam = require("../models/exam");
const slugify = require("slugify");


/**
 * ➕ Create New Course (Exam)
 * POST /api/courses
 */
exports.createCourse = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Course (Exam) name is required"
      });
    }

    // 🔹 Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });

    // 🔹 Check duplicate by name (uppercase) or slug
    const existingCourse = await Exam.findOne({
      $or: [{ name: name.toUpperCase() }, { slug }]
    });

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: "Course (Exam) already exists"
      });
    }

    // 🔹 Create new course
    const course = await Exam.create({
      name,
      slug,
      description,
      createdBy: req.user._id  // 👈 logged-in user
    });

    res.status(201).json({
      success: true,
      message: "Course (Exam) created successfully",
      data: course
    });

  } catch (error) {
    console.error("createCourse error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
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