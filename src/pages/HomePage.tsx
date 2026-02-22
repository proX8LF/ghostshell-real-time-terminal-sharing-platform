import React, { useEffect, useState } from 'react';
import { Terminal, Shield, Zap, Copy, Check, Globe, Cpu, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-green-500/30 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-20 flex flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 text-xs font-mono animate-fade-in">
            <Shield className="w-3.5 h-3.5" />
            <span className="tracking-widest uppercase">Encrypted DO Relay Active</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-display font-black tracking-tighter mb-8 bg-gradient-to-b from-white via-white to-zinc-700 bg-clip-text text-transparent">
            HYPR<span className="text-green-500">SHARE</span>
          </h1>
          <p className="max-w-2xl text-lg text-zinc-400 mb-12 leading-relaxed">
            Instant terminal broadcasting for distributed teams.
            Secure, ultra-low latency, and zero-configuration.
            Powered by Cloudflare Agents.
          </p>
          <Card className="w-full max-w-2xl bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm p-1 md:p-8 mb-20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Cpu className="w-32 h-32 text-green-500" />
            </div>
            <div className="relative z-10 p-6 md:p-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Bootstrap Terminal</h3>
                <Button variant="ghost" size="sm" onClick={copyCmd} className="text-zinc-400 hover:text-white h-8 hover:bg-zinc-800">
                  {copied ? <Check className="w-3.5 h-3.5 mr-2 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                  Copy command
                </Button>
              </div>
              <div className="bg-black/80 rounded-xl p-6 font-mono text-sm overflow-x-auto border border-zinc-800 group/cmd relative cursor-pointer" onClick={copyCmd}>
                <div className="flex items-center gap-3">
                  <span className="text-green-700 shrink-0">$</span>
                  <span className="text-green-400 break-all text-left">{installCmd}</span>
                </div>
              </div>
              <p className="mt-6 text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                <Terminal className="w-3 h-3" />
                Requires Python 3.8+ & pip
              </p>
            </div>
          </Card>
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-10 border-b border-zinc-800/50 pb-6">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Public Broadcasts
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                {sessions.length} ACTIVE ROOMS
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.length > 0 ? sessions.map(s => (
                <a
                  key={s.id}
                  href={`/s/${s.id}`}
                  className="group relative p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl hover:border-green-500/30 hover:bg-zinc-900/40 transition-all text-left"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-bold text-sm text-white group-hover:text-green-400 transition-colors uppercase tracking-tight">{s.name}</span>
                    <Badge variant="outline" className="text-[10px] border-green-500/20 bg-green-500/5 text-green-500 font-mono">
                      {s.viewers} LIVE
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    <span>ID: {s.id.slice(0, 8)}</span>
                    <span>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </a>
              )) : (
                <div className="col-span-full py-20 border-2 border-dashed border-zinc-900 rounded-[2rem] text-zinc-600 font-mono text-sm flex flex-col items-center gap-4">
                  <Globe className="w-8 h-8 opacity-20" />
                  <span className="italic">Scanning for active terminal signals...</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-20 py-12 border-t border-zinc-900 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg max-w-2xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-500/80 leading-relaxed text-left">
              <span className="font-bold uppercase">AI Disclaimer:</span> While this project has AI capabilities, there is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period.
            </p>
          </div>
          <div className="text-[11px] text-zinc-600 font-mono text-center space-y-2">
            <p>HyprShare is a terminal-sharing clone developed for educational and professional demonstration purposes.</p>
            <p className="opacity-50">Inspired by open-source terminal broadcasting protocols.</p>
          </div>
        </div>
      </div>
      <Toaster theme="dark" position="bottom-center" />
    </div>
  );
}