# PR-01 Baseline Defects

This register records observed legacy failures without changing their implementation. Each entry
is verified by `pnpm run type-check` and `pnpm run build`; an unexpected pass fails that check so
the entry must be deliberately updated or removed in the PR that fixes it.

## BD-001: Quiz Shooter client build

- **Status:** Expected failure
- **Command:** `pnpm --filter quiz-shooter-3d-client run build`
- **Observed failure:** `DeckEditor.tsx` leaves the `choice` callback parameter implicitly typed.
- **Scope:** PR-01 records the defect only. A later focused fix must add a regression test and
  remove this expected-failure assertion.

## BD-002: Build A Beast client build

- **Status:** Expected failure
- **Command:** `pnpm --filter build-a-beast-client run build`
- **Observed failure:** `App.tsx` tests a `void` expression for truthiness.
- **Scope:** PR-01 records the defect only. A later focused fix must add a regression test and
  remove this expected-failure assertion.

## BD-003: External launcher click navigation

- **Status:** Resolved by PR-03
- **Command:** `pnpm run test:e2e`
- **Regression coverage:** Playwright clicks all seven registry-backed external cards and asserts
  the documented compatibility target. Manual steps are in
  [`../development/manual-testing.md`](../development/manual-testing.md).
