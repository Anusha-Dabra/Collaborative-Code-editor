import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import { Terminal, MessageSquare, History, Play, Users, Lock, Globe, Copy, Check, ArrowLeft, Shield, Eye, Code2 } from 'lucide-react';
import { API_BASE_URL, SOCKET_URL, getAuthHeaders } from '../config';
import ChatPanel from './ChatPanel';
import ConsoleOutput from './ConsoleOutput';
import VersionHistory from './VersionHistory';

export default function EditorWorkspace({ roomId, user, onBackToDashboard }) {
  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('// Loading workspace...');
  const [language, setLanguage] = useState('javascript');
  const [activeUsers, setActiveUsers] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Panel View States
  const [showChat, setShowChat] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const isSelfChange = useRef(false);

  const currentUser = useMemo(() => {
    if (user) return user;
    let stored = sessionStorage.getItem('aether_guest_user');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    const guestUser = {
      id: 'usr_guest_' + Math.random().toString(36).substring(2, 9),
      username: 'Guest_' + Math.floor(100 + Math.random() * 900),
      name: 'Guest Engineer',
      avatarColor: '#38bdf8',
      isGuest: true
    };
    sessionStorage.setItem('aether_guest_user', JSON.stringify(guestUser));
    return guestUser;
  }, [user]);

  useEffect(() => {
    fetchRoomDetails();

    // Connect to Socket.IO backend explicitly
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.emit('join-room', {
      roomId,
      user: currentUser
    });

    // Handle initial code payload
    socket.on('initial-code', ({ code }) => {
      setCode(code);
    });

    // Handle real-time code changes from other users
    socket.on('code-change', ({ fullCode, authorId }) => {
      if (authorId !== currentUser.id) {
        isSelfChange.current = true;
        setCode(fullCode);
      }
    });

    // Handle presence updates
    socket.on('presence-update', (users) => {
      setActiveUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, currentUser]);

  const fetchRoomDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        setLanguage(data.room.language || 'javascript');
        if (data.room.activeCode) {
          setCode(data.room.activeCode);
        }
      }
    } catch (err) {
      console.error("Failed to load room details:", err);
    }
  };

  const handleEditorChange = (value) => {
    if (isSelfChange.current) {
      isSelfChange.current = false;
      return;
    }
    const newCode = value || '';
    setCode(newCode);

    if (socketRef.current) {
      socketRef.current.emit('code-change', {
        roomId,
        fullCode: newCode,
        authorId: currentUser.id
      });
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Custom Dark Monaco Theme configuration
    monaco.editor.defineTheme('aether-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'f472b6' },
        { token: 'function', foreground: '38bdf8' }
      ],
      colors: {
        'editor.background': '#0a0b0d',
        'editor.foreground': '#f1f3f5',
        'editorLineNumber.foreground': '#334155',
        'editorLineNumber.activeForeground': '#818cf8',
        'editor.selectionBackground': '#312e81',
        'editor.inactiveSelectionBackground': '#1e1b4b',
        'editorCursor.foreground': '#6366f1'
      }
    });

    monaco.editor.setTheme('aether-dark');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const userRole = room?.userRole || 'editor';
  const isReadOnly = userRole === 'viewer';

  return (
    <div className="h-screen w-screen bg-obsidian text-zinc-100 flex flex-col overflow-hidden">
      {/* Workstation Workspace Header */}
      <header className="h-12 border-b border-subtle bg-surface px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="btn-icon text-zinc-400 hover:text-white"
            title="Return to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="h-4 w-px bg-subtle"></div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-100">{room?.name || 'Session Room'}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-subtle text-zinc-400">
              {language.toUpperCase()}
            </span>
            {isReadOnly ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                <Eye size={11} /> READ ONLY
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                <Shield size={11} /> {userRole.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Middle Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Active Presence Badges */}
          <div className="flex items-center -space-x-1.5 mr-2">
            {activeUsers.slice(0, 5).map((u, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border border-surface flex items-center justify-center text-[10px] font-bold text-white uppercase shadow"
                style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                title={`${u.name} (Active)`}
              >
                {u.username ? u.username.charAt(0) : 'G'}
              </div>
            ))}
            {activeUsers.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-card border border-subtle flex items-center justify-center text-[9px] font-mono text-zinc-400">
                +{activeUsers.length - 5}
              </div>
            )}
          </div>

          <button
            onClick={copyInviteLink}
            className="btn-secondary text-xs font-mono py-1 px-2.5"
          >
            {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copiedLink ? 'LINK COPIED' : 'SHARE LINK'}
          </button>

          <div className="h-4 w-px bg-subtle"></div>

          {/* Panel Toggle Icon Buttons */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`btn-icon p-1.5 ${showChat ? 'active' : ''}`}
            title="Toggle Discussion Chat"
          >
            <MessageSquare size={15} />
          </button>
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`btn-icon p-1.5 ${showConsole ? 'active' : ''}`}
            title="Toggle Console Output"
          >
            <Terminal size={15} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`btn-icon p-1.5 ${showHistory ? 'active' : ''}`}
            title="Toggle Version History"
          >
            <History size={15} />
          </button>
        </div>
      </header>

      {/* Workspace Main Body Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Monaco Editor Container */}
        <div className="flex-1 flex flex-col bg-obsidian overflow-hidden">
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language === 'html' ? 'html' : language}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                readOnly: isReadOnly,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: true, renderCharacters: false },
                smoothScrolling: true,
                padding: { top: 12, bottom: 12 },
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                tabSize: 2,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on'
              }}
            />
          </div>

          {/* Sandboxed Execution Console (Bottom Panel) */}
          {showConsole && (
            <div className="h-56 shrink-0">
              <ConsoleOutput
                code={code}
                language={language}
              />
            </div>
          )}
        </div>

        {/* Side Panel: Chat or Version History */}
        {showHistory ? (
          <div className="w-80 shrink-0 h-full">
            <VersionHistory
              socket={socketRef.current}
              roomId={roomId}
              currentCode={code}
              onRestoreCode={(newCode) => {
                setCode(newCode);
                handleEditorChange(newCode);
              }}
            />
          </div>
        ) : showChat ? (
          <div className="w-80 shrink-0 h-full">
            <ChatPanel
              socket={socketRef.current}
              roomId={roomId}
              currentUser={user}
            />
          </div>
        ) : null}
      </div>

      {/* Status Bar */}
      <footer className="h-6 border-t border-subtle bg-surface px-4 flex items-center justify-between font-mono text-[11px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SYNCED TO CLOUD CRDT
          </span>
          <span>ROOM: {roomId}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>{language.toUpperCase()}</span>
          <span>{activeUsers.length} ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
