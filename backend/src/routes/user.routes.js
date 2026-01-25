const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  toggleBlockUser,
  deleteUser
} = require("../controllers/user.controller");

const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

/**
 * ❌ Public Routes
 */
router.post("/register", register);
router.post("/login", login);

/**
 * 🔐 Protected User Routes
 */
router.get("/me", auth, getProfile);
router.put("/me", auth, updateProfile);

/**
 * 🛡️ Admin Only Routes
 */
router.get("/", auth, admin, getAllUsers);
router.put("/:id/block", auth, admin, toggleBlockUser);
router.delete("/:id", auth, admin, deleteUser);

module.exports = router;
