# Refactor Roadmap

This is the authoritative execution order. Only one milestone should be active unless the human
owner explicitly changes priority. Every milestone is implemented through a self-contained,
human-approved PR.

## Status Legend

- `Planned`: scoped but not started.
- `In progress`: active branch and implementation.
- `In review`: PR open; awaiting human review.
- `Complete`: merged by a human and acceptance evidence recorded.
- `Blocked`: documented dependency prevents progress.

## Local Refactor Phase

| ID | Milestone | Status | Required branch |
|---|---|---|---|
| PR-01 | Canonical repository and behavior baseline | Planned | `feat/pr-01-canonical-baseline` |
| PR-02 | Workspace foundation | Planned | `feat/pr-02-workspace-foundation` |
| PR-03 | Shared contracts and app registry | Planned | `feat/pr-03-app-registry` |
| PR-04 | Figma web shell and design system | Planned | `feat/pr-04-figma-shell` |
| PR-05 | Imposter and planner micro-app migration | Planned | `feat/pr-05-simple-microapps` |
| PR-06 | Quiz Shooter and Build A Beast client migration | Planned | `feat/pr-06-multiplayer-clients` |
| PR-07 | Modular TypeScript platform server | Planned | `feat/pr-07-platform-server` |
| PR-08 | PostgreSQL-backed persistence | Planned | `feat/pr-08-postgres-persistence` |
| PR-09 | Google authentication and authorization | Planned | `feat/pr-09-google-auth` |
| PR-10 | Consolidated realtime and resilient rooms | Planned | `feat/pr-10-realtime` |
| PR-11 | Shared deck storage and processing | Planned | `feat/pr-11-deck-pipeline` |
| PR-12 | Local quality gates and full regression suite | Planned | `feat/pr-12-quality-gates` |
| PR-13 | Legacy process and compatibility removal | Planned | `feat/pr-13-legacy-removal` |

## PR-01: Canonical Repository and Behavior Baseline

### Scope

- Establish a committed baseline in this canonical repository.
- Pin the exact Figma source revision and capture approved reference viewports in
  `docs/design/figma-reference.md`.
- Inventory current app routes, processes, user workflows, and known defects.
- Inventory machine-specific filesystem paths and hardcoded service endpoints as baseline
  portability defects.
- Add a root Playwright harness and smoke tests around the current shell and app launchers.
- Add root lint, test, and build commands without changing product behavior.
- Document exact current startup behavior and required local dependencies.

### Excluded

- No workspace migration.
- No shell redesign.
- No game refactor.
- No deployment configuration.

### Acceptance Criteria

- A fresh clone can install and start the existing application from documented commands.
- Playwright verifies the hub loads and records launcher behavior for all current apps.
- Known failures are represented as explicit skipped/expected-failure tests with linked issues,
  not silently ignored.
- Root quality commands have deterministic exit codes.
- All current files are tracked or intentionally ignored.

## PR-02: Workspace Foundation

Introduce `pnpm` workspaces, Turborepo, strict shared TypeScript configuration, and root task
orchestration without changing runtime behavior. Verify every existing app still builds and
launches.

**Acceptance gate:** A fresh install uses one lockfile; root lint, type-check, test, build, and
dev tasks address every package; runtime dependencies, including PDFJS, resolve through
workspace manifests without contributor-specific paths; Playwright smoke tests from PR-01
produce the same results.

**Rollback:** Revert workspace configuration and retain the legacy npm scripts. No product files
or data formats change in this PR.

## PR-03: Shared Contracts and App Registry

Add typed app manifests, same-origin route definitions, permissions, deck capabilities, shared
environment validation, and API/realtime schemas. Remove new reliance on launcher conditionals
and hardcoded URLs.

**Acceptance gate:** Registry validation rejects duplicate IDs/routes; contract tests cover each
manifest; Playwright proves every existing launcher resolves through the registry while legacy
destinations remain available.

**Rollback:** Revert the registry adapter and restore the prior launcher configuration. No app
implementation is removed.

## PR-04: Figma Web Shell and Design System

Port the approved Figma shell into `apps/web`; extract tokens and components; wire real product
data through adapters. Add light/dark, responsive, keyboard, and Playwright visual tests for
Forge Home, Profile, Arcade, Planner, Clubs, Classes, and Requests.

**Acceptance gate:** Approved Playwright screenshots pass for all seven shell destinations in
light and dark themes; keyboard navigation and persistent rail controls pass end-to-end; current
app launch behavior remains unchanged through adapters.

**Rollback:** A shell feature flag returns users to the legacy hub. Micro-app and backend code is
not migrated in this PR.

## PR-05: Imposter and Planner Micro-Apps

Move Imposter, Habit Tracker, To-do Board, Timer, and Assignments into lazy-loaded workspace
packages. Preserve their workflows and use same-origin routes through the registry.

**Acceptance gate:** Each package has unit coverage for its domain logic and Playwright coverage
for its primary workflow; all five open under the shell origin; no separate frontend port is
needed for them; legacy versions remain available behind a temporary fallback.

