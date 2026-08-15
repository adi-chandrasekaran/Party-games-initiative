# PR-01 Canonical Behavior Baseline

## Evidence

- Canonical worktree: `git rev-parse --show-toplevel` resolves to this repository.
- Baseline commit: `19b36582ecf33325e54b08e3ab8eaebedeaeaafa`
  (`chore: establish Party Games baseline`).
- Baseline check: `main` was clean before branch creation.
- Figma source revision: `4e57eb0ccf3e766c5b2dc2dee90c11bf70f5fe36`.

## Legacy Runtime Inventory

| Area | Current process / URL | Launcher behavior |
|---|---|---|
| Hub | Vite and Node server on `http://localhost:5176` | Shell loads from the root launcher. |
| Imposter | Vite on `http://localhost:5181` | Configured target; browser-click navigation is BD-003. |
| Quiz Shooter | Client/server legacy processes, launcher `http://localhost:5173` | Configured target; browser-click navigation is BD-003. |
| Build A Beast | Client/server legacy processes, launcher `http://localhost:5174` | Configured target; browser-click navigation is BD-003. |
| Habit Tracker | Vite on `http://localhost:5314` | Configured target; browser-click navigation is BD-003. |
| To-do Board | Vite on `http://localhost:5315` | Configured target; browser-click navigation is BD-003. |
| Timer | Vite on `http://localhost:5316` | Configured target; browser-click navigation is BD-003. |
| Assignments | Vite on `http://localhost:5317` | Configured target; browser-click navigation is BD-003. |

At the PR-01 baseline, the required local commands were `npm run install:all` and `npm run dev`.
PR-02 replaces that setup with the documented pinned pnpm workspace commands while preserving the
root launcher at `http://localhost:5176`. See [`../PORTS_AND_RUNNING.md`](../PORTS_AND_RUNNING.md)
for the complete port map and [`../development/local-development.md`](../development/local-development.md)
for prerequisites and constraints.

The Playwright harness starts the hub only and supplies `HUB_DATA_FILE` only during tests. This
retains the default legacy store path while ensuring smoke-test accounts and sessions use
disposable local state; the external launcher destinations are asserted without starting their
separate legacy processes.

## Portability Defects

- At the PR-01 baseline, the hub server resolved PDFJS through a contributor-specific absolute
  filesystem path.
- Launchers, navigation, and API clients contain hardcoded `localhost` endpoints.
- Legacy applications require separate frontend/browser ports.

These are baseline findings only. PR-02 removes the PDFJS path; later milestones own the remaining
findings.

## Reference Capture

On 2026-08-11, the pinned Figma-published prototype was captured at the following viewport
baselines for later PR-04 visual comparison:

| Viewport | Capture | Purpose |
|---|---|---|
| `1440 × 900` | Desktop | Shell proportions and card layout |
| `390 × 844` | Narrow | Responsive shell behavior |

## Known Failures

The active expected-failure checks are listed in
[`baseline-defects.md`](baseline-defects.md). They are intentionally not fixed in this milestone.
