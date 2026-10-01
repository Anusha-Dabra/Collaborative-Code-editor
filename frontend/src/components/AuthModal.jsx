import React, { useState } from 'react';
import { Terminal, Lock, Mail, User, ArrowRight, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'register' 
        ? `${API_BASE_URL}/api/auth/register` 
        : `${API_BASE_URL}/api/auth/login`;

      const payload = mode === 'register' 
        ? { username, name, email, password }
        : { username, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('aether_token', data.token);
      localStorage.setItem('aether_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: 'usr_guest_' + Math.floor(1000 + Math.random() * 9000),
      username: 'guest_' + Math.floor(1000 + Math.random() * 9000),
      name: 'Guest Engineer',
      email: 'guest@aether.local',
      avatarColor: '#38bdf8'
    };
    const mockToken = 'guest_token_' + Date.now();
    localStorage.setItem('aether_token', mockToken);
    localStorage.setItem('aether_user', JSON.stringify(guestUser));
    onAuthSuccess(guestUser);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-subtle mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Terminal size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-base text-zinc-100 tracking-tight">
                {mode === 'login' ? 'Authenticate Workstation' : 'Create Developer Profile'}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">AETHER // CRDT CODE EDITOR</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              USERNAME / EMAIL
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alex_dev or alex@example.com"
                className="input-field pl-9 font-mono"
              />
              <User size={15} className="absolute left-3 top-3 text-zinc-500" />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="input-field font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="input-field pl-9 font-mono"
                  />
                  <Mail size={15} className="absolute left-3 top-3 text-zinc-500" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">PASSWORD</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input-field pl-9 font-mono"
              />
              <Lock size={15} className="absolute left-3 top-3 text-zinc-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2 font-mono py-2.5"
          >
            {loading ? 'AUTHENTICATING...' : (mode === 'login' ? 'ACCESS WORKSTATION' : 'CREATE ACCOUNT')}
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="h-px bg-subtle flex-1"></div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Or continue as</span>
          <div className="h-px bg-subtle flex-1"></div>
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          className="btn-secondary w-full justify-center font-mono py-2 text-xs"
        >
          <Zap size={14} className="text-amber-400" />
          QUICK GUEST SESSION
        </button>

        <div className="mt-5 text-center text-xs text-zinc-400">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-indigo-400 hover:underline font-mono"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-400 hover:underline font-mono"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
