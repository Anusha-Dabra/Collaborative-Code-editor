import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial default schema
const defaultData = {
  users: [
    {
      id: "usr_demo_owner",
      username: "alex_dev",
      name: "Alex Rivera",
      email: "alex@example.com",
      // Password is 'password123' (hashed)
      passwordHash: "$2a$10$7vN3J5N9Zg6ZkX/d.3Z.ceGz6fWk4gqXw.2vY6W2j4rZ9z.ZzZ.2",
      avatarColor: "#6366f1",
      createdAt: new Date().toISOString()
    }
  ],
  rooms: [
    {
      id: "demo-room-101",
      name: "React & Algorithm Lab",
      description: "Collaborative whiteboard & real-time data structures laboratory.",
      language: "javascript",
      accessType: "public", // public, passcode, private
      passcode: "",
      ownerId: "usr_demo_owner",
      ownerName: "Alex Rivera",
      activeCode: `// Welcome to Collaborative Code Editor!
// Simultaneous multi-user editing with Yjs CRDT conflict resolution.

function bubbleSort(arr) {
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

const sampleData = [64, 34, 25, 12, 22, 11, 90];
console.log("Original Array:", sampleData);
console.log("Sorted Array:  ", bubbleSort([...sampleData]));
`,
      roles: {
        "usr_demo_owner": "owner"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  messages: [
    {
      id: "msg_101",
      roomId: "demo-room-101",
      senderId: "usr_demo_owner",
      senderName: "Alex Rivera",
      senderAvatarColor: "#6366f1",
      text: "Welcome to the workspace! Try typing or executing this code.",
      timestamp: new Date().toISOString()
    }
  ],
  snapshots: []
};

let memoryDB = null;
let saveTimeout = null;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize DB
function loadDB() {
  if (memoryDB) return memoryDB;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDB = JSON.parse(raw);
      return memoryDB;
    }
  } catch (err) {
    console.error("Error reading db.json, resetting to defaults:", err.message);
  }
  memoryDB = defaultData;
  saveDBImmediate(memoryDB);
  return memoryDB;
}

function saveDBImmediate(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing db.json:", err.message);
  }
}

function saveDB(data, immediate = false) {
  memoryDB = data;
  if (immediate) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    saveDBImmediate(data);
  } else {
    if (!saveTimeout) {
      saveTimeout = setTimeout(() => {
        saveTimeout = null;
        if (memoryDB) saveDBImmediate(memoryDB);
      }, 500);
    }
  }
}

export const db = {
  getUsers: () => loadDB().users,
  getUserById: (id) => loadDB().users.find(u => u.id === id),
  getUserByUsername: (username) => loadDB().users.find(u => u.username.toLowerCase() === username.toLowerCase()),
  getUserByEmail: (email) => loadDB().users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  createUser: (user) => {
    const data = loadDB();
    data.users.push(user);
    saveDB(data, true);
    return user;
  },

  getRooms: () => loadDB().rooms,
  getRoomById: (id) => loadDB().rooms.find(r => r.id === id),
  createRoom: (room) => {
    const data = loadDB();
    data.rooms.push(room);
    saveDB(data, true);
    return room;
  },
  updateRoomCode: (roomId, code) => {
    const data = loadDB();
    const room = data.rooms.find(r => r.id === roomId);
    if (room) {
      room.activeCode = code;
      room.updatedAt = new Date().toISOString();
      saveDB(data);
    }
    return room;
  },
  updateRoomRole: (roomId, userId, role) => {
    const data = loadDB();
    const room = data.rooms.find(r => r.id === roomId);
    if (room) {
      room.roles = room.roles || {};
      room.roles[userId] = role;
      saveDB(data);
    }
    return room;
  },

  getMessagesByRoom: (roomId) => loadDB().messages.filter(m => m.roomId === roomId),
  addMessage: (message) => {
    const data = loadDB();
    data.messages.push(message);
    saveDB(data);
    return message;
  },

  getSnapshotsByRoom: (roomId) => loadDB().snapshots.filter(s => s.roomId === roomId),
  addSnapshot: (snapshot) => {
    const data = loadDB();
    data.snapshots.push(snapshot);
    // Limit to latest 50 per room
    data.snapshots = data.snapshots.filter((s, idx, arr) => {
      const roomSnaps = arr.filter(x => x.roomId === snapshot.roomId);
      if (roomSnaps.length <= 50) return true;
      return roomSnaps.indexOf(s) >= roomSnaps.length - 50;
    });
    saveDB(data);
    return snapshot;
  }
};
