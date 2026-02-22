import type { AppController } from './app-controller';
import type { ChatAgent } from './agent';
export interface Env {
    CF_AI_BASE_URL: string;
    CF_AI_API_KEY: string;
    SERPAPI_KEY: string;
    OPENROUTER_API_KEY: string;
    CHAT_AGENT: DurableObjectNamespace<ChatAgent>;
    APP_CONTROLLER: DurableObjectNamespace<AppController>;
}
export function getAppController(env: Env): DurableObjectStub<AppController> {
  const id = env.APP_CONTROLLER.idFromName("controller");
  return env.APP_CONTROLLER.get(id);
}
export async function registerSession(env: Env, sessionId: string, title?: string): Promise<void> {
  try {
    const controller = getAppController(env);
    // Use the DO's addSession logic via the controller stub
    await (controller as any).addSession(sessionId, title);
  } catch (error) {
    console.error('Failed to register session:', error);
  }
}
export async function updateSessionActivity(env: Env, sessionId: string): Promise<void> {
  try {
    const controller = getAppController(env);
    await (controller as any).updateSessionActivity(sessionId);
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
}
export async function unregisterSession(env: Env, sessionId: string): Promise<boolean> {
  try {
    const controller = getAppController(env);
    return await (controller as any).removeSession(sessionId);
  } catch (error) {
    console.error('Failed to unregister session:', error);
    return false;
  }
}