# ADR-0004: Complete Local Refactor Before Deployment Work

- Status: Accepted
- Date: 2026-08-11

## Context

The application needs production scalability, but its local architecture, tests, and package
boundaries are not yet stable.

## Decision

Prioritize a fully functional, automated, locally testable monorepo before selecting or adding
production deployment infrastructure. Production architecture requirements remain documented,
but deployment implementation is deferred until the local exit gate is met.

## Consequences

- Current roadmap PRs optimize for reproducible local development and behavior preservation.
- Cloud configuration must not distract from package, data, auth, and test foundations.
- Deployment becomes a later roadmap phase with its own ADRs and review.
