const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http")

const connectDB = require("./config/db");

dotenv.config();

const app = express();


// 🔗 Database connection

// 🌐 Middlewares
const Frontend_url = process.env.FRONTEND_BASE_URL || "http://localhost:5173"

console.log("this is frontend url ",Frontend_url)
app.use(cors({
  origin: [Frontend_url,"http://172.20.110.128:5173"],
  credentials: true
}));


app.use(express.json());

const server = http.createServer(app);

// Configure Socket.io with proper CORS
const io = require("socket.io")(server, {
  cors: {
    origin: [Frontend_url,"http://172.20.110.128:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"], // Enable both transports
  allowEIO3: true // For Socket.io v2 compatibility
});

// Initialize socket handlers
const socketIO = require("./socket/socket");
socketIO(io);


connectDB();

app.use("/api/users", require("./routes/user.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/room", require("./routes/room.routes"));

app.use("/api/courses", require("./routes/course.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/chapters", require("./routes/chapter.routes"));
app.use("/api/questions", require("./routes/question.routes"));
app.use("/api/tests", require("./routes/test.routes"));
app.use("/api/attempts", require("./routes/attempt.routes"));


app.get("/", (req, res) => {
  res.send("✅ Online Test Platform API Running");
});

module.exports = server;
