# The Forge Agent Constitution

This file is the mandatory starting point for every human or automated contributor.
It applies to the entire repository. More specific `AGENTS.md` files may add rules for
a subdirectory, but they may not weaken this constitution.

## 1. Orient Before Acting

Before changing code:

1. Read [`docs/README.md`](docs/README.md).
2. Read the active milestone in [`docs/roadmap/README.md`](docs/roadmap/README.md).
3. Read [`docs/product/feature-catalog.md`](docs/product/feature-catalog.md).
4. Read the current and target architecture documents under `docs/architecture/`.
5. Check `git status`, the current branch, and recent commits.

Do not depend on previous chat history. Repository documentation is the project memory.
If implementation and documentation disagree, first record the exact discrepancy and the
evidence used to establish it. When reconciling that discrepancy is explicitly in scope for
the active milestone, update the affected documentation in the same branch before proceeding
with the milestone. Otherwise, stop and surface the discrepancy for a human decision.

## 2. Protect Existing Behavior

- Preserve working game, planner, authentication, deck, profile, chat, statistics, club,
  class, and request behavior unless the active roadmap milestone explicitly changes it.
- Never replace a working implementation with a placeholder, mock, or "coming soon" card.
- Never alter an unrelated app while fixing another app.
- Never delete, reset, or overwrite user work to make a change easier.
- Use an incremental migration with compatibility adapters rather than a big-bang rewrite.
- Keep legacy behavior available until its replacement passes the milestone acceptance tests.

## 3. Canonical Sources

- This repository is the canonical product repository.
- The Figma prototype identified in
  [`docs/design/figma-reference.md`](docs/design/figma-reference.md) is the canonical visual
  reference for the shell, navigation, typography, spacing, themes, and cards. It is not the
  source of truth for production data or game logic.
- Product requirements live in `docs/product/`.
- Architectural decisions live in `docs/architecture/decisions/`.
- Sequencing and milestone status live in `docs/roadmap/README.md`.
- Do not work from duplicate Party Games directories or copy generated output between repos.

## 4. Architecture Boundaries

- Treat each game and planner tool as a micro-app package with a manifest and explicit
  client, server, contract, and test boundaries where applicable.
- Prefer package boundaries over separate frontend processes. The target local experience is
  one visible web origin and one platform server, not one browser port per micro-app.
- Shared UI belongs in a design-system package. Shared contracts belong in a contracts
  package. Do not duplicate them inside apps.
- No new hardcoded `localhost` URLs. Resolve routes and service locations through the app
  registry and typed configuration.
- No machine-specific absolute filesystem paths. Resolve dependencies through package
  manifests, repository-relative paths, or validated configuration.
- No new JSON-file production persistence, browser-only account data, or process-only shared
  multiplayer state.
- Do not introduce Module Federation, a new framework, or a new deployment service without
  an accepted Architecture Decision Record (ADR).

## 5. Roadmap Discipline

- Work only on one active roadmap milestone at a time unless the human owner explicitly
  changes priority.
- Before implementation, mark the milestone `In progress` and ensure its scope, exclusions,
  acceptance criteria, tests, and rollback strategy are documented.
- Do not pull future milestone work into the current PR.
- If new requirements emerge, document them and place them in the roadmap before coding.
- Deployment work is deferred until the local refactor is functional and tested. Do not add
  production infrastructure during the local-foundation milestones.

## 6. Git and Pull Requests

- Never develop directly on `main`.
- Use `feat/<roadmap-id>-<short-description>` for roadmap work.
- Use `fix/<short-description>`, `docs/<short-description>`, or `chore/<short-description>`
  only for genuinely isolated non-roadmap work.
- Keep one PR focused on one milestone. Do not bundle unrelated cleanup.
- Use Conventional Commits, for example:
  - `feat(shell): add registry-driven micro-app routes`
  - `fix(arcade): restore quiz shooter launcher navigation`
  - `test(auth): cover AISC hosted-domain rejection`
  - `docs(roadmap): record PR-03 acceptance criteria`
- Keep commits reviewable and do not use vague messages such as `updates`, `fix stuff`, or
  `working`.
- Push the branch and open a PR when the milestone is complete. Agents may prepare and open
  PRs, but must not approve or merge them. Final GitHub approval and merge belong to a human.
- Include the roadmap milestone, risk, test evidence, screenshots for UI changes, and rollback
  instructions in every PR.

## 7. Test-First Completion Rules

Every behavior-changing PR must include tests at the appropriate levels:

- Unit tests for deterministic domain and utility logic.
- Integration or contract tests for API, persistence, auth, and realtime boundaries.
- Playwright end-to-end tests for user-visible workflows.
- Playwright visual screenshots for Figma-parity shell changes.
- Regression tests for every bug fixed.

Do not weaken, skip, or delete a failing test simply to make CI pass. If a test cannot run,
report that explicitly and leave the milestone incomplete.

## 8. Self-Contained PR Standard

A PR is complete only when:

- Its milestone acceptance criteria are met.
- New and existing tests pass locally.
- `lint`, type-check, build, unit, integration, and relevant Playwright tests pass.
- Documentation and ADRs reflect the resulting behavior.
- No required service relies on an undocumented manual step.
- The PR can be reviewed, tested, and rolled back independently.
- `docs/roadmap/README.md` records the resulting status.

See [`docs/development/definition-of-done.md`](docs/development/definition-of-done.md) for the
full checklist.

## 9. Communication and Safety

- State assumptions and evidence; do not claim something works without running the relevant
  tests.
- For UI changes, verify both light and dark themes and desktop and narrow layouts.
- For launcher changes, click every affected card and verify the destination app loads.
- For multiplayer changes, test host, join, disconnect, reconnect, and authorization flows.
- Keep secrets out of source control. Commit `.env.example`, never real credentials.
- Stop and ask the human owner when a required decision is not documented and a wrong choice
  could cause data loss, security exposure, or broad architectural churn.
