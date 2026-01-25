const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const { getAllUsers, toggleBlockUser, deleteUser } = require("../controllers/user.controller");

router.use(auth);    // all routes need login
router.use(admin);   // all routes admin only

router.get("/users", getAllUsers);
router.put("/users/:id/block", toggleBlockUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
