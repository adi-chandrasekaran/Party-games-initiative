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
- PR-05 stages Imposter and the four planner tools into same-origin, lazy iframe adapters within
  the hub. Their standalone Vite frontends remain compatibility fallbacks; only Quiz Shooter and
  Build A Beast still require separate frontend ports pending PR-06.
- The hub's launcher metadata comes from the shared registry; legacy destination URLs are
  compatibility configuration until the same-origin migrations in PR-05 and PR-06.
- The hub resolves PDFJS through its workspace manifest; the platform API and legacy realtime
  services remain separate processes until later milestones.
- React and Vite versions differ between applications.
- Planner state is primarily browser-local.

## Backend

- The hub starts a custom Node HTTP server separately from the frontend.
- Accounts, sessions, chats, decks, statistics, and platform data use JSON-file persistence.
- Quiz Shooter and Build A Beast each run a separate Socket.IO server.
- Multiplayer room state is process-local, and socket IDs are used for important host state.
- Realtime CORS and authentication need hardening before production use.

## Testing

- PR-03 adds registry unit/contract/integration coverage and ordinary Playwright click coverage
  for all current launcher cards.
- There is no visual comparison against Figma yet; that belongs to PR-04.
- There is no CI gate or documented definition of done.
- The Quiz Shooter client build currently fails because `DeckEditor.tsx` has an implicitly typed
  `choice` parameter.
- The Build A Beast client build currently fails because `App.tsx` tests a `void` expression for
  truthiness.

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
