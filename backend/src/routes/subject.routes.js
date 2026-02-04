const express = require("express");
const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  bulkCreateSubjects 
} = require("../controllers/subject.controller");
const auth = require("../middlewares/auth");

const router = express.Router();
router.use(auth)

router.post("/", createSubject);
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);
router.post("/bulk", bulkCreateSubjects);


module.exports = router;
