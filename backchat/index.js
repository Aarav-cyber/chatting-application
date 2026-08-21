const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./src/config/db");
const initializeSocket = require("./src/socket");

const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const messageRoutes = require("./src/routes/messages");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

const server = http.createServer(app);

initializeSocket(server);

connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});