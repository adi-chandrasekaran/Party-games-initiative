# Local Performance Baseline

PR-12 records a reproducible local quality baseline rather than a production performance claim.

- Platform HTTP health and Socket.IO are started by the Playwright web-server harness.
- The suite uses one Playwright worker and zero retries; failures are reported directly.
- Local timing varies by machine and is not a release SLO. Production load, latency, and capacity
  targets are deferred until the roadmap's local-refactor exit gate is met.
