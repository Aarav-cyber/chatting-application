const User = require("../models/user");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-__v");

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};