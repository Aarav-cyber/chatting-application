const { Server } = require("socket.io");
const Message = require("../models/message");

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ userId }) => {
      socket.join(userId);

      console.log(`Socket ${socket.id} joined room ${userId}`);
    });

    socket.on("sendMessage", async ({ sender, receiver, text }) => {
      try {
        const message = await Message.create({
          sender,
          receiver,
          text,
        });

        io.to(receiver).emit("receiveMessage", message);

        io.to(sender).emit("receiveMessage", message);
      } catch (error) {
        console.error("Socket message error:", error);

        socket.emit("messageError", {
          message: "Failed to send message",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = initializeSocket;