# CODEHIVE — Collaborative Code Editor & Workstation

A high-performance, real-time multi-user collaborative code workstation built with a refined minimalist design system, CRDT-based conflict resolution, live cursor presence, authentication, role-based access control, sandboxed code execution, version time-travel, and Docker containerization.

---

## ✨ Features

- **Conflict-Free Real-Time Collaboration**: Powered by Yjs CRDTs (Conflict-free Replicated Data Types) ensuring zero edit loss or overwrite conflicts during concurrent multi-user typing.
- **Authentication & Role-Based Authorization**: JWT auth with bcrypt password hashing. Room owners can assign user roles (`owner`, `editor`, `viewer`).
- **Live User Presence & Cursors**: Visual avatar indicators and remote cursor selection highlighting for active room members.
- **Sandboxed Code Execution Engine**: Direct in-browser JavaScript evaluation with `console.log` output log capture and live HTML/CSS rendering.
---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Monaco Editor (`@monaco-editor/react`), Yjs, Socket.IO Client, Custom CSS.
- **Backend**: Node.js, Express, Socket.IO, JWT, Bcrypt.js, File-backed JSON/SQLite storage engine.
- **DevOps**: Docker, Docker Compose

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
