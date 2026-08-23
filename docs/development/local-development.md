# Local Development

## Canonical Worktree

The clone may live in any directory. Run commands from the Git worktree containing `AGENTS.md`
and verify it before starting:

```bash
git rev-parse --show-toplevel
test -f "$(git rev-parse --show-toplevel)/AGENTS.md"
```

Do not infer the canonical repository from a folder name or an absolute filesystem path.

## Platform Startup

Use the pinned package manager and lockfile:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` stages and builds the hub, then starts the one platform server. Open the URL printed by
that server (port `8787` by default). The hub, API, realtime namespaces, and all micro-app routes
are served from that same origin.

## Environment Files

- Commit `.env.example` with safe placeholders.
- Never commit Google client secrets, database credentials, session secrets, or real tokens.
- Tests use isolated local values and disposable data.
- PostgreSQL persistence is required. The documented local test database URL is
  `postgresql://forge:forge-local-password@127.0.0.1:5432/forge`; do not use this example for a
  shared or production database.
- Supabase is the Google identity provider. Configure `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` in the
  ignored `apps/hub/.env` file. Source that file before `pnpm dev` so the platform server receives
  the non-Vite values too. See
  [`supabase-and-fly-setup.md`](supabase-and-fly-setup.md) for the exact local and future Fly
  procedures.
- Set `TRUSTED_ORIGINS` to the comma-separated browser origins that may make authenticated
  mutations in production. Never configure `AUTH_TEST_GOOGLE_FIXTURES` outside automated tests;
  it is ignored unless `NODE_ENV=test`.

## Deployment Constraint

Do not add production deployment steps during the local refactor phase. Deployment design begins
only after the roadmap's local exit gate is met.
