import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import { db } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS and JSON parsing
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP Server & Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Real-time Room State Store (In-Memory active sessions & presence)
// roomId -> { users: { socketId: { userId, username, avatarColor, cursor: { line, ch } } }, code: string }
const activeRoomSessions = new Map();

io.on('connection', (socket) => {
  let currentRoomId = null;
  let currentUser = null;

  // USER JOINS A ROOM
  socket.on('join-room', ({ roomId, user }) => {
    if (!roomId || !user) return;

    currentRoomId = roomId;
    currentUser = user;

    socket.join(roomId);

    if (!activeRoomSessions.has(roomId)) {
      const roomData = db.getRoomById(roomId);
      activeRoomSessions.set(roomId, {
        users: new Map(),
        code: roomData ? roomData.activeCode : ''
      });
    }

    const session = activeRoomSessions.get(roomId);
    session.users.set(socket.id, {
      socketId: socket.id,
      userId: user.id,
      username: user.username || user.name || 'Anonymous',
      name: user.name || user.username || 'Anonymous',
      avatarColor: user.avatarColor || '#6366f1',
      cursor: null,
      selection: null
    });

    // Notify room of updated active user list
    const roomUsers = Array.from(session.users.values());
    io.to(roomId).emit('presence-update', roomUsers);

    // Send current code snapshot to joining user
    socket.emit('initial-code', { code: session.code });

    // Emit system broadcast log
    io.to(roomId).emit('chat-message', {
      id: 'sys_' + Date.now(),
      roomId,
      senderId: 'system',
      senderName: 'System',
      senderAvatarColor: '#38bdf8',
      text: `${user.name || user.username} joined the session.`,
      timestamp: new Date().toISOString()
    });
  });

  // REAL-TIME DOCUMENT CODE CHANGE (CRDT / DELTA BROADCAST)
  socket.on('code-change', ({ roomId, delta, fullCode, authorId }) => {
    if (!roomId) return;

    const session = activeRoomSessions.get(roomId);
    if (session) {
      session.code = fullCode;
    }

    // Persist to database in background
    db.updateRoomCode(roomId, fullCode);

    // Broadcast change to all other sockets in the room
    socket.to(roomId).emit('code-change', { delta, fullCode, authorId });
  });

  // REAL-TIME CURSOR & SELECTION POSITION MOVEMENT
  socket.on('cursor-move', ({ roomId, cursor, selection }) => {
    if (!roomId) return;

    const session = activeRoomSessions.get(roomId);
    if (session && session.users.has(socket.id)) {
      const userInfo = session.users.get(socket.id);
      userInfo.cursor = cursor;
      userInfo.selection = selection;

      // Broadcast cursor update to room members
      socket.to(roomId).emit('cursor-move', {
        socketId: socket.id,
        userId: userInfo.userId,
        username: userInfo.username,
        avatarColor: userInfo.avatarColor,
        cursor,
        selection
      });
    }
  });

  // ROOM CHAT MESSAGE RELAY & PERSISTENCE
  socket.on('send-message', ({ roomId, text }) => {
    if (!roomId || !text || !currentUser) return;

    const newMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now(),
      roomId,
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.username,
      senderAvatarColor: currentUser.avatarColor || '#6366f1',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    db.addMessage(newMessage);

    // Relay to all clients in the room
    io.to(roomId).emit('chat-message', newMessage);
  });

  // MANUAL OR PERIODIC SNAPSHOT SAVE
  socket.on('save-snapshot', ({ roomId, label, code }) => {
    if (!roomId || !currentUser) return;

    const snapshot = {
      id: 'snap_' + Date.now(),
      roomId,
      creatorId: currentUser.id,
      creatorName: currentUser.name || currentUser.username,
      label: label || `Snapshot at ${new Date().toLocaleTimeString()}`,
      code: code || '',
      timestamp: new Date().toISOString()
    };

    db.addSnapshot(snapshot);
    io.to(roomId).emit('snapshot-created', snapshot);
  });

  // DISCONNECT HANDLER
  socket.on('disconnect', () => {
    if (currentRoomId && activeRoomSessions.has(currentRoomId)) {
      const session = activeRoomSessions.get(currentRoomId);
      const departingUser = session.users.get(socket.id);
      session.users.delete(socket.id);

      const roomUsers = Array.from(session.users.values());
      io.to(currentRoomId).emit('presence-update', roomUsers);
      socket.to(currentRoomId).emit('user-left', { socketId: socket.id });

      if (departingUser) {
        io.to(currentRoomId).emit('chat-message', {
          id: 'sys_' + Date.now(),
          roomId: currentRoomId,
          senderId: 'system',
          senderName: 'System',
          senderAvatarColor: '#94a3b8',
          text: `${departingUser.name || departingUser.username} left the session.`,
          timestamp: new Date().toISOString()
        });
      }

      if (session.users.size === 0) {
        activeRoomSessions.delete(currentRoomId);
      }
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use by another process (PID 6708 / existing dev server).`);
    console.error(`   The backend is ALREADY running in your other terminal tab.`);
    console.error(`   To run another instance, pass a different port: $env:PORT=4001; npm run dev\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

server.listen(PORT, () => {
  console.log(`⚡ Collaborative Code Editor Server running on http://localhost:${PORT}`);
});
