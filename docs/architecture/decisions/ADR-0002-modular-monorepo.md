# ADR-0002: Modular Monorepo With Micro-App Packages

- Status: Accepted
- Date: 2026-08-11

## Context

The current system launches one frontend process per game or planner tool. This creates port
collisions and inconsistent dependencies without providing meaningful deployment isolation.

## Decision

Use a TypeScript monorepo with `pnpm` workspaces and Turborepo task orchestration. Each game and
planner tool remains an independently testable micro-app package, but frontend micro-apps are
lazy-loaded by one web shell. Server behavior mounts into one modular platform server initially.

Do not introduce Module Federation unless independent team ownership and deployment schedules
later justify its complexity.

## Consequences

- Package boundaries replace frontend-port boundaries.
- Shared identity, design, deck, and contract code has one source.
- New micro-apps are registered through manifests rather than launcher conditionals.
- Runtime services can be split later without reorganizing product code.
