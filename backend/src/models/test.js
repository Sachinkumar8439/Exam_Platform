const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  password:{
     type: String,
    required: true
  },

  title: {
    type: String,
    required: true
  },

  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question"
    }
  ],

  duration: {
    type: Number, // minutes
    required: true
  },

  /* =====================
     TIMING
     ===================== */
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },

  /* =====================
     CONTROL FLAGS
     ===================== */
  isPublished: {
    type: Boolean,
    default: false
  },

  allowMultipleAttempts: {
    type: Boolean,
    default: false
  },

  showResultAfterSubmit: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });


testSchema.index({
  exam: 1,
  subject: 1,
  chapter: 1
});

module.exports = mongoose.model("Test", testSchema);
