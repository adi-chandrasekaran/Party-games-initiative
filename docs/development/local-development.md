# Local Development

## Canonical Worktree

The clone may live in any directory. Run commands from the Git worktree containing `AGENTS.md`
and verify it before starting:

```bash
git rev-parse --show-toplevel
test -f "$(git rev-parse --show-toplevel)/AGENTS.md"
```

Do not infer the canonical repository from a folder name or an absolute filesystem path.

## Current Workspace Startup

Use the pinned package manager and lockfile:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The current launcher is `http://localhost:5176`. Additional frontend and backend ports are a
documented legacy runtime constraint, not the target architecture. See `PORTS_AND_RUNNING.md`
only when diagnosing the legacy runtime.

## Target Startup

The current workspace foundation uses:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The developer opens the hub at `http://localhost:5176`; PR-05 and PR-06 will later eliminate
the separate micro-app frontend URLs.

## Registry compatibility configuration

PR-03 resolves launcher destinations through `@forge/app-registry`. The documented legacy
origins are the defaults. A local override may use the corresponding `VITE_*_ORIGIN` value, such
as `VITE_IMPOSTER_ORIGIN`; it must be a complete `http` or `https` origin with no path. Do not
add app URLs directly to the hub.

## Environment Files

- Commit `.env.example` with safe placeholders.
- Never commit Google client secrets, database credentials, session secrets, or real tokens.
- Tests use isolated local values and disposable data.

## Deployment Constraint

Do not add production deployment steps during the local refactor phase. Deployment design begins
only after the roadmap's local exit gate is met.
