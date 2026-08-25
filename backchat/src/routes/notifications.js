const express = require("express");

const authenticate = require("../middleware/auth");

const {
  getNotifications,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authenticate, getNotifications);

router.patch("/read-all", authenticate, markAllRead);

router.patch("/:notificationId/read", authenticate, markRead);

module.exports = router;
