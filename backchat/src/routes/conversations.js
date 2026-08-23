const express = require("express");

const authenticate = require("../middleware/auth");

const {
  getConversations,
  createConversation,
  getMessages,
} = require("../controllers/conversationController");

const router = express.Router();

router.get("/", authenticate, getConversations);

router.post("/", authenticate, createConversation);

router.get("/:conversationId/messages", authenticate, getMessages);

module.exports = router;
