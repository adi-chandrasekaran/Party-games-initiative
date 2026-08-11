# ADR-0003: Figma Prototype as Visual Source of Truth

- Status: Accepted
- Date: 2026-08-11

## Context

The current hub contains several conflicting visual systems. A Figma-generated prototype and
its cloned source represent the approved shell design.

## Decision

Use the pinned prototype revision documented in
[`docs/design/figma-reference.md`](../../design/figma-reference.md) as the canonical visual
reference for the shell, profile, navigation, typography, spacing, themes, and cards. Extract
its visual language into shared design tokens and UI components inside this repository.

Retain product data, authorization, persistence, and game behavior from the canonical product
repository rather than adopting prototype mocks.

## Consequences

- Shell changes require Playwright visual evidence against approved reference states.
- Local clone locations are irrelevant and must never be embedded in source or documentation.
- Legacy CSS overrides are removed as pages migrate.
- Product behavior is not sacrificed for visual parity.
