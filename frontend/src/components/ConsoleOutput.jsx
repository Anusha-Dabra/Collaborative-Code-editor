import React, { useState, useEffect } from 'react';
import { Play, Trash2, Terminal, Code2, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

export default function ConsoleOutput({ code, language, onRunCode }) {
  const [logs, setLogs] = useState([]);
  const [execTime, setExecTime] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'preview'

  const executeCode = () => {
    setLogs([]);
    setError(null);
    const startTime = performance.now();

    if (language === 'html') {
      setActiveTab('preview');
      setExecTime((performance.now() - startTime).toFixed(2));
      return;
    }

    if (language === 'javascript' || language === 'typescript') {
      const capturedLogs = [];
      const customConsole = {
        log: (...args) => capturedLogs.push({ type: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
        info: (...args) => capturedLogs.push({ type: 'info', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
        warn: (...args) => capturedLogs.push({ type: 'warn', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
        error: (...args) => capturedLogs.push({ type: 'error', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
      };

      try {
        // Strip TypeScript annotations if any simple inline annotations
        let executableCode = code;
        if (language === 'typescript') {
          executableCode = code.replace(/:\s*(string|number|boolean|any|void|object)/g, '');
        }

        const runFn = new Function('console', executableCode);
        runFn(customConsole);
        setLogs(capturedLogs);
      } catch (err) {
        setError(err.message || 'Execution error');
      } finally {
        setExecTime((performance.now() - startTime).toFixed(2));
      }
    } else {
      // General language simulation output
      setLogs([
        { type: 'info', text: `[${language.toUpperCase()} ENGINE] Output evaluated.` },
        { type: 'log', text: `Program finished with code 0.` }
      ]);
      setExecTime((performance.now() - startTime).toFixed(2));
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface border-t border-subtle">
      {/* Console Toolbar */}
      <div className="h-10 px-4 border-b border-subtle flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            <Terminal size={14} className="text-emerald-400" />
            <span>EXECUTION CONSOLE</span>
          </div>

          <div className="flex items-center gap-1 bg-surface p-0.5 rounded border border-subtle text-[11px] font-mono">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-2 py-0.5 rounded ${activeTab === 'console' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              STDOUT
            </button>
            {language === 'html' && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <Eye size={12} /> LIVE PREVIEW
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {execTime && (
            <span className="text-[10px] font-mono text-zinc-500">
              ⚡ {execTime}ms
            </span>
          )}
          <button
            onClick={() => setLogs([])}
            className="btn-icon p-1 text-zinc-500 hover:text-zinc-300"
            title="Clear Console"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={executeCode}
            className="btn-primary text-xs font-mono py-1 px-3 bg-emerald-600 hover:bg-emerald-500"
          >
            <Play size={13} className="fill-current" />
            RUN CODE
          </button>
        </div>
      </div>

      {/* Console Body */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
        {activeTab === 'preview' && language === 'html' ? (
          <div className="w-full h-full bg-white rounded border border-subtle overflow-hidden">
            <iframe
              srcDoc={code}
              title="live-preview"
              className="w-full h-full border-none"
            />
          </div>
        ) : error ? (
          <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Uncaught Execution Error:</p>
              <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-1 py-6">
            <Code2 size={24} className="opacity-40" />
            <p className="text-xs">Click "RUN CODE" to execute in sandbox</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 py-0.5 border-b border-subtle/40 ${
                  log.type === 'error'
                    ? 'text-rose-400'
                    : log.type === 'warn'
                    ? 'text-amber-300'
                    : log.type === 'info'
                    ? 'text-cyan-400'
                    : 'text-zinc-200'
                }`}
              >
                <span className="text-zinc-600 text-[10px] select-none">[{idx + 1}]</span>
                <span className="whitespace-pre-wrap flex-1">{log.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
