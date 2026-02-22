import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/session/${sessionId}/viewer/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
      setIsError(false);
      ws.send(JSON.stringify({ type: 'register', payload: { role: 'client' } }));
      // Send initial resize
      requestAnimationFrame(() => {
        const dims = fitAddonRef.current?.proposeDimensions();
        if (dims && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', payload: dims }));
        }
      });
    };

    ws.onmessage = (event) => {
      const msg: TerminalMessage = JSON.parse(event.data);
      if (msg.type === 'data') {
        xtermRef.current?.write(msg.payload);
      } else if (msg.type === 'status') {
        onStatusChange?.(msg.payload as StatusPayload);
      } else if (msg.type === 'resize') {
        fitAddonRef.current?.fit();
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
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
      } else {
        setIsError(true);
      }
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      theme: {
        background: '#09090b',
        foreground: '#22c55e',
        selectionBackground: '#00ff4120',
        cursor: '#00ff41',
        cursorAccent: '#00ff41',
        brightGreen: '#00ff41',
        black: '#0a0a0a',
        brightBlack: '#1a1a1a',
        brightBlue: '#3b82f6',
      }
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    xtermRef.current = term;

    // Initial fit
    fitAddonRef.current?.fit();

    // Input handling
    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', payload: data }));
      }
    });

    // Resize observer
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        const dims = fitAddonRef.current.proposeDimensions();
        fitAddonRef.current.fit();
        if (wsRef.current?.readyState === WebSocket.OPEN && dims) {
          wsRef.current.send(JSON.stringify({ type: 'resize', payload: dims }));
        }
      }
    };

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(terminalRef.current);

    // Connect websocket
    connectWebSocket();

    return () => {
      resizeObserverRef.current?.disconnect();
      wsRef.current?.close();
      xtermRef.current?.dispose();
      fitAddonRef.current = null;
    };
  }, [sessionId, onStatusChange]);

  const handleRetry = useCallback(() => {
    setIsError(false);
    reconnectAttemptsRef.current = 0;
    connectWebSocket();
  }, []);

  return (
    <div className="relative w-full h-full bg-[#09090b] p-2 rounded-lg border border-zinc-800 shadow-2xl">
      {(!isConnected || isError) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            {isError ? (
              <>
                <div className="w-8 h-8 border-2 border-red-500 border-t-green-500 rounded-full animate-spin" />
                <span className="text-sm font-mono text-red-400">Connection failed</span>
                <button
                  onClick={handleRetry}
                  className="px-4 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 text-xs font-mono rounded border border-green-500/50 transition-all"
                >
                  Retry
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
//