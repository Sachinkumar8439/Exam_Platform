const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

const app = express();


// 🔗 Database connection

// 🌐 Middlewares

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://172.20.110.128:5173"
  ],
  credentials: true
}));

app.use(express.json());


connectDB();

app.use("/api/users", require("./routes/user.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

app.use("/api/courses", require("./routes/course.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/chapters", require("./routes/chapter.routes"));
app.use("/api/questions", require("./routes/question.routes"));
app.use("/api/tests", require("./routes/test.routes"));
app.use("/api/attempts", require("./routes/attempt.routes"));


app.get("/", (req, res) => {
  res.send("✅ Online Test Platform API Running");
});

module.exports = app;
