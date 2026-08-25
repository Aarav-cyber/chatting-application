const Notification = require("../models/notification");

const createMessageNotification = async ({
  recipient,
  sender,
  conversation,
  message,
}) => {
  return Notification.create({
    recipient,
    sender,
    type: "message",
    conversation,
    message,
  });
};

const getNotifications = async (userId) => {
  return Notification.find({
    recipient: userId,
  })
    .populate("sender", "name email profilePic")
    .populate("message", "text createdAt")
    .populate("conversation", "_id")
    .sort({
      createdAt: -1,
    })
    .limit(50);
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({
    recipient: userId,
    read: false,
  });
};

const markNotificationRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
    },
    {
      $set: {
        read: true,
      },
    },
    {
      new: true,
    },
  );
};

const markAllNotificationsRead = async (userId) => {
  return Notification.updateMany(
    {
      recipient: userId,
      read: false,
    },
    {
      $set: {
        read: true,
      },
    },
  );
};

module.exports = {
  createMessageNotification,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
