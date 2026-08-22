const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./src/config/db");
const initializeSocket = require("./src/socket");
const { connectRedis } = require("./src/config/redis");

const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const messageRoutes = require("./src/routes/messages");
const conversationRoutes = require("./src/routes/conversations");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

// ===============================
// Routes
// ===============================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/conversations", conversationRoutes);

// ===============================
// Health Check
// ===============================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// ===============================
// HTTP Server
// ===============================

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// ===============================
// Start Server
// ===============================

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Initialize Socket.IO
    initializeSocket(server);

    // 4. Start HTTP server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();