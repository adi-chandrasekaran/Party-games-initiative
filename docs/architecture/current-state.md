# Current Architecture Audit

Status: **Legacy system to be incrementally migrated**

## Repository State

- The canonical baseline is commit `19b36582ecf33325e54b08e3ab8eaebedeaeaafa`
  (`chore: establish Party Games baseline`); its repository files are tracked or intentionally
  ignored. PR-01 records the remaining behavior and portability baseline from this commit.
- Similar Party Games directories have existed outside this repository, creating a risk that
  the wrong copy is edited or launched.
- PR-02 establishes the pnpm/Turborepo workspace foundation for active app packages; historical
  `old-games/` copies remain outside that workspace until PR-13.
- PR-03 introduces shared app contracts and a registry. Canonical same-origin routes and legacy
  compatibility targets are defined once, while physical app migration remains deferred.

## Frontend

- The hub is a large React/Vite application with a monolithic `App.jsx` and a large stylesheet
  containing overlapping generations of design rules.
- PR-05 and PR-06 stage all seven standalone clients into same-origin, lazy iframe adapters
  within the hub. Their standalone Vite frontends remain compatibility fallbacks; Quiz Shooter
  and Build A Beast retain only their Socket.IO backend ports (4000 and 4100).
- The hub's launcher metadata comes from the shared registry; legacy destination URLs are
  compatibility configuration until the same-origin migrations in PR-05 and PR-06.
- The hub resolves PDFJS through its workspace manifest; the platform API and legacy realtime
  services remain separate processes until later milestones.
- React and Vite versions differ between applications.
- Planner state is primarily browser-local.

## Backend

- PR-07 runs the custom HTTP API through the `apps/platform-server` TypeScript lifecycle package;
  `apps/hub/server.js` remains the selectable legacy compatibility adapter until its route modules
  are migrated in later milestones.
- PR-08 moves accounts, sessions, chats, decks, statistics, and platform data to PostgreSQL through
  the compatibility store; the JSON adapter remains an explicit rollback path until PR-13.
- PR-09 verifies AISC Google identities server-side and provides expiring server sessions. PR-10
  applies that authenticated identity to the platform realtime namespaces.
- PR-11 is replacing the legacy deck text-only records with validated source metadata and structured
  study items, while retaining a compatibility view for current clients.

## Testing

- PR-03 adds registry unit/contract/integration coverage and PR-04/PR-05 extend Playwright
  coverage to shell visuals, same-origin launcher routes, and the five simple micro-app workflows.
- PR-04 maintains committed Figma shell screenshots at the approved desktop and narrow viewports
  in light and dark themes.
- PR-12 provides a single root quality command and a matching GitHub Actions gate with isolated
  PostgreSQL integration coverage and zero Playwright retries.
- The Quiz Shooter client build currently fails because `DeckEditor.tsx` has an implicitly typed
  `choice` parameter.
- The Build A Beast client build currently fails because `App.tsx` tests a `void` expression for
  truthiness.
- Build A Beast displays a shared-deck selector, but its legacy Socket.IO server does not retain
  or apply the submitted `studyDeckId`; PR-11 owns the shared deck pipeline needed to resolve it.

## Consequences

- Restarting a subset of processes can make launcher cards unreachable.
- Port conflicts can send a game card to another local project.
- A clean checkout can fail when a dependency is available only at another contributor's home
  directory path.
- Duplicate styles can make controls invisible or unclickable.
- Multiple backend instances cannot safely share JSON data or in-memory rooms.
- Changes can appear to revert when a different repository copy is launched.

## Immediate Guardrail

Contributors must launch and edit only this repository, verify `pwd` and
`git rev-parse --show-toplevel`, and register new product-facing apps through a manifest rather
than adding launcher conditions or local URLs to the hub.
