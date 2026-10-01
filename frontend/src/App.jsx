import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import EditorWorkspace from './components/EditorWorkspace';
import AuthModal from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    // Check local storage for authenticated user
    const savedUser = localStorage.getItem('aether_user');
    const savedToken = localStorage.getItem('aether_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Failed to parse saved user:", err);
      }
    }

    // Check URL parameters for direct room joining (?room=xyz)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setActiveRoomId(roomParam);
    }
  }, []);

  const handleSelectRoom = (roomId) => {
    setActiveRoomId(roomId);
    window.history.pushState({}, '', `?room=${roomId}`);
  };

  const handleBackToDashboard = () => {
    setActiveRoomId(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleLogout = () => {
    localStorage.removeItem('aether_token');
    localStorage.removeItem('aether_user');
    setUser(null);
    setActiveRoomId(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-obsidian text-zinc-100 font-sans">
      {activeRoomId ? (
        <EditorWorkspace
          roomId={activeRoomId}
          user={user}
          onBackToDashboard={handleBackToDashboard}
        />
      ) : (
        <Dashboard
          user={user}
          onSelectRoom={handleSelectRoom}
          onLogout={handleLogout}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(authUser) => {
          setUser(authUser);
          setIsAuthOpen(false);
        }}
      />
    </div>
  );
}
