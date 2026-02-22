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
    if (url.pathname.endsWith('/agent/ws')) {
      const [client, server] = Object.values(new WebSocketPair());
      await this.handleAgentWS(server as unknown as WebSocket);
      return new Response(null, { status: 101, webSocket: client as unknown as WebSocket });
    }
    if (url.pathname.includes('/viewer/ws')) {
      const [client, server] = Object.values(new WebSocketPair());
      await this.handleViewerWS(server as unknown as WebSocket);
      return new Response(null, { status: 101, webSocket: client as unknown as WebSocket });
    }
    if (url.pathname === '/meta') {
      return Response.json({
        ...this.sessionData,
        viewers: this.viewers.size
      });
    }
    return new Response('Not Found', { status: 404 });
  }
  private async handleAgentWS(ws: WebSocket) {
    (ws as any).accept();
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
      buf: this.sessionData?.buf || ""
    };
    await registerSession(this.env, sid, this.sessionData.name);
    await this.ctx.storage.put('hypr_session', this.sessionData);
    ws.addEventListener('message', async (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type === 'data') {
          this.sessionData!.buf += msg.payload;
          if (this.sessionData!.buf.length > this.MAX_BUFFER) {
            this.sessionData!.buf = this.sessionData!.buf.slice(-this.MAX_BUFFER);
          }
          this.relayToViewers({ type: 'data', payload: msg.payload });
          updateSessionActivity(this.env, sid);
        } else if (msg.type === 'resize') {
          this.sessionData!.cols = msg.payload.cols;
          this.sessionData!.rows = msg.payload.rows;
          this.relayToViewers({ type: 'resize', payload: msg.payload });
        }
      } catch (err) {
        console.error("Agent WS Error:", err);
      }
    });
    ws.addEventListener('close', () => {
      this.hostSocket = null;
      if (this.sessionData) {
        this.sessionData.alive = false;
        this.relayToViewers({ type: 'status', payload: { alive: false, viewers: this.viewers.size } });
      }
      this.ctx.storage.setAlarm(Date.now() + 120000); // 2 min cleanup
    });
  }
  private async handleViewerWS(ws: WebSocket) {
    (ws as any).accept();
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
    }
    ws.addEventListener('message', (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type === 'input' && this.hostSocket) {
          this.hostSocket.send(JSON.stringify({ type: 'input', payload: msg.payload }));
        }
      } catch (err) {
        console.error("Viewer WS Error:", err);
      }
    });
    ws.addEventListener('close', () => {
      this.viewers.delete(ws);
      if (this.sessionData) {
        this.relayToViewers({ type: 'status', payload: { alive: this.sessionData.alive, viewers: this.viewers.size } });
      }
    });
  }
  private relayToViewers(msg: any) {
    const data = JSON.stringify(msg);
    for (const viewer of this.viewers) {
      if (viewer.readyState === 1) {
        viewer.send(data);
      }
    }
  }
  async onAlarm(): Promise<void> {
    if (!this.hostSocket) {
      await this.ctx.storage.delete('hypr_session');
    }
  }
}