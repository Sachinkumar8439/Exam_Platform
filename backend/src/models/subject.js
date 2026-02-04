const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/**
 * Unique subject per exam
 * same subject same exam me dobara add na ho
 */
subjectSchema.index(
  { exam: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
