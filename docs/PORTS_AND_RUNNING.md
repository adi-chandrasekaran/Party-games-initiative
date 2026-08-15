# Ports And Running

> **Legacy runtime:** These ports describe the pre-refactor application only. They are not the
> target architecture. See [`development/local-development.md`](development/local-development.md)
> and [`architecture/target-architecture.md`](architecture/target-architecture.md).

The launcher uses this default local setup:

```txt
Hub:              http://localhost:5176
Imposter:         http://localhost:5181
Quiz Shooter:     http://localhost:5173
Build Beast:      http://localhost:5174
Habit Tracker:    http://localhost:5314
To-do Board:      http://localhost:5315
Timer:            http://localhost:5316
Assignments:      http://localhost:5317
```

Run everything from the project root:

```bash
pnpm dev
```

The hub reads the game URLs from:

```txt
apps/hub/.env.local
```

If a game runs on a different port, update `.env.local`.
