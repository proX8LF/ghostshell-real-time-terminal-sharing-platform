import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Ghost, Shield, Zap, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toaster, toast } from 'sonner';
import { NODE_AGENT_SCRIPT } from '@/lib/node-agent-script';
export function HomePage() {
  const [isCreating, setIsCreating] = useState(false);
  const [session, setSession] = useState<{ id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const startSession = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/sessions', { method: 'POST' });
      const { data } = await res.json();
      setSession({ id: data.sessionId });
      toast.success("Session created! Connect your terminal.");
    } catch (e) {
      toast.error("Failed to create session");
    } finally {
      setIsCreating(false);
    }
  };
  const copyScript = () => {
    if (!session) return;
    const script = NODE_AGENT_SCRIPT(session.id, window.location.origin);
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Script copied to clipboard!");
  };
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-sm font-mono animate-fade-in">
            <Shield className="w-4 h-4" />
            <span>Secure Real-time Terminal Sharing</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            GHOST<span className="text-green-500">SHELL</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
            Broadcast your local shell to the web instantly. High performance, 
            zero configuration, powered by Cloudflare Workers.
          </p>
          {!session ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={startSession}
                disabled={isCreating}
                className="bg-green-600 hover:bg-green-500 text-black font-bold px-8 h-14 text-lg rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-105"
              >
                {isCreating ? "Initializing..." : "Start Broadcasting"}
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-3xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-zinc-900/50 border-zinc-800 p-6 text-left">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Setup Instructions</h3>
                  <Button variant="ghost" size="sm" onClick={copyScript} className="text-zinc-400 hover:text-white">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy Agent Script
                  </Button>
                </div>
                <div className="bg-black rounded-lg p-4 font-mono text-sm overflow-x-auto whitespace-pre border border-zinc-800/50">
                  <span className="text-zinc-500"># 1. Save the copied script as ghostshell-agent.js</span><br/>
                  <span className="text-zinc-500"># 2. Run with Node.js</span><br/>
                  <span className="text-green-500">node ghostshell-agent.js</span>
                </div>
                <div className="mt-6 flex gap-4">
                  <Button 
                    onClick={() => navigate(`/session/${session.id}`)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-12 rounded-lg"
                  >
                    Open Web Console
                  </Button>
                </div>
              </Card>
            </div>
          )}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            <FeatureCard 
              icon={<Zap className="text-yellow-500" />} 
              title="Edge Native" 
              desc="Built on Cloudflare Durable Objects for sub-50ms latency globally."
            />
            <FeatureCard 
              icon={<Ghost className="text-purple-500" />} 
              title="Ephemeral" 
              desc="Sessions are isolated and data is never permanently stored."
            />
            <FeatureCard 
              icon={<Terminal className="text-green-500" />} 
              title="Interactive" 
              desc="Full bi-directional communication with standard PTY support."
            />
          </div>
        </div>
      </div>
      <Toaster theme="dark" position="bottom-center" />
      <footer className="py-8 text-center text-zinc-600 text-xs font-mono">
        GHOSTSHELL v1.0 �� POWERED BY CLOUDFLARE
      </footer>
    </div>
  );
}
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors group">
      <div className="mb-4 w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="text-white font-bold mb-2">{title}</h4>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}