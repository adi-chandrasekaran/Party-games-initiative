# PR-01 Baseline Defects

This register records observed legacy failures without changing their implementation. Each entry
is verified by `npm run type-check` and `npm run build`; an unexpected pass fails that check so
the entry must be deliberately updated or removed in the PR that fixes it.

## BD-001: Quiz Shooter client build

- **Status:** Expected failure
- **Command:** `npm run build --prefix apps/quiz-shooter/client`
- **Observed failure:** `DeckEditor.tsx` leaves the `choice` callback parameter implicitly typed.
- **Scope:** PR-01 records the defect only. A later focused fix must add a regression test and
  remove this expected-failure assertion.

## BD-002: Build A Beast client build

- **Status:** Expected failure
- **Command:** `npm run build --prefix apps/build-a-beast/client`
- **Observed failure:** `App.tsx` tests a `void` expression for truthiness.
- **Scope:** PR-01 records the defect only. A later focused fix must add a regression test and
  remove this expected-failure assertion.

## BD-003: External launcher click navigation

- **Status:** Expected failure
- **Command:** `npm run test:e2e`
- **Observed failure:** A Playwright user click activates the external arcade and planner cards but
  leaves the shell at `http://localhost:5176` instead of assigning the documented legacy URL.
- **Scope:** PR-01 records all seven affected launchers as expected-failure smoke tests. The
  external card click path must be fixed in a later focused PR with an ordinary passing regression
  test; PR-01 does not change launcher behavior.
