const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
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

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/**
 * Same subject me same chapter repeat na ho
 */
chapterSchema.index(
  { subject: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Chapter", chapterSchema);
