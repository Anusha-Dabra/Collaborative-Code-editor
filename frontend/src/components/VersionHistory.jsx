import React, { useState, useEffect } from 'react';
import { History, Clock, RotateCcw, Save, Tag } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../config';

export default function VersionHistory({ socket, roomId, currentCode, onRestoreCode }) {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSnapshots();
  }, [roomId]);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/snapshots`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
        if (data.snapshots.length > 0) {
          setSelectedSnapshot(data.snapshots[data.snapshots.length - 1]);
        }
      }
    } catch (err) {
      console.error("Failed to load snapshots:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = () => {
    if (!socket) return;
    const label = snapshotLabel.trim() || `Version ${snapshots.length + 1}`;

    socket.emit('save-snapshot', {
      roomId,
      label,
      code: currentCode
    });

    setSnapshotLabel('');
    setTimeout(fetchSnapshots, 300);
  };

  const handleRestore = (snap) => {
    if (window.confirm(`Restore code to version "${snap.label}"?`)) {
      onRestoreCode(snap.code);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface border-l border-subtle">
      {/* Header */}
      <div className="h-10 px-4 border-b border-subtle flex items-center justify-between bg-card">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <History size={14} className="text-amber-400" />
          <span>VERSION TIME-TRAVEL</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{snapshots.length} versions</span>
      </div>

      {/* Snapshot Label Creator Form */}
      <div className="p-3 border-b border-subtle bg-card flex items-center gap-2">
        <input
          type="text"
          value={snapshotLabel}
          onChange={(e) => setSnapshotLabel(e.target.value)}
          placeholder="Version label (e.g. Pre-refactor)"
          className="input-field py-1.5 text-xs font-mono"
        />
        <button
          onClick={handleCreateSnapshot}
          className="btn-primary py-1.5 px-3 text-xs font-mono shrink-0"
        >
          <Save size={13} />
          SAVE
        </button>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline list */}
        <div className="h-44 border-b border-subtle overflow-y-auto p-2 space-y-1.5 bg-obsidian/40">
          {loading ? (
            <div className="p-4 text-center text-xs font-mono text-zinc-500">Loading history...</div>
          ) : snapshots.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono text-zinc-500">No saved snapshots yet</div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                onClick={() => setSelectedSnapshot(snap)}
                className={`p-2 rounded border text-xs cursor-pointer transition-all flex items-center justify-between font-mono ${
                  selectedSnapshot?.id === snap.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-card border-subtle text-zinc-300 hover:bg-surface-hover'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <Tag size={12} className="text-indigo-400" />
                    <span>{snap.label}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    <span>{snap.creatorName} • {new Date(snap.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleRestore(snap); }}
                  className="btn-icon p-1 hover:text-emerald-400"
                  title="Restore this version"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Selected Version Preview */}
        <div className="flex-1 flex flex-col p-3 overflow-hidden bg-surface">
          {selectedSnapshot ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-zinc-400">
                  Previewing: <strong className="text-zinc-200">{selectedSnapshot.label}</strong>
                </span>
                <button
                  onClick={() => handleRestore(selectedSnapshot)}
                  className="btn-primary text-xs font-mono py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500"
                >
                  <RotateCcw size={12} /> RESTORE THIS VERSION
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-3 rounded bg-obsidian border border-subtle font-mono text-xs text-zinc-300 whitespace-pre">
                {selectedSnapshot.code}
              </pre>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-zinc-500">
              Select a snapshot from the timeline to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
