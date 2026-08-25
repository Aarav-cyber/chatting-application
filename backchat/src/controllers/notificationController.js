const {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../services/notificationService");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await getNotifications(req.userId);

    const unreadCount = await getUnreadCount(req.userId);

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load notifications",
    });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await markNotificationRead(
      req.params.notificationId,
      req.userId,
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await markAllNotificationsRead(req.userId);

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Mark all notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
};
