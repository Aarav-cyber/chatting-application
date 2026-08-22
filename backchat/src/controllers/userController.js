const User = require("../models/user");

exports.searchUsers = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.json({
        success: true,
        users: [],
      });
    }

    const users = await User.find({
      // Don't return the currently logged-in user
      _id: {
        $ne: req.userId,
      },

      // Search by name OR email
      $or: [
        {
          name: {
            $regex: q,
            $options: "i",
          },
        },
        {
          email: {
            $regex: q,
            $options: "i",
          },
        },
      ],
    })
      .select("name email profilePic status")
      .limit(20);

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("User search error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
};