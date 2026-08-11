# Development Workflow

## Before Starting

```bash
pwd
git rev-parse --show-toplevel
git status --short
git branch --show-current
```

Confirm the resolved root contains this repository's `AGENTS.md`, then read it and the active
roadmap milestone. The workflow must work regardless of where the repository is cloned.

## Branches

- Roadmap: `feat/<roadmap-id>-<description>`
- Isolated bug: `fix/<description>`
- Documentation only: `docs/<description>`
- Maintenance only: `chore/<description>`

Never work directly on `main`. One roadmap milestone equals one feature branch and one PR.

## Commits

Use Conventional Commits:

```text
<type>(<scope>): <imperative summary>
```

Allowed common types are `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, and `build`.

Examples:

```text
feat(registry): add typed micro-app manifests
fix(imposter): preserve selected deck after exit
test(shell): cover persistent rail controls
docs(adr): record same-origin micro-app decision
```

Each commit should compile when practical, have one purpose, and avoid generated files unless
the project explicitly tracks them.

## Pull Requests

- Open a PR only after the milestone's local test gate passes.
- Fill out `.github/PULL_REQUEST_TEMPLATE.md` completely.
- Include screenshots for UI work and terminal evidence for automated tests.
- Document data migrations, manual test steps, risks, and rollback.
- Do not approve or merge your own PR. A human owner reviews and merges on GitHub.
- Address review feedback with additional commits; do not rewrite public history unless the
  human owner requests it.

## Scope Control

If unrelated defects are discovered, document them for a later milestone or isolated fix PR.
Only fix them in the active PR when they block its acceptance criteria, and explain that scope
change in the PR.
