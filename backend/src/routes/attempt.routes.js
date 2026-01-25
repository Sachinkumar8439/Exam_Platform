const express = require("express");
const {
  startAttempt,
  submitAttempt,
  getMyAttemptsList,
  getAttemptById
} = require("../controllers/attempt.controller");
const auth = require("../middlewares/auth");

const router = express.Router();
router.use(auth)
router.post("/start", startAttempt);
router.post("/submit", submitAttempt);
router.get("/my", getMyAttemptsList);
router.get("/:id", getAttemptById);

module.exports = router;
