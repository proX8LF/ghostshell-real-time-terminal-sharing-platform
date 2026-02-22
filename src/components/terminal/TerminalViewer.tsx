import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { TerminalMessage, StatusPayload } from '@/lib/protocol';
import { Loader2 } from 'lucide-react';
interface TerminalViewerProps {
  sessionId: string;
  onStatusChange?: (status: StatusPayload) => void;
}
export function TerminalViewer({ sessionId, onStatusChange }: TerminalViewerProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    if (!terminalRef.current) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      theme: {
        background: '#09090b',
        foreground: '#22c55e',
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/session/${sessionId}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'register', payload: { role: 'client' } }));
    };
    ws.onmessage = (event) => {
      const msg: TerminalMessage = JSON.parse(event.data);
      if (msg.type === 'data') {
        term.write(msg.payload);
      } else if (msg.type === 'status') {
        onStatusChange?.(msg.payload as StatusPayload);
      }
    };
    ws.onclose = () => setIsConnected(false);
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', payload: data }));
      }
    });
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, [sessionId, onStatusChange]);
  return (
    <div className="relative w-full h-full bg-[#09090b] p-2 rounded-lg border border-zinc-800 shadow-2xl">
      {!isConnected && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            <span className="text-sm font-mono text-green-500">Connecting to Ghost Relay...</span>
          </div>
        </div>
      )}
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}