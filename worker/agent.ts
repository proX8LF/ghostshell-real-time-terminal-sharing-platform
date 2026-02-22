import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState } from './types';
import { updateSessionActivity, registerSession } from './core-utils';
interface TerminalSession {
  id: string;
  name: string;
  created: number;
  lastActive: number;
  cols: number;
  rows: number;
  alive: boolean;
  buf: string;
}
export class ChatAgent extends Agent<Env, ChatState> {
  private hostSocket: WebSocket | null = null;
  private viewers: Set<WebSocket> = new Set();
  private sessionData: TerminalSession | null = null;
  private readonly MAX_BUFFER = 64 * 1024; // 64KB
  async onStart(): Promise<void> {
    const stored = await this.ctx.storage.get<TerminalSession>('hypr_session');
    if (stored) this.sessionData = stored;
  }
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sid = this.name;
    if (url.pathname === '/agent/ws') {
      const [client, server] = Object.values(new WebSocketPair());
      await this.handleAgentWS(server as unknown as WebSocket);
      return new Response(null, { status: 101, webSocket: client as unknown as WebSocket });
    }
    if (url.pathname.startsWith('/viewer/ws')) {
      const [client, server] = Object.values(new WebSocketPair());
      await this.handleViewerWS(server as unknown as WebSocket);
      return new Response(null, { status: 101, webSocket: client as unknown as WebSocket });
    }
    if (url.pathname === '/meta') {
        return Response.json(this.sessionData);
    }
    return new Response('Not Found', { status: 404 });
  }
  private async handleAgentWS(ws: WebSocket) {
    // @ts-expect-error - Cloudflare WS
    ws.accept();
    this.hostSocket = ws;
    const sid = this.name;
    this.sessionData = {
      id: sid,
      name: `Session ${sid.slice(0, 8)}`,
      created: Date.now(),
      lastActive: Date.now(),
      cols: 80,
      rows: 24,
      alive: true,
      buf: ""
    };
    await registerSession(this.env, sid, this.sessionData.name);
    await this.ctx.storage.put('hypr_session', this.sessionData);
    ws.addEventListener('message', async (e) => {
      const msg = JSON.parse(e.data as string);
      if (msg.type === 'data') {
        this.sessionData!.buf += msg.payload;
        if (this.sessionData!.buf.length > this.MAX_BUFFER) {
          this.sessionData!.buf = this.sessionData!.buf.slice(-this.MAX_BUFFER);
        }
        this.broadcast({ type: 'data', payload: msg.payload });
        updateSessionActivity(this.env, sid);
      } else if (msg.type === 'resize') {
        this.sessionData!.cols = msg.payload.cols;
        this.sessionData!.rows = msg.payload.rows;
        this.broadcast({ type: 'resize', payload: msg.payload });
      }
    });
    ws.addEventListener('close', () => {
      this.hostSocket = null;
      if (this.sessionData) {
        this.sessionData.alive = false;
        this.broadcast({ type: 'status', payload: { alive: false } });
      }
      this.ctx.storage.setAlarm(Date.now() + 120000); // 120s prune
    });
  }
  private async handleViewerWS(ws: WebSocket) {
    // @ts-expect-error - Cloudflare WS
    ws.accept();
    this.viewers.add(ws);
    if (this.sessionData) {
      ws.send(JSON.stringify({
        type: 'session',
        payload: {
          cols: this.sessionData.cols,
          rows: this.sessionData.rows,
          buf: this.sessionData.buf
        }
      }));
      // Send backlog
      ws.send(JSON.stringify({ type: 'data', payload: this.sessionData.buf }));
    }
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data as string);
      if (msg.type === 'input' && this.hostSocket) {
        this.hostSocket.send(JSON.stringify({ type: 'input', payload: msg.payload }));
      }
    });
    ws.addEventListener('close', () => this.viewers.delete(ws));
  }
  private broadcast(msg: any) {
    const data = JSON.stringify(msg);
    this.viewers.forEach(v => {
      if (v.readyState === 1) v.send(data);
    });
  }
  async onAlarm(): Promise<void> {
    if (!this.hostSocket) {
      await this.ctx.storage.deleteAll();
      // Logic to unregister from app controller would go here
    }
  }
  async listSessions() {
      if (!this.sessionData) return null;
      return {
          id: this.sessionData.id,
          name: this.sessionData.name,
          viewers: this.viewers.size,
          alive: this.sessionData.alive
      };
  }
}