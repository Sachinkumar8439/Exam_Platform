const mongoose = require("mongoose");
const chapterSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, { timestamps: true });

chapterSchema.index({ subject: 1 });

module.exports = mongoose.model("Chapter", chapterSchema);
