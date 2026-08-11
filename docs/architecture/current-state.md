# Current Architecture Audit

Status: **Legacy system to be incrementally migrated**

## Repository State

- The repository currently has no baseline commit; project files are untracked on `main`.
- Similar Party Games directories have existed outside this repository, creating a risk that
  the wrong copy is edited or launched.
- The root package is not a true workspace. It manually installs and starts child projects.

## Frontend

- The hub is a large React/Vite application with a monolithic `App.jsx` and a large stylesheet
  containing overlapping generations of design rules.
- Each arcade and planner frontend starts its own Vite process and browser port.
- Launch routes and back links contain hardcoded local URLs.
- The hub server resolves PDFJS through a contributor-specific absolute path outside the
  repository.
- React and Vite versions differ between applications.
- Planner state is primarily browser-local.

## Backend

- The hub starts a custom Node HTTP server separately from the frontend.
- Accounts, sessions, chats, decks, statistics, and platform data use JSON-file persistence.
- Quiz Shooter and Build A Beast each run a separate Socket.IO server.
- Multiplayer room state is process-local, and socket IDs are used for important host state.
- Realtime CORS and authentication need hardening before production use.

## Testing

- There is no root lint, type-check, unit, integration, or Playwright test harness.
- There is no automated launcher regression test or visual comparison against Figma.
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

Until roadmap PR-02 replaces the startup architecture, contributors must launch and edit only
this repository and verify `pwd` and `git rev-parse --show-toplevel` before working.
