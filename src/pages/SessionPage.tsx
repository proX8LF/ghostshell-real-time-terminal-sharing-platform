import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TerminalViewer } from '@/components/terminal/TerminalViewer';
import { StatusPayload } from '@/lib/protocol';
import { Terminal, Users, Wifi, WifiOff, ArrowLeft, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  if (!sessionId) return <div>Invalid Session</div>;
  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("URL copied to clipboard!"))
      .catch((err) => {
        if (err.name === 'NotAllowedError') {
          toast.info('Copy the URL manually from the address bar.');
        } else {
          console.error('Clipboard error:', err);
        }
      });
  };
  return (
    <div className="h-screen bg-[#09090b] flex flex-col text-zinc-100">
      {/* Slim Header */}
      <header className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-green-500" />
            <span className="font-mono text-sm font-bold truncate max-w-[120px] md:max-w-none">
              SESSION: {sessionId.slice(0, 8)}
            </span>
          </div>
          <Badge variant="outline" className={`ml-2 font-mono ${status?.hostConnected ? 'border-green-500/50 text-green-500 bg-green-500/5' : 'border-red-500/50 text-red-500 bg-red-500/5'}`}>
            {status?.hostConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {status?.hostConnected ? 'LIVE' : 'WAITING FOR HOST'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-zinc-400 text-sm px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
            <Users className="w-3 h-3" />
            <span className="font-mono">{status?.viewers || 0} Viewers</span>
          </div>
          <Button size="sm" variant="outline" onClick={copyUrl} className="border-zinc-700 hover:bg-zinc-800">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </header>
      {/* Main Terminal Content */}
      <main className="flex-1 p-2 md:p-4 bg-zinc-950 overflow-hidden">
        <div className="w-full h-full max-w-6xl mx-auto">
          <TerminalViewer sessionId={sessionId} onStatusChange={setStatus} />
        </div>
      </main>
      {/* Warning Footer */}
      <footer className="h-8 flex items-center justify-center bg-yellow-500/10 border-t border-yellow-500/20 px-4">
        <p className="text-[10px] uppercase tracking-widest text-yellow-500/80 font-mono">
          ⚠️ Security Warning: Use only for trusted collaborations. Shared terminals allow remote execution.
        </p>
      </footer>
      <Toaster theme="dark" />
    </div>
  );
}