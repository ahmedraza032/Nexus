import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import meetingRoutes from './routes/meetingRoutes';
import connectionRoutes from './routes/connectionRoutes';
import messageRoutes from './routes/messageRoutes';
import documentRoutes from './routes/documentRoutes';
import { seedDemoUsers } from './scripts/seedDemoUsers';
import { Message } from './models/Message';
import path from 'path';

dotenv.config();

// Connect to DB and seed demo users
connectDB().then(() => {
  seedDemoUsers();
});

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());

// Request logger — shows every incoming request in the terminal
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/documents', documentRoutes);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      return;
    }
    res.status(400).json({ message: err.message });
    return;
  }
  if (err.message?.includes('Invalid file type') || err.message?.includes('must be an image')) {
    res.status(400).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// Socket.IO Logic
const userSockets = new Map<string, string>();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('register', (userId: string) => {
    userSockets.set(userId, socket.id);
    console.log(`Registered user ${userId} with socket ${socket.id}`);
  });

  socket.on('sendMessage', async (data: { senderId: string, receiverId: string, content: string }) => {
    try {
      // Save message to database
      const message = await Message.create({
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        isRead: false
      });

      const formattedMessage = {
        id: message._id.toString(),
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        content: message.content,
        timestamp: message.createdAt,
        isRead: message.isRead
      };

      // Emit to sender for confirmation (optional, but good for real-time update if not relying on REST res)
      socket.emit('messageSent', formattedMessage);

      // Emit to receiver if online
      const receiverSocketId = userSockets.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', formattedMessage);
      }
    } catch (error) {
      console.error('Error saving message from socket:', error);
    }
  });
  // WebRTC Signaling
  socket.on('call-user', (data: { userToCallId: string, callerId: string, callerName: string, roomId: string, isVideo: boolean }) => {
    console.log(`Received call-user from ${data.callerId} to ${data.userToCallId}`);
    const receiverSocketId = userSockets.get(data.userToCallId);
    console.log(`Receiver socket ID: ${receiverSocketId}`);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('incoming-call', {
        callerId: data.callerId,
        callerName: data.callerName,
        roomId: data.roomId,
        isVideo: data.isVideo
      });
    }
  });

  socket.on('decline-call', (data: { callerId: string }) => {
    const callerSocketId = userSockets.get(data.callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-declined');
    }
  });

  socket.on('join-call', (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);
    console.log(`Socket ${socket.id} joined call room ${roomId}`);
  });

  socket.on('webrtc-offer', (data: { offer: any, roomId: string }) => {
    socket.to(data.roomId).emit('webrtc-offer', { offer: data.offer, from: socket.id });
  });

  socket.on('webrtc-answer', (data: { answer: any, roomId: string }) => {
    socket.to(data.roomId).emit('webrtc-answer', { answer: data.answer, from: socket.id });
  });

  socket.on('webrtc-ice-candidate', (data: { candidate: any, roomId: string }) => {
    socket.to(data.roomId).emit('webrtc-ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  socket.on('leave-call', (roomId: string) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-disconnected', socket.id);
    console.log(`Socket ${socket.id} left call room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Email configured: ${process.env.EMAIL_FROM ? '✅ ' + process.env.EMAIL_FROM : '❌ EMAIL_FROM not set'}`);
});
