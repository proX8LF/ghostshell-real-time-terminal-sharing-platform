import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { ArrowLeft, Users, Wifi, Share2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const [status, setStatus] = useState({ alive: false, viewers: 0 });
  useEffect(() => {
    if (!terminalRef.current || !sessionId) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      theme: { background: '#09090b', foreground: '#22c55e', cursor: '#22c55e' }
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);
    fit.fit();
    xtermRef.current = term;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/viewer/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'data') term.write(msg.payload);
      if (msg.type === 'session') {
          term.clear();
          term.write(msg.payload.buf || '');
          setStatus(prev => ({ ...prev, alive: true }));
      }
      if (msg.type === 'status') {
          setStatus(prev => ({ ...prev, alive: msg.payload.alive }));
      }
    };
    term.onData(data => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'input', payload: data }));
        }
    });
    const handleResize = () => fit.fit();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, [sessionId]);
  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("URL copied!");
  };
  return (
    <div className="h-screen bg-[#09090b] flex flex-col text-zinc-100">
      <header className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-zinc-500">SESSION: {sessionId?.slice(0, 8)}</span>
            <Badge className={status.alive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}>
              <Wifi className="w-3 h-3 mr-1" />
              {status.alive ? 'LIVE' : 'OFFLINE'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={copyUrl} className="border-zinc-800 hover:bg-zinc-800">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </header>
      <main className="flex-1 p-2 bg-black overflow-hidden relative">
        <div ref={terminalRef} className="w-full h-full max-w-5xl mx-auto" />
      </main>
      <footer className="h-8 flex items-center justify-center bg-red-500/5 border-t border-red-500/10 px-4">
        <p className="text-[10px] uppercase tracking-widest text-red-500/60 font-mono flex items-center gap-2">
          <ShieldAlert className="w-3 h-3" />
          Warning: Host has full terminal access. Trust is mandatory.
        </p>
      </footer>
      <Toaster theme="dark" />
    </div>
  );
}