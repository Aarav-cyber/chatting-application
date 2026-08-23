const { getOnlineUsers } = require("../services/presenceService");

exports.getPresence = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: "userIds must be an array",
      });
    }

    const presence = await getOnlineUsers(userIds);

    res.json({
      success: true,
      presence,
    });
  } catch (error) {
    console.error("Presence error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get presence",
    });
  }
};
