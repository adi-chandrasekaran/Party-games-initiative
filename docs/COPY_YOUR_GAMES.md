# Copy Your Existing Games Into Party Games

> **Legacy document:** Do not use this copy-based workflow for roadmap work. This canonical
> repository now preserves all product changes directly. Read [`README.md`](README.md) and the
> [`roadmap`](roadmap/README.md) before making changes.

Your Quiz Shooter and Build A Beast games are full apps, not tiny static HTML files. That is fine.

The canonical active game implementations already live inside:

```txt
apps/imposter/
apps/quiz-shooter/
apps/build-a-beast/
```

## Important rule

Do **not** copy `node_modules` or `.git` folders.

They are huge and unnecessary.

---

Do not copy, rsync, or replace these folders from another repository. The tracked
`old-games/` copies are historical duplicates retained until PR-13; they are not workspace
packages and must not be launched or edited for product work.

## Current setup

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open:

```txt
http://localhost:5176
```

This project also includes four planner apps under `apps/planner-*`, and `pnpm dev` starts them
automatically. They do not need to be copied from the old game folders.

---

Ports and launcher behavior are baseline-protected until later roadmap milestones. Do not change
them as part of workspace work.
