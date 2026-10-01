import React, { useState, useEffect } from 'react';
import { Plus, Terminal, Users, Lock, Globe, Code2, Copy, Check, ArrowRight, Sparkles, LogOut } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../config';

export default function Dashboard({ user, onSelectRoom, onLogout, onOpenAuth }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // New room form state
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [accessType, setAccessType] = useState('public');
  const [passcode, setPasscode] = useState('');

  // Join room form state
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPasscode, setJoinPasscode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: roomName,
          description,
          language,
          accessType,
          passcode
        })
      });

      const data = await res.json();
      if (res.ok && data.room) {
        setIsCreateModalOpen(false);
        setRoomName('');
        setDescription('');
        onSelectRoom(data.room.id);
      }
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!joinRoomId.trim()) return;

    const targetId = joinRoomId.trim();
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${targetId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Room not found');
      }

      if (data.room.hasPasscode && data.room.userRole !== 'owner') {
        // Verify passcode
        const verifyRes = await fetch(`${API_BASE_URL}/api/rooms/${targetId}/verify`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ passcode: joinPasscode })
        });
        if (!verifyRes.ok) {
          const vData = await verifyRes.json();
          throw new Error(vData.error || 'Invalid room passcode');
        }
      }

      setIsJoinModalOpen(false);
      onSelectRoom(targetId);
    } catch (err) {
      setJoinError(err.message);
    }
  };

  const copyRoomId = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-zinc-100 flex flex-col">
      {/* Workstation Top Navigation Bar */}
      <header className="h-14 border-b border-subtle bg-surface px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Terminal size={18} />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-wide text-zinc-100 flex items-center gap-2">
              AETHER <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">CRDT v2.4</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-subtle">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase"
                  style={{ backgroundColor: user.avatarColor || '#6366f1' }}
                >
                  {user.username ? user.username.charAt(0) : 'G'}
                </div>
                <span className="text-xs font-mono text-zinc-300">{user.name || user.username}</span>
              </div>
              <button
                onClick={onLogout}
                className="btn-icon"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary text-xs font-mono">
              SIGN IN / REGISTER
            </button>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Banner Section */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-indigo-950/40 via-surface to-surface border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono mb-1">
              <Sparkles size={14} />
              <span>REAL-TIME MULTI-USER WORKSPACE</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Collaborative Code Editor
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
              Conflict-free replicated data types (CRDTs), live multi-cursor presence, built-in sandboxed evaluation engine, and persistent session rooms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="btn-secondary font-mono text-xs py-2.5"
            >
              JOIN ROOM CODE
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary font-mono text-xs py-2.5"
            >
              <Plus size={16} />
              NEW SESSION ROOM
            </button>
          </div>
        </div>

        {/* Room List Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-subtle">
          <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
            ACTIVE SESSION ROOMS ({rooms.length})
          </h3>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="py-16 text-center text-zinc-500 font-mono text-xs">
            Loading active sessions...
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-subtle rounded-xl bg-surface/50">
            <Code2 size={32} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-sm font-medium text-zinc-300">No active rooms found</p>
            <p className="text-xs text-zinc-500 mt-1">Create a room or join with a room ID to start coding collaboratively.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary font-mono text-xs mt-4"
            >
              CREATE FIRST ROOM
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className="group bg-card hover:bg-surface-hover border border-subtle hover:border-indigo-500/40 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      {room.language}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                      {room.hasPasscode ? (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Lock size={12} /> PROTECTED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Globe size={12} /> PUBLIC
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-semibold text-base text-zinc-100 group-hover:text-indigo-300 transition-colors mb-1">
                    {room.name}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 min-h-[32px]">
                    {room.description || 'No description provided for this session.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-subtle flex items-center justify-between text-xs text-zinc-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} />
                    <span>Owner: {room.ownerName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => copyRoomId(room.id, e)}
                      className="btn-icon p-1 text-zinc-400 hover:text-white"
                      title="Copy Room ID"
                    >
                      {copiedId === room.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <span className="group-hover:translate-x-1 transition-transform text-indigo-400">
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE ROOM MODAL */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="font-semibold text-base mb-1">Create Session Room</h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Configure environment settings</p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">ROOM NAME</label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Distributed Consensus Lab"
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">DESCRIPTION</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief objective of this coding room..."
                  rows={2}
                  className="input-field font-mono resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">PRIMARY LANGUAGE</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="input-field font-mono bg-surface text-zinc-200"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML / CSS</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">ACCESS PERMISSION</label>
                  <select
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value)}
                    className="input-field font-mono bg-surface text-zinc-200"
                  >
                    <option value="public">Public (Open)</option>
                    <option value="passcode">Passcode Protected</option>
                  </select>
                </div>
              </div>

              {accessType === 'passcode' && (
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">SET ROOM PASSCODE</label>
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter passcode"
                    className="input-field font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary font-mono text-xs"
                >
                  CANCEL
                </button>
                <button type="submit" className="btn-primary font-mono text-xs">
                  INITIALIZE ROOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN ROOM MODAL */}
      {isJoinModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="font-semibold text-base mb-1">Join Coding Room</h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">Enter target Room ID or invite code</p>

            {joinError && (
              <div className="mb-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                ⚠️ {joinError}
              </div>
            )}

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">ROOM ID</label>
                <input
                  type="text"
                  required
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="e.g. room-abc123-xyz"
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">PASSCODE (IF PROTECTED)</label>
                <input
                  type="password"
                  value={joinPasscode}
                  onChange={(e) => setJoinPasscode(e.target.value)}
                  placeholder="Leave empty if public"
                  className="input-field font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="btn-secondary font-mono text-xs"
                >
                  CANCEL
                </button>
                <button type="submit" className="btn-primary font-mono text-xs">
                  CONNECT TO ROOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
