const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");

const Message = require("../models/message");
const { pubClient, subClient } = require("../config/redis");

const {
  getOrCreateConversation,
} = require(
  "../services/conversationService"
);

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });


  // Redis adapter
  io.adapter(createAdapter(pubClient, subClient));

  // Socket authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      socket.userId = decoded.userId;

      next();
    } catch (error) {
      console.error(
        `[${process.env.INSTANCE_ID}] Socket authentication failed`
      );

      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `[${process.env.INSTANCE_ID}] User connected: ${socket.userId}`
    );

    // Every authenticated user gets their own room
    socket.join(socket.userId);

    console.log(
      `[${process.env.INSTANCE_ID}] User ${socket.userId} joined room`
    );

    socket.on(
    "sendMessage",
    async ({ receiver, text }, callback) => {
      try {
        if (!receiver || !text?.trim()) {
          return callback?.({
            success: false,
            message:
              "Receiver and message are required",
          });
        }

        const conversation =
          await getOrCreateConversation(
            socket.userId,
            receiver
          );

        const message =
          await Message.create({
            conversation:
              conversation._id,

            sender:
              socket.userId,

            receiver,

            text: text.trim(),
          });

        conversation.lastMessage =
          message._id;

        conversation.lastMessageAt =
          message.createdAt;

        await conversation.save();

        await message.populate(
          "sender",
          "name email profilePic"
        );

        await message.populate(
          "receiver",
          "name email profilePic"
        );

        io.to(receiver).emit(
          "receiveMessage",
          message
        );

        io.to(socket.userId).emit(
          "messageSent",
          message
        );

        callback?.({
          success: true,
          message,
        });
      } catch (error) {
        console.error(
          `[${process.env.INSTANCE_ID}] Message error:`,
          error
        );

        callback?.({
          success: false,
          message:
            "Failed to send message",
        });
      }
    }
);

    socket.on("disconnect", (reason) => {
      console.log(
        `[${process.env.INSTANCE_ID}] User disconnected: ${socket.userId}`,
        reason
      );
    });
  });

  return io;
};

module.exports = initializeSocket;