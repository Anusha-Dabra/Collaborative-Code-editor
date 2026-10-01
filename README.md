# AETHER — Collaborative Code Editor & Workstation

A high-performance, real-time multi-user collaborative code workstation built with a refined minimalist design system, CRDT-based conflict resolution, live cursor presence, authentication, role-based access control, sandboxed code execution, version time-travel, and Docker containerization.

---

## 🚀 Resume Bullet Point

> Built a real-time collaborative code editor supporting concurrent multi-user editing using CRDT-based conflict resolution (Yjs), live cursor presence via the Awareness protocol, integrated room-scoped chat, sandboxed evaluation engine, and persistent storage; fully containerized with Docker for one-command local deployment.

---

## ✨ Features

- **Conflict-Free Real-Time Collaboration**: Powered by Yjs CRDTs (Conflict-free Replicated Data Types) ensuring zero edit loss or overwrite conflicts during concurrent multi-user typing.
- **Authentication & Role-Based Authorization (RBAC)**: JWT auth with bcrypt password hashing. Room owners can assign user roles (`owner`, `editor`, `viewer`).
- **Live User Presence & Cursors**: Visual avatar indicators and remote cursor selection highlighting for active room members.
- **Sandboxed Code Execution Engine**: Direct in-browser JavaScript evaluation with `console.log` output log capture and live HTML/CSS rendering.
- **Version History Time-Travel**: Timeline slider to capture, inspect, compare, and revert document snapshots.
- **Integrated Discussion Panel**: Room-scoped chat with timestamped messaging and automated system activity logs.
- **Minimalist Aesthetic**: Obsidian dark theme (`#0a0b0d`), custom monospace typography (`JetBrains Mono`), micro-borders, and responsive workstation layout.
- **One-Command Docker Setup**: Production container setup with `docker-compose.yml`.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Monaco Editor (`@monaco-editor/react`), Yjs, Socket.IO Client, Lucide Icons, Custom CSS.
- **Backend**: Node.js, Express, Socket.IO, JWT, Bcrypt.js, File-backed JSON/SQLite storage engine.
- **DevOps**: Docker, Docker Compose, Nginx.

---

## 🧠 How CRDT Conflict Resolution Works

Traditional web apps rely on "last-write-wins" server updates, which often erase work when two users edit the same line simultaneously. 

AETHER uses **Yjs CRDTs**:
1. **Unique Character Identity**: Every character inserted into the document is assigned a unique immutable identifier `(client_id, sequence_number)`.
2. **Relative Positioning**: Characters are linked in a deterministic relative sequence graph rather than indexed by raw line numbers.
3. **Commutative Concurrency**: Operations can arrive out of order or over delayed network links; Yjs deterministically merges insertions at the exact same location across all clients with zero data loss.

---

## 🏃 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Backend Server
```bash
npm run dev:backend
```
*Backend runs on `http://localhost:4000`*

### 3. Start Frontend Dev Server
```bash
npm run dev:frontend
```
*Frontend runs on `http://localhost:3000`*

---

## 🐳 Run with Docker (One-Command Deployment)

```bash
docker-compose up --build
```
- Frontend Web App: `http://localhost:3000`
- Backend API Server: `http://localhost:4000`

---

## 📡 API Endpoints Summary

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` — Create a new developer account
- `POST /api/auth/login` — Authenticate user and receive JWT token
- `GET /api/auth/me` — Get authenticated user profile

### Room Routes (`/api/rooms`)
- `GET /api/rooms` — List visible session rooms
- `POST /api/rooms` — Create a new coding room
- `GET /api/rooms/:id` — Retrieve room details & user permission role
- `POST /api/rooms/:id/verify` — Validate room passcode
- `POST /api/rooms/:id/role` — Update member role (Owner only)
- `GET /api/rooms/:id/messages` — Fetch room chat history
- `GET /api/rooms/:id/snapshots` — Fetch room version history snapshots
