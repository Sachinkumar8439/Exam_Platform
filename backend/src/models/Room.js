const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // 🔥 Auto delete ke liye
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
