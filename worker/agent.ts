import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState } from './types';
interface SessionMessage {
  type: 'data' | 'resize' | 'input' | 'register' | 'status';
  payload?: any;
}
export class ChatAgent extends Agent<Env, ChatState> {
  private hostSocket: WebSocket | null = null;
  private clientSockets: Set<WebSocket> = new Set();
  private historyBuffer: string[] = [];
  private readonly MAX_HISTORY = 50;
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'terminal-relay'
  };
  async onStart(): Promise<void> {
    console.log(`GhostShell Agent ${this.name} active.`);
  }
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }
      const [client, server] = new Uint8Array(2).map(() => 0).length > 0 ? [null, null] : Object.values(new WebSocketPair());
      await this.handleWebSocket(server as unknown as WebSocket);
      return new Response(null, {
        status: 101,
        webSocket: client as unknown as WebSocket,
      });
    }
    return Response.json({ error: 'Not Found' }, { status: 404 });
  }
  private async handleWebSocket(ws: WebSocket): Promise<void> {
    // @ts-ignore - Cloudflare WS implementation
    ws.accept();
    ws.addEventListener('message', async (event) => {
      try {
        const message: SessionMessage = JSON.parse(event.data as string);
        switch (message.type) {
          case 'register':
            if (message.payload?.role === 'host') {
              this.hostSocket = ws;
              console.log("Host connected");
              this.broadcastStatus();
            } else {
              this.clientSockets.add(ws);
              // Send history to new client
              this.historyBuffer.forEach(data => {
                ws.send(JSON.stringify({ type: 'data', payload: data }));
              });
              this.broadcastStatus();
            }
            break;
          case 'data':
            if (ws === this.hostSocket) {
              const data = message.payload;
              this.historyBuffer.push(data);
              if (this.historyBuffer.length > this.MAX_HISTORY) this.historyBuffer.shift();
              this.clientSockets.forEach(client => {
                if (client.readyState === 1) {
                  client.send(JSON.stringify({ type: 'data', payload: data }));
                }
              });
            }
            break;
          case 'input':
            if (this.hostSocket && this.hostSocket.readyState === 1) {
              this.hostSocket.send(JSON.stringify({ type: 'input', payload: message.payload }));
            }
            break;
          case 'resize':
            if (ws === this.hostSocket) {
              this.clientSockets.forEach(client => {
                if (client.readyState === 1) {
                  client.send(JSON.stringify({ type: 'resize', payload: message.payload }));
                }
              });
            }
            break;
        }
      } catch (e) {
        console.error("WS Message Error", e);
      }
    });
    ws.addEventListener('close', () => {
      if (ws === this.hostSocket) {
        this.hostSocket = null;
      } else {
        this.clientSockets.delete(ws);
      }
      this.broadcastStatus();
    });
  }
  private broadcastStatus() {
    const statusMsg = JSON.stringify({
      type: 'status',
      payload: {
        hostConnected: !!this.hostSocket,
        viewers: this.clientSockets.size
      }
    });
    if (this.hostSocket?.readyState === 1) this.hostSocket.send(statusMsg);
    this.clientSockets.forEach(s => {
      if (s.readyState === 1) s.send(statusMsg);
    });
  }
}