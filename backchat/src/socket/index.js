const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");

const Message = require("../models/message");
const Conversation = require("../models/conversation");
const { pubClient, subClient } = require("../config/redis");
// const presenceClient = pubClient.duplicate();

const { getOrCreateConversation } = require("../services/conversationService");

const {
  addSocket,
  removeSocket,
  isUserOnline,
} = require("../services/presenceService");

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // ==========================================
  // Redis Adapter
  // ==========================================

  io.adapter(createAdapter(pubClient, subClient));

  // ==========================================
  // Socket Authentication
  // ==========================================

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Store authenticated user ID
      // on the socket
      socket.userId = decoded.userId;

      next();
    } catch (error) {
      console.error(
        `[${process.env.INSTANCE_ID}] Socket authentication failed:`,
        error.message,
      );

      next(new Error("Invalid or expired token"));
    }
  });

  // ==========================================
  // Socket Connection
  // ==========================================

  io.on("connection", async (socket) => {
    console.log(
      `[${process.env.INSTANCE_ID}] User connected: ${socket.userId}`,
    );

    // ========================================
    // Typing Indicators
    // ========================================

    socket.on("typing", ({ receiver }) => {
      if (!receiver) {
        return;
      }

      io.to(receiver).emit("userTyping", {
        userId: socket.userId,
      });
    });

    socket.on("stopTyping", ({ receiver }) => {
      if (!receiver) {
        return;
      }

      io.to(receiver).emit("userStoppedTyping", {
        userId: socket.userId,
      });
    });

    // ========================================
    // Read Receipts
    // ========================================

    socket.on("markMessagesRead", async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId,
        });

        if (!conversation) {
          return;
        }

        const messages = await Message.find({
          conversation: conversationId,
          receiver: socket.userId,
          status: {
            $ne: "read",
          },
        });

        if (messages.length === 0) {
          return;
        }

        const messageIds = messages.map((message) => message._id);

        const readAt = new Date();

        await Message.updateMany(
          {
            _id: {
              $in: messageIds,
            },
          },
          {
            $set: {
              status: "read",
              readAt,
            },
          },
        );

        conversation.unreadCounts.set(socket.userId.toString(), 0);

        await conversation.save();

        for (const message of messages) {
          io.to(message.sender.toString()).emit("messageRead", {
            messageId: message._id,
            conversationId,
            readAt,
          });
        }
      } catch (error) {
        console.error("Mark messages read error:", error);
      }
    });

    // ========================================
    // User Room / Presence
    // ========================================

    const socketCount = await addSocket(socket.userId, socket.id);

    socket.join(socket.userId);

    console.log(
      `[${process.env.INSTANCE_ID}] ${socket.userId} now has ${socketCount} active socket(s)`,
    );

    if (socketCount === 1) {
      io.emit("userOnline", {
        userId: socket.userId,
      });
    }

    // ========================================
    // Send Message
    // ========================================

    socket.on("sendMessage", async ({ receiver, text }, callback) => {
      try {
        // Validate message
        if (!receiver || !text?.trim()) {
          return callback?.({
            success: false,
            message: "Receiver and message are required",
          });
        }

        // Create or find conversation
        const conversation = await getOrCreateConversation(
          socket.userId,
          receiver,
        );

        // Create message
        const message = await Message.create({
          conversation: conversation._id,
          // IMPORTANT:
          // Sender comes from the
          // verified JWT.
          sender: socket.userId,
          receiver,
          text: text.trim(),
        });

        const receiverSockets = await io.in(receiver).fetchSockets();

        const isReceiverOnline = receiverSockets.length > 0;

        if (isReceiverOnline) {
          message.status = "delivered";

          await message.save();

          io.to(socket.userId).emit("messageDelivered", {
            messageId: message._id,
          });
        }

        const currentUnread =
          conversation.unreadCounts.get(receiver.toString()) || 0;

        conversation.unreadCounts.set(receiver.toString(), currentUnread + 1);

        // Update conversation
        conversation.lastMessage = message._id;

        conversation.lastMessageAt = message.createdAt;

        await conversation.save();

        // Populate sender
        await message.populate("sender", "name email profilePic");

        // Populate receiver
        await message.populate("receiver", "name email profilePic");

        // Send message to receiver
        io.to(receiver).emit("receiveMessage", message);

        // Send message confirmation
        // back to sender
        io.to(socket.userId).emit("messageSent", message);

        // Acknowledge successful send
        callback?.({
          success: true,
          message,
        });
      } catch (error) {
        console.error(`[${process.env.INSTANCE_ID}] Message error:`, error);

        callback?.({
          success: false,
          message: "Failed to send message",
        });
      }
    });

    // ========================================
    // Disconnect
    // ========================================

    socket.on("disconnect", async (reason) => {
      console.log(
        `[${process.env.INSTANCE_ID}] User disconnected: ${socket.userId}`,
        reason,
      );

      try {
        const remainingSockets = await removeSocket(socket.userId, socket.id);

        console.log(
          `[${process.env.INSTANCE_ID}] ${socket.userId} has ${remainingSockets} socket(s) remaining`,
        );

        if (remainingSockets === 0) {
          io.emit("userOffline", {
            userId: socket.userId,
          });
        }
      } catch (error) {
        console.error("Presence cleanup error:", error);
      }
    });
  });

  return io;
};

module.exports = initializeSocket;
