const express = require("express");
const router = express.Router();
const { createRoom } = require("../controllers/room.controller");
const auth = require("../middlewares/auth");

router.use(auth)
router.post("/", createRoom);

module.exports = router;
