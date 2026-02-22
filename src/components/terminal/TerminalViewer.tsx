import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { TerminalMessage, StatusPayload } from '@/lib/protocol';
import { Loader2, WifiOff } from 'lucide-react';
interface TerminalViewerProps {
  sessionId: string;
  onStatusChange?: (status: StatusPayload) => void;
}
export function TerminalViewer({ sessionId, onStatusChange }: TerminalViewerProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/session/${sessionId}/viewer/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
      setIsError(false);
      requestAnimationFrame(() => {
        if (fitAddonRef.current && ws.readyState === WebSocket.OPEN) {
          try {
            const dims = fitAddonRef.current.proposeDimensions();
            if (dims) {
              ws.send(JSON.stringify({ type: 'resize', payload: dims }));
            }
          } catch (e) {
            console.warn("Initial fit failed", e);
          }
        }
      });
    };
    ws.onmessage = (event) => {
      try {
        const msg: TerminalMessage = JSON.parse(event.data);
        if (msg.type === 'data') {
          xtermRef.current?.write(msg.payload);
        } else if (msg.type === 'status') {
          onStatusChange?.(msg.payload as StatusPayload);
        } else if (msg.type === 'session') {
          xtermRef.current?.clear();
          if (msg.payload.buf) xtermRef.current?.write(msg.payload.buf);
        }
      } catch (e) {
        console.error("Message parse error", e);
      }
    };
    ws.onerror = () => {
      setIsError(true);
    };
    ws.onclose = () => {
      setIsConnected(false);
      if (reconnectAttemptsRef.current < 5) {
        const delay = 1000 * Math.pow(2, reconnectAttemptsRef.current);
        setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectWebSocket();
        }, delay);
      }
    };
  }, [sessionId, onStatusChange]);
  useEffect(() => {
    if (!terminalRef.current) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      theme: {
        background: '#09090b',
        foreground: '#22c55e',
        selectionBackground: '#22c55e40',
        cursor: '#22c55e',
      }
    });
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    xtermRef.current = term;
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
          const dims = fitAddonRef.current.proposeDimensions();
          if (wsRef.current?.readyState === WebSocket.OPEN && dims) {
            wsRef.current.send(JSON.stringify({ type: 'resize', payload: dims }));
          }
        } catch (e) {
          // Ignore fit errors if element is hidden
        }
      }
    };
    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(terminalRef.current);
    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', payload: data }));
      }
    });
    connectWebSocket();
    return () => {
      resizeObserverRef.current?.disconnect();
      wsRef.current?.close();
      xtermRef.current?.dispose();
      fitAddonRef.current = null;
    };
  }, [connectWebSocket]);
  return (
    <div className="relative w-full h-full bg-[#09090b] p-2 rounded-lg border border-zinc-800 shadow-2xl overflow-hidden">
      {(!isConnected || isError) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
            {isError ? (
              <>
                <WifiOff className="w-8 h-8 text-red-500" />
                <span className="text-sm font-mono text-red-400">Connection Failed</span>
                <button
                  onClick={() => { setIsError(false); reconnectAttemptsRef.current = 0; connectWebSocket(); }}
                  className="px-6 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-mono rounded-full border border-green-500/30 transition-all"
                >
                  Reconnect
                </button>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                <span className="text-sm font-mono text-green-500">Connecting to Ghost Relay...</span>
              </>
            )}
          </div>
        </div>
      )}
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}