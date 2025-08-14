const express = require("express");
const router = express.Router();
const User = require("../models/user.js");

// POST /api/login
router.post("/login", async (req, res) => {
  const { full_name, email, google_id, profilePic } = req.body;

  try {
    // Find user or create new
    let user = await User.findOne({ googleId: google_id });

    if (!user) {
      user = await User.create({
        googleId: google_id,
        name: full_name,
        email: email,
        profilePic: profilePic, // you can use profile from Google token if available
      });
    }

    res.json({ user_id: user._id });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// this is for displaying the user info

const userController = require("../controllers/userController.js");

// GET /users
router.get("/users", userController.getAllUsers);

module.exports = router;
