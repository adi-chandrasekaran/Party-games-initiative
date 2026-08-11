# Local Development

## Canonical Worktree

The clone may live in any directory. Run commands from the Git worktree containing `AGENTS.md`
and verify it before starting:

```bash
git rev-parse --show-toplevel
test -f "$(git rev-parse --show-toplevel)/AGENTS.md"
```

Do not infer the canonical repository from a folder name or an absolute filesystem path.

## Current Legacy Startup

Until roadmap PR-02 changes task orchestration, the current project uses:

```bash
npm run install:all
npm run dev
```

The current launcher is `http://localhost:5176`. Additional frontend and backend ports are a
documented legacy constraint, not the target architecture. See `PORTS_AND_RUNNING.md` only when
diagnosing the legacy startup.

## Target Startup

The monorepo target is:

```bash
pnpm install
pnpm dev
```

The developer should open one Forge web URL. Micro-apps should not require manually copying or
opening individual Vite URLs.

## Environment Files

- Commit `.env.example` with safe placeholders.
- Never commit Google client secrets, database credentials, session secrets, or real tokens.
- Tests use isolated local values and disposable data.

## Deployment Constraint

Do not add production deployment steps during the local refactor phase. Deployment design begins
only after the roadmap's local exit gate is met.
