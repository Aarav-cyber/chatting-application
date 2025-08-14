const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected successfully');
});

const authRoutes = require('./src/routes/auth');
app.use('/api', authRoutes);

const messageRoutes = require('./src/routes/rou-message');
app.use('/api/messages', messageRoutes);

// --- Socket.IO setup ---
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const Message = require('./src/models/message');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room for private chat (room name can be userId or a combination)
  socket.on('joinRoom', ({ userId }) => {
    socket.join(userId);
  });

  // Listen for sendMessage event
  socket.on('sendMessage', async ({ sender, receiver, text }) => {
    // Save message to MongoDB
    const message = await Message.create({ sender, receiver, text });
    // Emit to receiver's room
    io.to(receiver).emit('receiveMessage', message);
    // Optionally emit to sender for confirmation
    io.to(sender).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Change app.listen to server.listen
server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
