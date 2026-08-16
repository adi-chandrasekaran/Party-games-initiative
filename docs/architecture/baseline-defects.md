# PR-01 Baseline Defects

This register records baseline defects and the PR that resolved each one. The complete platform
quality gate is `pnpm run quality`.

## BD-001: Quiz Shooter client type-check failure

- **Status:** Resolved by PR-13.
- **Resolution:** The deck editor now types its answer choices before finding a selected item.
- **Regression coverage:** `pnpm run type-check` compiles every application package.

## BD-002: Build A Beast client type-check failure

- **Status:** Resolved by PR-13.
- **Resolution:** The lobby renders the authenticated player's name instead of a void expression.
- **Regression coverage:** `pnpm run type-check` compiles every application package.

## BD-003: External launcher click navigation

- **Status:** Resolved by PR-03
- **Command:** `pnpm run test:e2e`
- **Regression coverage:** Playwright clicks every registry-backed launcher and asserts its
  same-origin destination. Manual steps are in
  [`../development/manual-testing.md`](../development/manual-testing.md).

## BD-004: Build A Beast shared-deck handoff

- **Status:** Resolved by PR-11.
- **Regression coverage:** the multiplayer integration and Playwright suites verify host deck
  handoff through the shared room state.