**Rollback:** Switch their registry entries back to the legacy launch adapter.

## PR-06: Multiplayer Client Micro-Apps

Move Quiz Shooter and Build A Beast clients into lazy-loaded workspace packages. Preserve
multiplayer behavior and eliminate their separate frontend ports.

**Acceptance gate:** Playwright launches both cards; two-browser tests host and join rooms;
integration tests cover invalid usernames, disconnect, reconnect, and deck selection; existing
gameplay contracts remain green.

**Rollback:** Switch both registry entries back to their legacy client URLs. Existing realtime
servers remain unchanged in this PR.

## PR-07: Platform Server

Replace the monolithic hub server with modular TypeScript API modules while preserving tested
contracts. Mount micro-app server plugins through explicit boundaries.

**Acceptance gate:** Old and new server contract suites return equivalent supported responses;
all authentication, profile, deck, statistics, chat, private-app, and launcher E2E flows pass;
one configuration selects the legacy server during rollback.

**Rollback:** Restore the legacy server entry point. Persistence formats remain unchanged until
PR-08.

## PR-08: PostgreSQL Persistence

Replace JSON files and account-related browser persistence with migrations, typed repositories,
and PostgreSQL. Include migration, rollback, concurrency, and data-integrity tests.

**Acceptance gate:** Migration tests preserve representative legacy records; repository
integration tests run against an isolated local database; concurrent-write tests pass; planner
and social data survive browser and server restarts in Playwright.

**Rollback:** Retain a read-only legacy export and documented down/restore procedure. Do not
delete source JSON until human verification is complete.

## PR-09: Google Authentication

Implement production-grade Google identity verification, AISC hosted-domain enforcement,
server-side sessions, role storage, CSRF protection, and rate limiting. Keep local test identity
fixtures isolated from production behavior.

**Acceptance gate:** Unit and integration tests verify signature/audience/issuer/expiry/domain
handling through an injectable verifier; Playwright covers member, owner, rejected-domain,
expired-session, and logout flows; no real credentials are required by automated tests.

**Rollback:** Authentication provider selection can return to the tested legacy adapter locally
without altering migrated user identities.

## PR-10: Consolidated Realtime

Move realtime games into authenticated platform-server namespaces. Add reconnect, host transfer,
room authorization, and multi-instance-ready state boundaries with integration tests.

**Acceptance gate:** Automated multi-client tests cover create, join, unauthorized access, host
disconnect, reconnect, transfer, and room cleanup for each game; a two-server local test proves
the shared state boundary.

**Rollback:** Registry/configuration can route realtime clients to the previous game servers until
the milestone is human-approved.

## PR-11: Deck Pipeline

Add shared deck metadata, PDF validation, storage abstraction, extraction jobs, compatibility
rules, and tests proving games consume structured deck content appropriately.

**Acceptance gate:** Integration tests cover accepted/rejected files, ownership, extraction,
game compatibility, and cleanup; Playwright uploads once and selects the same deck in every
compatible game; Imposter receives one hidden randomized word rather than the entire document.

**Rollback:** The storage interface supports the previous local implementation while retaining
new metadata. Destructive migration is excluded.

## PR-12: Local Quality Gates

Complete unit, integration, contract, realtime, accessibility, visual, and end-to-end suites.
Add CI definitions, but keep deployment implementation deferred. Establish performance baselines
for future production work.

**Acceptance gate:** One documented root command runs all local quality gates; CI executes the
same commands; flaky retries do not hide failures; local API and realtime baseline results are
recorded without provisioning production infrastructure.

**Rollback:** CI configuration can be reverted independently; no product runtime changes belong
in this PR.

## PR-13: Legacy Removal

Remove compatibility launchers, hardcoded ports, duplicated CSS, JSON stores, and obsolete app
copies only after all replacement paths pass regression tests.

**Acceptance gate:** Repository search and automated tests prove no launcher depends on legacy
frontend ports, no production-intended path writes JSON/browser-only account state, all ten
micro-apps pass Playwright, and the complete local exit gate below is satisfied.

**Rollback:** This PR is not merged until a tagged pre-removal commit and restoration procedure
are recorded. Reverting it restores compatibility code without reversing migrated data.

## Local Refactor Exit Gate

Deployment planning may begin only when:

- All ten micro-apps launch from one web origin.
- One platform server provides shared API and realtime behavior.
- Root lint, type-check, build, unit, integration, and Playwright suites pass.
- Figma shell visual baselines pass in light and dark themes.
- No production-intended data uses JSON-file or browser-only persistence.
- No launcher requires a separate frontend URL or hardcoded local port.
- No source, configuration, test, or documentation depends on a contributor-specific absolute
  filesystem path.
- Human reviewers have merged PR-01 through PR-13.

## Deferred Deployment Phase

After the local exit gate, create new roadmap milestones for hosting, managed PostgreSQL, Redis,
object storage, observability, backups, staged rollout, and concurrent-user load validation.
