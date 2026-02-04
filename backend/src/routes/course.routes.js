const express = require("express");
const auth = require("../middlewares/auth")
const {
  createExam,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  bulkCreateExams
} = require("../controllers/course.controller");

const router = express.Router();

router.use(auth);

router.post("/", createExam);
router.post("/bulk", bulkCreateExams);
router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

module.exports = router;
