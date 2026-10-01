import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

const DEFAULT_STARTER_CODE = {
  javascript: `// JavaScript Playground
function executeLab() {
  console.log("🚀 Real-time collaborative environment active.");
  
  const metrics = [10, 25, 45, 90];
  const doubled = metrics.map(x => x * 2);
  console.log("Transformed Metrics:", doubled);
}

executeLab();`,
  typescript: `// TypeScript Playground
interface UserSession {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

const activeSession: UserSession = {
  id: "usr_101",
  name: "Developer",
  role: "editor"
};

console.log("Session User:", activeSession.name, "(Role:", activeSession.role + ")");`,
  python: `# Python Workspace
def calculate_fibonacci(n):
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

result = calculate_fibonacci(10)
print(f"Fibonacci Sequence (first 10): {result}")`,
  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; text-align: center; }
    .card { border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; background: #1e293b; display: inline-block; }
    h1 { color: #38bdf8; margin-top: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Collaborative Live Preview</h1>
    <p>Edit HTML/CSS on the left and see changes live!</p>
  </div>
</body>
</html>`,
  json: `{
  "projectName": "Collaborative Code Workstation",
  "version": "1.0.0",
  "features": [
    "Yjs CRDT Conflict Resolution",
    "Live Presence & Cursors",
    "Role-based Authorization",
    "Sandboxed Code Execution"
  ]
}`
};

// LIST ROOMS
router.get('/', authenticateToken, (req, res) => {
  try {
    const allRooms = db.getRooms();
    const userId = req.user.id;

    // Filter rooms user can see: Public rooms OR rooms user owns OR rooms user is a member of
    const visibleRooms = allRooms.map(room => {
      const isOwner = room.ownerId === userId;
      const userRole = room.roles?.[userId] || (isOwner ? 'owner' : 'editor');
      
      return {
        id: room.id,
        name: room.name,
        description: room.description,
        language: room.language,
        accessType: room.accessType,
        ownerId: room.ownerId,
        ownerName: room.ownerName,
        isOwner,
        userRole,
        hasPasscode: Boolean(room.passcode),
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      };
    });

    res.json({ rooms: visibleRooms });
  } catch (err) {
    console.error("Fetch Rooms Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE ROOM
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, description, language, accessType, passcode } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const roomId = 'room-' + Math.random().toString(36).substring(2, 8) + '-' + Date.now().toString(36);
    const selectedLang = language || 'javascript';

    const newRoom = {
      id: roomId,
      name: name.trim(),
      description: (description || '').trim(),
      language: selectedLang,
      accessType: accessType || 'public', // public, passcode, private
      passcode: (passcode || '').trim(),
      ownerId: req.user.id,
      ownerName: req.user.name || req.user.username,
      activeCode: DEFAULT_STARTER_CODE[selectedLang] || `// ${name}\n// Start coding collaboratively!\n`,
      roles: {
        [req.user.id]: 'owner'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.createRoom(newRoom);

    // Initial system message in room chat
    db.addMessage({
      id: 'msg_' + Math.random().toString(36).substring(2, 10),
      roomId,
      senderId: 'system',
      senderName: 'System',
      senderAvatarColor: '#38bdf8',
      text: `Room "${newRoom.name}" initialized by ${newRoom.ownerName}.`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        ...newRoom,
        passcode: undefined,
        userRole: 'owner'
      }
    });
  } catch (err) {
    console.error("Create Room Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET SINGLE ROOM DETAILS & VERIFY PERMISSION
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const roomId = req.params.id;
    const room = db.getRoomById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const userId = req.user.id;
    const isOwner = room.ownerId === userId;
    let userRole = room.roles?.[userId];

    if (!userRole) {
      userRole = isOwner ? 'owner' : (room.accessType === 'public' ? 'editor' : 'viewer');
    }

    res.json({
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        language: room.language,
        accessType: room.accessType,
        hasPasscode: Boolean(room.passcode),
        ownerId: room.ownerId,
        ownerName: room.ownerName,
        activeCode: room.activeCode,
        isOwner,
        userRole,
        roles: room.roles || {},
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      }
    });
  } catch (err) {
    console.error("Get Room Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// VERIFY PASSCODE FOR PROTECTED ROOM
router.post('/:id/verify', authenticateToken, (req, res) => {
  try {
    const roomId = req.params.id;
    const { passcode } = req.body;
    const room = db.getRoomById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.accessType === 'passcode' && room.passcode !== passcode) {
      return res.status(401).json({ error: 'Incorrect room passcode' });
    }

    // Auto-grant editor role on successful passcode verification if not set
    if (!room.roles?.[req.user.id]) {
      db.updateRoomRole(roomId, req.user.id, 'editor');
    }

    res.json({ success: true, message: 'Passcode verified' });
  } catch (err) {
    console.error("Verify Passcode Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE USER ROLE (OWNER ONLY)
router.post('/:id/role', authenticateToken, (req, res) => {
  try {
    const roomId = req.params.id;
    const { targetUserId, newRole } = req.body;
    const room = db.getRoomById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the room owner can manage roles' });
    }

    if (!['owner', 'editor', 'viewer'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    db.updateRoomRole(roomId, targetUserId, newRole);

    res.json({ success: true, message: `User role updated to ${newRole}` });
  } catch (err) {
    console.error("Update Role Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET CHAT MESSAGES
router.get('/:id/messages', authenticateToken, (req, res) => {
  try {
    const roomId = req.params.id;
    const messages = db.getMessagesByRoom(roomId);
    res.json({ messages });
  } catch (err) {
    console.error("Get Messages Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET SNAPSHOTS (VERSION HISTORY)
router.get('/:id/snapshots', authenticateToken, (req, res) => {
  try {
    const roomId = req.params.id;
    const snapshots = db.getSnapshotsByRoom(roomId);
    res.json({ snapshots });
  } catch (err) {
    console.error("Get Snapshots Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
