const mongoose = require("mongoose");
const questionSchema = new mongoose.Schema({
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
    ref: "Chapter",
    required: true
  },
  
  questionText: {
    type: String,
    required: true
  },
  options: [
    {
      text: String
    }
  ],
  correctOptionIndex: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required:true
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

questionSchema.index({ exam: 1, subject: 1, chapter: 1, isApproved: 1 });
questionSchema.index({ chapter: 1, isApproved: 1 });
module.exports = mongoose.model("Question", questionSchema);
