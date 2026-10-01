import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Activity } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../config';

export default function ChatPanel({ socket, roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch initial chat messages from backend
    fetch(`${API_BASE_URL}/api/rooms/${roomId}/messages`, {
      headers: getAuthHeaders()
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch((err) => console.error("Error loading chat messages:", err));
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat-message', handleNewMessage);

    return () => {
      socket.off('chat-message', handleNewMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('send-message', {
      roomId,
      text: inputMessage.trim()
    });

    setInputMessage('');
  };

  return (
    <div className="h-full flex flex-col bg-surface border-l border-subtle">
      {/* Panel Header */}
      <div className="h-10 px-4 border-b border-subtle flex items-center justify-between bg-card">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <MessageSquare size={14} className="text-indigo-400" />
          <span>ROOM DISCUSSION</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{messages.length} msgs</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          if (msg.senderId === 'system') {
            return (
              <div key={msg.id} className="flex items-center gap-2 py-1 px-2.5 rounded bg-indigo-500/5 border border-indigo-500/10 text-[11px] font-mono text-indigo-300/80">
                <Activity size={12} className="text-indigo-400 shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          const isSelf = currentUser && msg.senderId === currentUser.id;

          return (
            <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1 font-mono text-[10px]">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase"
                  style={{ backgroundColor: msg.senderAvatarColor || '#6366f1' }}
                >
                  {msg.senderName ? msg.senderName.charAt(0) : 'G'}
                </span>
                <span className="text-zinc-400">{msg.senderName}</span>
                <span className="text-zinc-600">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-xs break-words leading-relaxed ${
                  isSelf
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-card border border-subtle text-zinc-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-subtle bg-card flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Discuss changes..."
          className="input-field py-1.5 text-xs font-mono"
        />
        <button type="submit" className="btn-primary p-2 shrink-0">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
