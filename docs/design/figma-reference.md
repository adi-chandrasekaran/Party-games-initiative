# Figma Visual Reference

## Canonical References

- Prototype: [Figma-published Forge prototype](https://camera-brown-39176227.figma.site/)
- Source repository:
  [adi-chandrasekaran/SidebarWithAIIntegration](https://github.com/adi-chandrasekaran/SidebarWithAIIntegration)

These URLs identify the design source without relying on a contributor's local filesystem.
A local clone is a convenience only and is never a canonical path.

## Revision Pinning

Roadmap PR-01 must record the exact source commit used for implementation in the table below.
PR-04 must not begin until a commit is pinned. This prevents the target from changing silently
during visual parity work.

| Reference | Value |
|---|---|
| Source commit | `TBD in PR-01` |
| Prototype capture date | `TBD in PR-01` |
| Approved viewport baselines | `TBD in PR-01` |

## What Is Canonical

The pinned reference controls:

- Shell layout and proportions.
- Outer rail and workspace sidebar.
- Typography, spacing, borders, card dimensions, and hierarchy.
- Profile, Arcade, Planner, Clubs, Classes, and Requests presentation.
- Light and dark theme behavior.

## What Is Not Canonical

Prototype mock data, placeholder authentication, sample counts, and nonfunctional game cards do
not replace product requirements or working game logic. Product behavior remains defined under
`docs/product/`.

## Implementation Evidence

PR-04 must include Playwright reference screenshots for approved viewports and themes. Store
repository-owned visual baselines with the test suite so future work does not depend on the
availability of a local clone or a mutable hosted prototype.
