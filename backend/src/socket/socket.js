const Room = require("../models/Room");

/* ================== IN-MEMORY STORES ================== */
const activeRooms = new Map(); // roomCode -> { roomMeta, lastActivity }
const roomQuestions = new Map(); // roomCode -> { activeQuestion, questionHistory }
const roomScores = new Map(); // roomCode -> { email: score }
const userSockets = new Map(); // email -> Set(socketId)  // IMPROVEMENT #2
let cleanupStarted = false;

/* ================== ROOM CLEANUP SETUP ================== */
const ROOM_INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

function setupRoomCleanup(io) {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [roomCode, roomData] of activeRooms.entries()) {
      const roomSockets = io.sockets.adapter.rooms.get(roomCode);
      const hasOnlineMembers = roomSockets && roomSockets.size > 0;

      if (
        !hasOnlineMembers &&
        now - roomData.lastActivity > ROOM_INACTIVITY_TIMEOUT
      ) {
        // IMPROVEMENT #3: Clean up active question timer before deletion
        const data = roomQuestions.get(roomCode);
        if (data?.activeQuestion?.timer) {
          clearTimeout(data.activeQuestion.timer);
        }

        // Clean up all stores
        activeRooms.delete(roomCode);
        roomQuestions.delete(roomCode);
        roomScores.delete(roomCode);

        console.log(`🗑️ Auto-cleaned inactive room: ${roomCode}`);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} inactive rooms`);
    }
  }, CLEANUP_INTERVAL);
}

/* ================== UPDATE ROOM ACTIVITY ================== */
function updateRoomActivity(roomCode) {
  const roomData = activeRooms.get(roomCode);
  if (roomData) {
    roomData.lastActivity = Date.now();
  }
}

/* ================== SOCKET INIT ================== */
const socketIO = (io) => {
  // ✅ FIX #1: Cleanup scheduler called only once
  if (!cleanupStarted) {
    setupRoomCleanup(io);
    cleanupStarted = true;
  }
  console.log("✅ Socket.IO initialized");

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    /* ================== USER CONNECT ================== */
    socket.on("quiz-user-connected", ({ name, email }) => {
      if (!email) return;

      socket.userName = name || "Anonymous";
      socket.userEmail = email;
      
      // ✅ IMPROVEMENT #2: Multiple sockets per email support
      if (!userSockets.has(email)) {
        userSockets.set(email, new Set());
      }
      userSockets.get(email).add(socket.id);

      console.log(`👤 User connected: ${socket.userName} (${email})`);
    });

    /* ================== JOIN ROOM ================== */
    socket.on("quiz-join-room", async ({ roomCode, userName, userEmail }) => {
      try {
        const name = userName || socket.userName;
        const email = userEmail || socket.userEmail;

        if (!roomCode || !name || !email) {
          return socket.emit("quiz-room-error", {
            message: "Room code, name and email are required",
          });
        }

        // 🔒 Leave previous room if any
        if (socket.roomCode && socket.roomCode !== roomCode) {
          socket.leave(socket.roomCode);
        }

        // 🔒 Prevent duplicate join in same room
        if (socket.roomCode === roomCode) {
          const room = activeRooms.get(roomCode);
          if (room) {
            const scores = roomScores.get(roomCode) || {};
            socket.emit("quiz-room-joined", {
              success: true,
              room: room.roomMeta,
              members: room.roomMeta.members,
              scores,
              onlineCount: room.roomMeta.onlineMembers,
              isAdmin: email === room.roomMeta.createdBy.email,
            });
          }
          return;
        }

        socket.userName = name;
        socket.userEmail = email;

        let roomData = activeRooms.get(roomCode);

        /* 🔹 Load room from DB */
        if (!roomData) {
          const dbRoom = await Room.findOne({ code: roomCode });
          if (!dbRoom) {
            return socket.emit("quiz-room-error", {
              message: "Room not found",
            });
          }

          const roomMeta = {
            id: dbRoom._id.toString(),
            code: dbRoom.code,
            name: dbRoom.name,
            createdBy: {
              email: email,
              name: name,
            },
            members: [],
            onlineMembers: 0,
          };

          roomData = {
            roomMeta,
            lastActivity: Date.now(),
          };

          activeRooms.set(roomCode, roomData);
          roomQuestions.set(roomCode, {
            activeQuestion: null,
            questionHistory: [],
          });
          roomScores.set(roomCode, {});

          console.log(`🏠 Room loaded: ${roomCode}`);
        }

        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.isAdmin = email === roomData.roomMeta.createdBy.email;

        /* 👥 Add member if not exists */
        const existingMember = roomData.roomMeta.members.find(
          (m) => m.email === email,
        );
        if (!existingMember) {
          roomData.roomMeta.members.push({
            name,
            email,
            isAdmin: socket.isAdmin,
            joinedAt: new Date(),
          });
        }

        /* 📊 Init score if not exists */
        const scores = roomScores.get(roomCode);
        if (!(email in scores)) {
          scores[email] = 0;
        }

        /* 🔢 Get online members count */
        const roomSockets = io.sockets.adapter.rooms.get(roomCode);
        roomData.roomMeta.onlineMembers = roomSockets ? roomSockets.size : 1;

        updateRoomActivity(roomCode);

        /* ✅ Notify joiner */
        socket.emit("quiz-room-joined", {
          success: true,
          room: roomData.roomMeta,
          members: roomData.roomMeta.members,
          scores,
          onlineCount: roomData.roomMeta.onlineMembers,
          isAdmin: socket.isAdmin,
        });

        /* 📣 Notify others */
        socket.to(roomCode).emit("quiz-member-joined", {
          name,
          email,
          isAdmin: socket.isAdmin,
          onlineCount: roomData.roomMeta.onlineMembers,
          members: roomData.roomMeta.members,
        });

        console.log(`✅ ${name} joined ${roomCode} (Admin: ${socket.isAdmin})`);
      } catch (err) {
        console.error("JOIN ERROR:", err);
        socket.emit("quiz-room-error", {
          message: "Failed to join room",
        });
      }
    });

    /* ================== SEND QUESTION ================== */
    socket.on("quiz-send-question", ({ roomCode, question }) => {
      // ✅ IMPROVEMENT #4: Security check
      if (socket.roomCode !== roomCode) return;

      const roomData = activeRooms.get(roomCode);
      const data = roomQuestions.get(roomCode);
      
      if (!roomData || !data) return;
      
      if (data.activeQuestion) {
        return socket.emit("quiz-room-error", {
          message: "Previous question is still active",
        });
      }
      
      if (!roomData.roomMeta.members.find((m) => m.email === socket.userEmail))
        return;

      const q = {
        id: Date.now().toString(),
        text: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        timeLimit: Number(question.timeLimit) || 30,
        senderEmail: socket.userEmail,
        senderName: socket.userName,
        answers: [],
        revealed: false,
        createdAt: new Date(),
      };

      data.activeQuestion = q;
      data.questionHistory.unshift(q);

      updateRoomActivity(roomCode);

      io.to(roomCode).emit("quiz-new-question", q);

      /* ⏰ Auto reveal with timer */
      q.timer = setTimeout(
        () => {
          if (
            !data.activeQuestion ||
            data.activeQuestion.id !== q.id ||
            q.revealed
          )
            return;

          revealAnswer(roomCode, "System (Auto)");
        },
        (q.timeLimit + 2) * 1000,
      );
    });

    /* ================== SUBMIT ANSWER ================== */
    socket.on("quiz-submit-answer", ({ roomCode, questionId, answer }) => {
      // ✅ IMPROVEMENT #4: Security check
      if (socket.roomCode !== roomCode) return;

      const roomData = activeRooms.get(roomCode);
      const data = roomQuestions.get(roomCode);
      
      if (!roomData || !data?.activeQuestion) return;
      
      if (!roomData.roomMeta.members.find((m) => m.email === socket.userEmail)) {
        return;
      }

      const q = data.activeQuestion;
      if (q.senderEmail === socket.userEmail) {
        return socket.emit("quiz-room-error", {
          message: "Question sender cannot submit answer",
        });
      }
      if (q.id !== questionId || q.revealed) return;

      if (q.answers.find((a) => a.email === socket.userEmail)) return;

      q.answers.push({
        email: socket.userEmail,
        name: socket.userName,
        answer,
        isCorrect: answer === q.correctAnswer,
        timestamp: new Date(),
      });

      updateRoomActivity(roomCode);

      socket.emit("quiz-answer-submitted", {
        success: true,
        message: "Answer submitted!",
      });
    });

    /* ================== REVEAL ANSWER ================== */
    socket.on("quiz-reveal-answer", ({ roomCode }) => {
      // ✅ IMPROVEMENT #4: Security check
      if (socket.roomCode !== roomCode) return;

      const roomData = activeRooms.get(roomCode);
      const data = roomQuestions.get(roomCode);
      if (!roomData || !data?.activeQuestion) return;
      
      const q = data.activeQuestion;
      
      if (q.revealed) return;
      
      // 🔥 ONLY QUESTION SENDER CAN REVEAL
      if (q.senderEmail !== socket.userEmail) {
        socket.emit("quiz-room-error", {
          message: "Only question sender can reveal the answer",
        });
        return;
      }

      updateRoomActivity(roomCode);
      revealAnswer(roomCode, socket.userName);
    });

    /* ================== CHAT ================== */
    socket.on("quiz-send-chat", ({ roomCode, text }) => {
      // ✅ IMPROVEMENT #4: Security check
      if (socket.roomCode !== roomCode) return;

      if (!text || !text.trim()) return;

      const roomData = activeRooms.get(roomCode);
      if (!roomData) return;
      if (!roomData.roomMeta.members.find((m) => m.email === socket.userEmail)) {
        return;
      }

      updateRoomActivity(roomCode);

      io.to(roomCode).emit("quiz-chat-message", {
        id: Date.now().toString(),
        sender: socket.userName,
        senderEmail: socket.userEmail,
        text: text.trim(),
        time: new Date(),
      });
    });

    /* ================== LEAVE / DISCONNECT ================== */
    const leaveRoom = () => {
      const roomCode = socket.roomCode;
      if (!roomCode) return;

      const roomData = activeRooms.get(roomCode);
      if (!roomData) return;

      // Remove from members list if leaving
      roomData.roomMeta.members = roomData.roomMeta.members.filter(
        (m) => m.email !== socket.userEmail,
      );

      // Admin reassignment
      if (
        socket.userEmail === roomData.roomMeta.createdBy.email &&
        roomData.roomMeta.members.length > 0
      ) {
        const newAdmin = roomData.roomMeta.members[0];
        roomData.roomMeta.createdBy = {
          email: newAdmin.email,
          name: newAdmin.name
        };
        newAdmin.isAdmin = true;
      }

      socket.leave(roomCode);
      delete socket.roomCode;
      delete socket.isAdmin;

      // ✅ IMPROVEMENT #2: Remove socket from userSockets
      const userSocketSet = userSockets.get(socket.userEmail);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(socket.userEmail);
        }
      }

      const roomSockets = io.sockets.adapter.rooms.get(roomCode);
      roomData.roomMeta.onlineMembers = roomSockets ? roomSockets.size : 0;

      if (roomData.roomMeta.onlineMembers > 0) {
        updateRoomActivity(roomCode);
      }

      if (roomData.roomMeta.onlineMembers === 0) {
        io.to(roomCode).emit("quiz-member-left", {
          email: socket.userEmail,
          name: socket.userName,
          onlineCount: 0,
          members: [],
        });
        console.log(`👋 ${socket.userName} left ${roomCode} (Room empty)`);
      } else {
        io.to(roomCode).emit("quiz-member-left", {
          email: socket.userEmail,
          name: socket.userName,
          onlineCount: roomData.roomMeta.onlineMembers,
          members: roomData.roomMeta.members,
        });
        console.log(`👋 ${socket.userName} left ${roomCode} (${roomData.roomMeta.onlineMembers} remaining)`);
      }
    };

    socket.on("quiz-leave-room", leaveRoom);
    socket.on("disconnect", () => {
      leaveRoom();
      console.log("🔴 Disconnected:", socket.id);
    });

    /* ================== HELPER ================== */
    function revealAnswer(roomCode, revealedBy) {
      const roomData = activeRooms.get(roomCode);
      const data = roomQuestions.get(roomCode);
      const scores = roomScores.get(roomCode);
      const q = data?.activeQuestion;

      if (!q || q.revealed) return;

      // Clear auto-reveal timer
      if (q.timer) {
        clearTimeout(q.timer);
        q.timer = null;
      }

      q.revealed = true;

      // Calculate scores
      q.answers.forEach((a) => {
        if (a.isCorrect) {
          scores[a.email] = (scores[a.email] || 0) + 10;
        }
      });

      // ✅ IMPROVEMENT #2: Send results to all sockets of each user
      q.answers.forEach((a) => {
        const userSocketSet = userSockets.get(a.email);
        if (userSocketSet) {
          userSocketSet.forEach(socketId => {
            io.to(socketId).emit("quiz-answer-result", {
              isCorrect: a.isCorrect,
              correctAnswer: q.correctAnswer,
              yourAnswer: a.answer,
              points: a.isCorrect ? 10 : 0,
              totalScore: scores[a.email] || 0,
            });
          });
        }
      });

      // Broadcast to all in room
      io.to(roomCode).emit("quiz-answer-revealed", {
        correctAnswer: q.correctAnswer,
        scores,
        revealedBy,
      });

      data.activeQuestion = null;
      updateRoomActivity(roomCode);
    }
  });
};

module.exports = socketIO;