# Local Platform Running

The supported local experience uses a **single platform origin**. The platform server serves the
hub API, the hub client, and every registry-backed micro-app from that origin; launcher cards do
not target independently started frontend processes.

Run the platform from the repository root:

```bash
pnpm dev
```

`PLATFORM_SERVER_PORT` selects the local listening port when needed. `DATABASE_URL` is required
for durable hub, account, deck, and platform-registry state. Copy `.env.example` and provide a
local PostgreSQL URL before starting the platform.

For the complete setup and test commands, see
[`development/local-development.md`](development/local-development.md).
