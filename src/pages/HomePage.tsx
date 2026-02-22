import React, { useEffect, useState } from 'react';
import { Terminal, Shield, Zap, Copy, Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toaster, toast } from 'sonner';
export function HomePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const installCmd = `curl -sSL ${window.location.origin}/get | sh`;
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error("Failed to load sessions");
    }
  };
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);
  const copyCmd = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Installer command copied!");
  };
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-green-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-24 flex flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 text-sm font-mono animate-fade-in">
            <Shield className="w-4 h-4" />
            <span>Encrypted PTY Streaming</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            HYPR<span className="text-green-500">SHARE</span>
          </h1>
          <p className="max-w-2xl text-lg text-zinc-400 mb-10">
            The high-performance terminal sharing platform for modern teams. 
            Zero config, ultra-low latency, powered by Cloudflare.
          </p>
          <Card className="w-full max-w-2xl bg-zinc-900/50 border-zinc-800 p-8 mb-20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Connect your terminal</h3>
              <Button variant="ghost" size="sm" onClick={copyCmd} className="text-zinc-400 hover:text-white">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy Script
              </Button>
            </div>
            <div className="bg-black rounded-xl p-6 font-mono text-sm overflow-x-auto border border-zinc-800/50 group">
              <span className="text-zinc-600 mr-2">$</span>
              <span className="text-green-400">{installCmd}</span>
            </div>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              Requires Python 3 & pip. Works on Linux & MacOS.
            </p>
          </Card>
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-500" />
                Public Broadcasts
              </h2>
              <span className="text-xs font-mono text-zinc-500">{sessions.length} ACTIVE</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.length > 0 ? sessions.map(s => (
                <a 
                  key={s.id}
                  href={`/s/${s.id}`}
                  className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl hover:border-green-500/50 transition-all text-left group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-bold text-white group-hover:text-green-400 transition-colors">{s.name}</span>
                    <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {s.viewers} VIEWERS
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>ID: {s.id.slice(0, 8)}...</span>
                    <span>{new Date(s.createdAt).toLocaleTimeString()}</span>
                  </div>
                </a>
              )) : (
                <div className="col-span-full py-12 border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600 font-mono italic">
                  Waiting for broadcasts to start...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toaster theme="dark" position="bottom-center" />
    </div>
  );
}