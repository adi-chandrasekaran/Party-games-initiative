# Testing Strategy

## Required Layers

### Static Checks

- Formatting verification.
- ESLint.
- Strict TypeScript type-checking.
- Production builds for affected packages.
- Portability checks for machine-specific paths and hardcoded local service endpoints.

### Unit Tests

Use unit tests for deterministic logic such as random selection boundaries, deck parsing,
sorting, permissions, timers, state transitions, and validation.

### Integration and Contract Tests

Cover API handlers, database repositories, Google token verification adapters, session logic,
Socket.IO events, room authorization, host changes, deck storage, and app manifests.

Tests must run against isolated disposable data. They must not modify developer or production
accounts.

### Playwright End-to-End Tests

Every user-facing roadmap PR must add or update Playwright coverage. Core journeys include:

- Sign in as AISC member and owner test identities.
- Navigate all rail and workspace sidebar destinations.
- Edit profile in place, scroll, change theme, and log out.
- Launch all six arcade games and four planner apps.
- Create/host/join multiplayer rooms and handle invalid usernames.
- Upload/select a deck and use it in compatible games.
- Use each planner workflow and verify persistence.
- Request club/class access and enforce member/host permissions.

### Visual Tests

Figma shell work requires Playwright screenshots for:

- Desktop dark and light themes.
- Narrow responsive layout.
- Forge Home, Profile, Arcade, Planner, Clubs, Classes, and Requests.
- Empty, loading, error, and populated states where visually distinct.

Visual snapshots must be reviewed intentionally. Do not blindly update snapshots to hide a
regression.

### Accessibility Tests

Verify keyboard navigation, visible focus, semantic names, color contrast, modal focus handling,
and reduced-motion behavior. Automated checks supplement rather than replace keyboard testing.

## Regression Rule

Every fixed bug receives a test that fails before the fix and passes after it. Launcher bugs must
be covered by actual browser clicks and destination assertions, not only unit tests.

## Test Evidence

PR descriptions must list exact commands and results. If any required suite is not run, state
why and keep the milestone incomplete unless the human owner explicitly accepts the risk.
