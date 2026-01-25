const express = require("express");
const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  bulkCreateSubjects 
} = require("../controllers/subject.controller");

const router = express.Router();

router.post("/", createSubject);
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);
router.post("/bulk", bulkCreateSubjects);


module.exports = router;
