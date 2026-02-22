export const NODE_AGENT_SCRIPT = (sessionId: string, baseUrl: string) => `
/**
 * GhostShell Agent - Run this locally to share your terminal
 * Usage: node ghostshell-agent.js
 */
const { spawn } = require('child_process');
const WebSocket = require('ws');
const os = require('os');
const SESSION_ID = '${sessionId}';
const WS_URL = \`ws://${window.location.host}/api/session/\${SESSION_ID}/agent/ws\`;
console.log('�� GhostShell: Connecting to ' + WS_URL);
const ws = new WebSocket(WS_URL);
// Simple PTY simulation using child_process for zero-dependency agent
// Note: In production use node-pty for better experience
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const pty = spawn(shell, [], {
  cols: 80,
  rows: 24,
  cwd: process.cwd(),
  env: process.env
});
ws.on('open', () => {
  console.log('✅ Connected to GhostShell platform!');
  ws.send(JSON.stringify({ type: 'register', payload: { role: 'host' } }));
});
pty.stdout.on('data', (data) => {
  ws.send(JSON.stringify({ type: 'data', payload: data.toString() }));
});
pty.stderr.on('data', (data) => {
  ws.send(JSON.stringify({ type: 'data', payload: data.toString() }));
});
ws.on('message', (msg) => {
  const { type, payload } = JSON.parse(msg);
  if (type === 'input') {
    pty.stdin.write(payload);
  }
});
pty.on('exit', () => {
  console.log('Shell exited.');
  process.exit();
});
ws.on('close', () => {
  console.log('Connection closed.');
  process.exit();
});
`;