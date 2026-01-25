const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, { timestamps: true });

subjectSchema.index({ exam: 1 });
  
module.exports = mongoose.model("Subject", subjectSchema);
