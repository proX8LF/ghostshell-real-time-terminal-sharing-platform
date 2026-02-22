# Cloudflare AI Chat Agent Template

A production-ready full-stack AI chatbot application powered by Cloudflare Workers. Features persistent chat sessions via Durable Objects, tool calling (web search, weather, custom MCP tools), streaming responses, and a modern React frontend with shadcn/ui.

**[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/proX8LF/ghostshell-real-time-terminal-sharing-platform)**

## ✨ Key Features

- **Multi-Session Chat**: Create, manage, and switch between unlimited chat sessions with automatic title generation.
- **AI Tool Calling**: Built-in tools for web search (SerpAPI), weather, and extensible MCP (Model Context Protocol) integration.
- **Streaming Responses**: Real-time message streaming for natural conversation flow.
- **Model Flexibility**: Switch between Gemini models (Flash, Pro) via Cloudflare AI Gateway.
- **Persistent Storage**: Conversations stored in Durable Objects with activity tracking.
- **Modern UI**: Responsive React app with Tailwind CSS, shadcn/ui components, dark mode, and sidebar navigation.
- **Session Management API**: RESTful endpoints for listing, creating, updating, and deleting sessions.
- **Error Handling & Logging**: Robust client/server error reporting and retries.

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Lucide icons, TanStack Query, React Router
- **Backend**: Cloudflare Workers, Hono, Cloudflare Agents SDK, Durable Objects, OpenAI SDK (Cloudflare AI Gateway compatible)
- **AI**: Google Gemini models via Cloudflare AI Gateway, SerpAPI for search, MCP for advanced tools
- **Build Tools**: Bun, Wrangler, esbuild
- **UI/UX**: Framer Motion, Sonner toasts, immersive theming

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) installed
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) (`bunx wrangler@latest`)
- Cloudflare account with AI Gateway configured

### Installation
```bash
bun install
```

### Generate TypeScript types
```bash
bun run cf-typegen
```

### Development
```bash
bun run dev
```
Opens at `http://localhost:8787` (or `$PORT`).

### Production Build
```bash
bun run build
```

## 📖 Usage

### Chat Sessions
- **Create Session**: `POST /api/sessions` with `{ title?, sessionId?, firstMessage? }`
- **List Sessions**: `GET /api/sessions`
- **Delete Session**: `DELETE /api/sessions/:sessionId`
- **Update Title**: `PUT /api/sessions/:sessionId/title` with `{ title }`
- **Chat**: `POST /api/chat/:sessionId/chat` with `{ message, model?, stream? }`
- **Get Messages**: `GET /api/chat/:sessionId/messages`
- **Clear Chat**: `DELETE /api/chat/:sessionId/clear`
- **Switch Model**: `POST /api/chat/:sessionId/model` with `{ model }`

### Frontend
- Edit `src/pages/HomePage.tsx` for your app UI.
- Use `src/lib/chat.ts` (`chatService`) for API integration.
- Sessions persist across browser refreshes.

## 🔧 Development Workflow

1. **Hot Reload**: `bun run dev` for frontend + worker proxying.
2. **Worker-Only**: `wrangler dev` for backend testing.
3. **Types**: Run `bun run cf-typegen` after worker changes.
4. **Lint**: `bun run lint`
5. **Custom Routes**: Add to `worker/userRoutes.ts`.
6. **Tools**: Extend `worker/tools.ts` or configure MCP servers in `worker/mcp-client.ts`.
7. **Sidebar**: Customize `src/components/app-sidebar.tsx` or use `AppLayout`.

## ☁️ Deployment

Deploy to Cloudflare Workers with full-stack support (frontend + backend).

### Configure Secrets
```bash
wrangler secret put CF_AI_API_KEY
wrangler secret put SERPAPI_KEY
wrangler secret put OPENROUTER_API_KEY  # Optional
```
Update `wrangler.jsonc` vars:
```jsonc
"vars": {
  "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai"
}
```

### Deploy
```bash
bun run deploy  # Builds + wrangler deploy
```
Or use the dashboard.

**[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/proX8LF/ghostshell-real-time-terminal-sharing-platform)**

**Custom Domain**: Set in Wrangler dashboard after deployment.

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CF_AI_BASE_URL` | Yes | Cloudflare AI Gateway OpenAI URL |
| `CF_AI_API_KEY` | Yes | Cloudflare API token |
| `SERPAPI_KEY` | Optional | SerpAPI key for web search |
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key |
| `MCP_*` | Optional | MCP server configs in `mcp-client.ts` |

## 🤝 Contributing

1. Fork & clone
2. `bun install`
3. Make changes in `src/` (UI) or `worker/` (backend)
4. Test with `bun run dev`
5. PR to `main`

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🚀 Star & Deploy

Built with ❤️ for Cloudflare Workers. Star this repo and deploy instantly!

**[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/proX8LF/ghostshell-real-time-terminal-sharing-platform)**