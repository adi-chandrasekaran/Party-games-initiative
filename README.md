# The Forge

AISC's student-built platform for learning games, planning tools, shared decks, and private
club and class applications.

## Contributor orientation

Every contributor and coding agent must begin with:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/README.md`](docs/README.md)
3. [`docs/roadmap/README.md`](docs/roadmap/README.md)

The repository documentation is the project memory. Work must not rely on context from earlier
chat sessions.

## Refactor status

The current application is a legacy multi-process implementation. It is being migrated through
the self-contained PR milestones in the roadmap to a TypeScript monorepo with one web shell,
micro-app packages, and one modular platform server.

Development is local-first. Production deployment work is intentionally deferred until the
local refactor and automated regression suite are complete.

## Current product areas

The hub now has two tabs:

- AISC Arcade
- AISC Planner

The target arcade catalog contains six games:

- Imposter
- Quiz Shooter
- Build A Beast
- Flashcards
- Quiz Bowl
- Word Match

The planner shows four clickable app cards:

- Habit Tracker
- To-do Board
- Timer
- Assignments

The current apps live in separate folders under `apps/`. The roadmap will convert these into
workspace-managed micro-app packages without changing their behavior.

## Folder structure

```txt
party-games/
  apps/
    hub/              Main Party Games launcher
    imposter/         Put your Imposter game here
    quiz-shooter/     Put your Quiz Shooter game here
    build-a-beast/    Put your Build A Beast game here
    planner-habit/    Habit tracker app
    planner-todo/     To-do board app
    planner-timer/    Timer app
    planner-assignments/ Assignment tracker app
  docs/
  scripts/
  package.json
```

## Local startup

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` builds the hub and starts the platform server. Open the printed platform URL (port
`8787` by default); every launcher, API route, and realtime namespace uses that single origin.

## Legacy migration notes

Read:

```txt
docs/COPY_YOUR_GAMES.md
```

That file documents the previous copy-based workflow and is retained only for historical
context. Do not copy games from another repository during roadmap work.
