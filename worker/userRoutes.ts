import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { Env, getAppController, registerSession } from "./core-utils";
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
  // Existing Chat Relay
  app.all('/api/chat/:sessionId/*', async (c) => {
    const sessionId = c.req.param('sessionId');
    const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId);
    const url = new URL(c.req.url);
    url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
    return agent.fetch(new Request(url.toString(), {
      method: c.req.method,
      headers: c.req.header(),
      body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
    }));
  });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Create terminal session
  app.post('/api/sessions', async (c) => {
    const sessionId = crypto.randomUUID();
    const title = `Shell Session ${sessionId.slice(0, 8)}`;
    await registerSession(c.env, sessionId, title);
    return c.json({ success: true, data: { sessionId, title } });
  });
  // WebSocket upgrade endpoint for sessions
  app.get('/api/session/:sessionId/ws', async (c) => {
    const sessionId = c.req.param('sessionId');
    const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId);
    // Create new request for the DO
    const url = new URL(c.req.url);
    url.pathname = '/ws';
    return agent.fetch(new Request(url.toString(), {
      headers: c.req.header()
    }));
  });
  app.get('/api/sessions', async (c) => {
    const controller = getAppController(c.env);
    const sessions = await controller.listSessions();
    return c.json({ success: true, data: sessions });
  });
}