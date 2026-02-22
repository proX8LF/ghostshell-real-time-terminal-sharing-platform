import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { Env, getAppController } from "./core-utils";
import { AGENT_PY, render_installer, DASHBOARD_HTML, VIEWER_HTML } from './hyprshare';
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
  // Pass through for existing agent compatibility if needed
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Static Assets & Shell Installer
  app.get("/", (c) => c.html(DASHBOARD_HTML));
  app.get("/get", (c) => {
    const url = new URL(c.req.url);
    return c.text(render_installer(url.origin));
  });
  app.get("/agent.py", (c) => c.text(AGENT_PY));
  app.get("/s/:sid", (c) => {
    const sid = c.req.param("sid");
    return c.html(VIEWER_HTML.replace("{{SID}}", sid));
  });
  // WebSocket Proxies
  app.all("/agent/ws", async (c) => {
    const sid = crypto.randomUUID();
    const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sid);
    return agent.fetch(new Request(`${new URL(c.req.url).origin}/agent/ws`, {
        headers: c.req.header(),
        method: 'GET'
    }));
  });
  app.all("/viewer/ws/:sid", async (c) => {
    const sid = c.req.param("sid");
    const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sid);
    return agent.fetch(new Request(`${new URL(c.req.url).origin}/viewer/ws/${sid}`, {
        headers: c.req.header(),
        method: 'GET'
    }));
  });
  // API
  app.get("/api/sessions", async (c) => {
    const controller = getAppController(c.env);
    const sessions = await controller.listSessions();
    // Enrich with viewer counts from DOs
    const enriched = await Promise.all(sessions.map(async (s) => {
        try {
            const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, s.id);
            const res = await agent.fetch(new Request("http://local/meta"));
            const data = await res.json() as any;
            return { ...s, viewers: data?.viewers || 0, alive: data?.alive || false };
        } catch {
            return { ...s, viewers: 0, alive: false };
        }
    }));
    return c.json({ sessions: enriched.filter(s => s.alive) });
  });
}