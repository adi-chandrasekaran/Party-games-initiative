# The Forge Documentation

This directory is the durable project memory. New contributors should be able to understand
the product, architecture, roadmap, and development workflow without previous chat history.

## Start Here

1. [`../AGENTS.md`](../AGENTS.md) - mandatory contributor constitution.
2. [`product/overview.md`](product/overview.md) - product purpose and audience.
3. [`product/feature-catalog.md`](product/feature-catalog.md) - expected product behavior.
4. [`design/figma-reference.md`](design/figma-reference.md) - pinned visual reference policy.
5. [`architecture/current-state.md`](architecture/current-state.md) - known technical debt.
6. [`architecture/target-architecture.md`](architecture/target-architecture.md) - intended
   monorepo and runtime design.
7. [`roadmap/README.md`](roadmap/README.md) - sequenced, testable refactor milestones.
8. [`development/local-development.md`](development/local-development.md) - current local
   startup instructions and target developer experience.
9. [`development/workflow.md`](development/workflow.md) - branches, commits, and PRs.
10. [`development/testing.md`](development/testing.md) - required test strategy.
11. [`development/definition-of-done.md`](development/definition-of-done.md) - milestone gate.

## Structure

```text
docs/
|-- product/                 Product requirements and feature behavior
|-- design/                  Visual references and parity rules
|-- architecture/            Current state, target state, and ADRs
|   `-- decisions/           Immutable architectural decision records
|-- roadmap/                 Sequenced PR milestones and status
`-- development/             Local workflow, testing, and completion rules
```

## Documentation Rules

- Update product documentation in the same PR as behavior changes.
- Add an ADR before making a significant architectural choice.
- Update milestone status and evidence in the same PR that completes a roadmap item.
- Do not rewrite accepted ADR history. Add a superseding ADR instead.
- Keep deployment planning out of active scope until local-refactor exit criteria are met.
