# Target Architecture

Status: **Approved direction; implemented incrementally through the roadmap**

## Architectural Style

The Forge will be a modern TypeScript monorepo implemented as a modular platform:

- One web shell deployed and developed as one frontend origin.
- One platform server for HTTP APIs, authentication, and realtime namespaces initially.
- Micro-app package boundaries for every game and planner tool.
- Shared UI, contracts, configuration, auth, persistence, and testing packages.
- PostgreSQL, Redis, and object storage introduced after local package migration is stable.

Micro-app boundaries do not require one frontend process or browser port per app.

## Intended Layout

```text
forge/
|-- apps/
|   |-- web/
|   |-- platform-server/
|   `-- worker/
|-- microapps/
|   |-- arcade/
|   |   |-- imposter/
|   |   |-- quiz-shooter/
|   |   |-- build-a-beast/
|   |   |-- flashcards/
|   |   |-- quiz-bowl/
|   |   `-- word-match/
|   `-- planner/
|       |-- habit-tracker/
|       |-- todo-board/
|       |-- timer/
|       `-- assignments/
|-- packages/
|   |-- ui/
|   |-- design-tokens/
|   |-- app-sdk/
|   |-- app-registry/
|   |-- contracts/
|   |-- auth/
|   |-- database/
|   |-- realtime/
|   |-- storage/
|   `-- test-utils/
|-- infrastructure/
|-- pnpm-workspace.yaml
`-- turbo.json
```

## Micro-App Contract

Each micro-app will declare a typed manifest containing at least:

- Stable ID and title.
- Product area and route.
- Lazy-loaded client entry point.
- Required roles and permissions.
- Supported deck capabilities.
- Optional platform-server plugin.
- Shared event and API contracts.
- Unit, integration, and Playwright coverage.

The app registry drives navigation and routing. The shell must not know port numbers or contain
game-specific launch conditionals.

## Local Runtime Goal

The default developer workflow should expose:

- One visible web URL.
- One platform API/realtime server.
- Optional worker only when testing document processing.

Micro-apps compile into lazy chunks served by the web shell. Server modules mount into the
platform server using explicit namespaces and contracts.

## Migration Strategy

Use a strangler migration:

1. Establish tests around current behavior.
2. Introduce the workspace and shared contracts without behavior changes.
3. Port the Figma shell behind adapters.
4. Migrate one micro-app at a time to same-origin package routing.
5. Replace persistence and authentication after user workflows are protected by tests.
6. Remove legacy processes and compatibility code only after parity is demonstrated.

## Local-First Constraint

Production deployment configuration is intentionally deferred. The local-refactor phase exits
only after all micro-apps launch through the shared shell, automated tests pass, and legacy
frontend ports are no longer required.
