const mongoose = require("mongoose");
const attemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test"
  },
  answers: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
      },
      selectedOptionIndex: Number,
      isCorrect: Boolean
    }
  ],
  score: Number,
  totalMarks: Number,
  startedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: Date
}, { timestamps: true });

attemptSchema.index({ user: 1, test: 1 });
attemptSchema.index({ user: 1 });

module.exports = mongoose.model("Attempt", attemptSchema);