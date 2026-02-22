import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Wifi, Share2, ShieldAlert, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TerminalViewer } from '@/components/terminal/TerminalViewer';
import { StatusPayload } from '@/lib/protocol';
import { toast, Toaster } from 'sonner';
export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [status, setStatus] = useState<StatusPayload>({ alive: false, viewers: 0 });
  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Connection URL copied to clipboard!");
  };
  return (
    <div className="h-screen bg-[#09090b] flex flex-col text-zinc-100 overflow-hidden">
      <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-2 hover:bg-zinc-800 rounded-full transition-colors group">
            <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:text-white" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Instance ID</span>
              <span className="font-mono text-sm font-bold text-zinc-200">{sessionId?.slice(0, 12)}</span>
            </div>
            <Badge className={status.alive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}>
              <Wifi className="w-3 h-3 mr-1" />
              {status.alive ? 'LIVE' : 'OFFLINE'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
            <Users className="w-3 h-3 text-zinc-500" />
            <span className="text-xs font-mono text-zinc-400">{status.viewers} Viewers</span>
          </div>
          <Button size="sm" variant="outline" onClick={copyUrl} className="border-zinc-800 hover:bg-zinc-800 bg-transparent">
            <Share2 className="w-4 h-4 mr-2" />
            Invite
          </Button>
        </div>
      </header>
      <main className="flex-1 flex flex-col p-4 bg-black relative">
        <div className="flex-1 max-w-6xl w-full mx-auto relative group">
          <TerminalViewer 
            sessionId={sessionId || ''} 
            onStatusChange={setStatus} 
          />
        </div>
      </main>
      <footer className="bg-zinc-950 border-t border-zinc-800 py-3 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            <Zap className="w-3 h-3 text-green-500" />
            GhostShell Protocol v2.1
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            <span className="uppercase">Notice:</span> AI processing limits apply across all active sessions. 
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            HyprShare Clone &copy; 2024
          </div>
        </div>
      </footer>
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}