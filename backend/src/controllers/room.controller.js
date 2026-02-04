const Room = require("../models/Room");
const crypto = require("crypto");

const generateRoomCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

exports.createRoom = async (req, res) => {
  try {
    const { roomName, userId = req.user._id } = req.body;

    if (!roomName || !userId) {
      return res.status(400).json({
        success: false,
        message: "Room name and user required"
      });
    }

    // 🔥 unique room code
    let code;
    let exists = true;

    while (exists) {
      code = generateRoomCode();
      exists = await Room.exists({ code });
    }

    // ⏱️ Auto delete after 2 hours
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const room = await Room.create({
      name: roomName,
      code,
      user: userId,
      expiresAt
    });

    res.status(201).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        expiresAt: room.expiresAt
      }
    });

  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create room"
    });
  }
};
