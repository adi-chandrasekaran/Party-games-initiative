# ADR-0001: Canonical Repository

- Status: Accepted
- Date: 2026-08-11

## Context

Multiple Party Games directories have been edited and launched, causing valid changes to appear
missing or reverted.

## Decision

The Git repository containing this ADR is the canonical product repository. All roadmap work,
tests, documentation, branches, and PRs originate from its worktree.

The external Figma prototype repository documented in
[`docs/design/figma-reference.md`](../../design/figma-reference.md) is a design reference and
must not be launched as the product or used to replace working game logic.

## Consequences

- Contributors verify that `git rev-parse --show-toplevel` resolves to the worktree containing
  this ADR before editing or running commands.
- Duplicate repositories are not used for product development.
- Copying code into the canonical repository requires review and tests.
