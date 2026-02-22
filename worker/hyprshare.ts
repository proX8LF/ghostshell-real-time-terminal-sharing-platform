export const AGENT_PY = `
import sys, os, subprocess, json, threading, time, argparse, signal
try:
    import websocket
except ImportError:
    print("Error: 'websocket-client' package not found. Install with: pip install websocket-client")
    sys.exit(1)
class HyprAgent:
    def __init__(self, server_url, sid, secret=None):
        self.server_url = server_url.replace('http', 'ws')
        self.sid = sid
        self.ws = None
        self.secret = secret
        self.shell = os.environ.get('SHELL', '/bin/bash')
        self.pty_process = None
    def on_message(self, ws, message):
        try:
            msg = json.loads(message)
            if msg['type'] == 'input':
                os.write(self.master_fd, msg['payload'].encode())
        except Exception as e:
            print(f"Msg Error: {e}")
    def on_error(self, ws, error):
        print(f"WS Error: {error}")
    def on_close(self, ws, close_status_code, close_msg):
        print("### Connection Closed ###")
        os.kill(os.getpid(), signal.SIGTERM)
    def on_open(self, ws):
        print(f"Connected to HyprShare Relay for Session: {self.sid}")
        reg = {"type": "register", "payload": {"role": "host", "secret": self.secret}}
        ws.send(json.dumps(reg))
    def run_shell(self):
        import pty
        self.master_fd, slave_fd = pty.openpty()
        self.pty_process = subprocess.Popen(self.shell, stdin=slave_fd, stdout=slave_fd, stderr=slave_fd, close_fds=True)
        def read_pty():
            while True:
                try:
                    data = os.read(self.master_fd, 4096)
                    if not data: break
                    if self.ws and self.ws.sock and self.ws.sock.connected:
                        self.ws.send(json.dumps({"type": "data", "payload": data.decode('utf-8', errors='ignore')}))
                except: break
        threading.Thread(target=read_pty, daemon=True).start()
    def start(self):
        self.run_shell()
        ws_endpoint = f"{self.server_url}/api/session/{self.sid}/agent/ws"
        self.ws = websocket.WebSocketApp(ws_endpoint,
                                  on_open=self.on_open,
                                  on_message=self.on_message,
                                  on_error=self.on_error,
                                  on_close=self.on_close)
        self.ws.run_forever()
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--server", required=True)
    parser.add_argument("--sid", required=True)
    args = parser.parse_args()
    agent = HyprAgent(args.server, args.sid)
    agent.start()
`;
export const render_installer = (baseUrl: string) => `#!/bin/bash
set -e
SID=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 12)
echo "🚀 Bootstrapping HyprShare Agent... Session ID: $SID"
pip install websocket-client --quiet || pip3 install websocket-client --quiet
curl -sSL ${baseUrl}/agent.py > agent.py
echo "✅ Agent downloaded. Starting session..."
python3 agent.py --server ${baseUrl} --sid $SID
`;
export const DASHBOARD_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyprShare | Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'JetBrains Mono', monospace; background: #09090b; color: #f4f4f5; }
        .glow { box-shadow: 0 0 20px rgba(34, 197, 94, 0.2); }
    </style>
</head>
<body class="p-8 max-w-5xl mx-auto">
    <header class="mb-12 flex justify-between items-end">
        <div>
            <h1 class="text-5xl font-black text-green-500 tracking-tighter">HYPR<span class="text-white">SHARE</span></h1>
            <p class="text-zinc-500 mt-2">Instant terminal broadcasting via Cloudflare Workers.</p>
        </div>
    </header>
    <section class="mb-12 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl glow">
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Start a Session
        </h2>
        <div class="bg-black p-4 rounded-lg border border-zinc-800 flex justify-between items-center overflow-hidden">
            <code id="install-cmd" class="text-green-400 text-xs truncate">curl -sSL ${new URL('/', 'https://' + 'placeholder').origin}/get | sh</code>
            <button onclick="copyCmd()" class="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded ml-4">COPY</button>
        </div>
    </section>
    <section>
        <h2 class="text-zinc-500 uppercase text-xs tracking-widest font-bold mb-6">Live Broadcasts</h2>
        <div id="sessions-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
    </section>
    <script>
        const baseUrl = window.location.origin;
        document.getElementById('install-cmd').innerText = \`curl -sSL \${baseUrl}/get | sh\`;
        async function fetchSessions() {
            try {
                const res = await fetch('/api/sessions');
                const { sessions } = await res.json();
                const grid = document.getElementById('sessions-grid');
                grid.innerHTML = (sessions || []).map(s => \`
                    <a href="/s/\${s.id}" class="block bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:border-green-500/50 transition-all">
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-bold text-sm">\${s.name}</span>
                            <span class="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">\${s.viewers} VIEWERS</span>
                        </div>
                        <span class="text-xs text-zinc-500">ID: \${s.id.slice(0,8)}...</span>
                    </a>
                \`).join('') || '<p class="text-zinc-600">No active sessions found. Run the command above to start one.</p>';
            } catch (e) { console.error(e); }
        }
        function copyCmd() {
            navigator.clipboard.writeText(document.getElementById('install-cmd').innerText);
            alert("Command copied!");
        }
        fetchSessions();
        setInterval(fetchSessions, 5000);
    </script>
</body>
</html>
`;
export const VIEWER_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyprShare | View</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
    <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #000; overflow: hidden; }
        .xterm-viewport::-webkit-scrollbar { width: 8px; }
        .xterm-viewport::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
    </style>
</head>
<body class="h-screen flex flex-col">
    <header class="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950">
        <div class="flex items-center gap-4">
            <a href="/" class="text-zinc-500 hover:text-white">←</a>
            <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">HyprShare Terminal</span>
        </div>
        <div id="status" class="text-[10px] text-zinc-600 font-mono">CONNECTING...</div>
    </header>
    <main id="terminal" class="flex-1 p-2"></main>
    <script>
        const sid = "{{SID}}";
        const term = new Terminal({
            theme: { background: '#000', foreground: '#22c55e', cursor: '#22c55e' },
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14,
            cursorBlink: true
        });
        const fit = new FitAddon.FitAddon();
        term.loadAddon(fit);
        term.open(document.getElementById('terminal'));
        fit.fit();
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(\`\${protocol}//\${window.location.host}/api/session/\${sid}/viewer/ws\`);
        ws.onopen = () => {
            document.getElementById('status').innerText = 'LIVE';
            document.getElementById('status').classList.add('text-green-500');
        };
        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'data') term.write(msg.payload);
        };
        term.onData(data => ws.send(JSON.stringify({type: 'input', payload: data})));
        window.onresize = () => fit.fit();
    </script>
</body>
</html>
`;