const express = require("express");
const {
  createTest,
  autoGenerateTest,
  getAllTests,
  getTestById,
  updateTest,
  deleteTest,
  getMyTests
} = require("../controllers/test.controller");
const auth = require("../middlewares/auth");

const router = express.Router();

router.use(auth)
router.post("/", createTest);
router.post("/auto", autoGenerateTest);
router.get("/", getMyTests);
router.post("/:id", getTestById);
router.put("/:id", updateTest);
router.delete("/:id", deleteTest);

module.exports = router;
