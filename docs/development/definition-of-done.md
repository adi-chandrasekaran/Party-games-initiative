# Definition of Done

A roadmap milestone is not complete until every applicable item is checked.

## Scope

- [ ] The implementation matches the active roadmap milestone.
- [ ] Excluded work was not pulled into the PR.
- [ ] Existing behavior outside the scope is preserved.
- [ ] No placeholder replaced a working feature.

## Architecture

- [ ] Package and service boundaries follow accepted ADRs.
- [ ] No new hardcoded local URLs or unexplained ports were added.
- [ ] No machine-specific absolute filesystem paths were added.
- [ ] No new shared production state is stored only in memory, JSON, or browser storage.
- [ ] Significant new decisions have an ADR.

## Quality

- [ ] Formatting passes.
- [ ] Lint passes.
- [ ] Type-check passes.
- [ ] Build passes.
- [ ] Unit tests pass.
- [ ] Integration and contract tests pass.
- [ ] Relevant Playwright tests pass.
- [ ] Bug fixes include regression tests.
- [ ] UI changes include reviewed visual evidence in light and dark themes.

## Documentation

- [ ] Product behavior documentation is current.
- [ ] Local development instructions are current.
- [ ] Roadmap status and evidence are current.
- [ ] Migration and rollback instructions are documented when applicable.

## Review

- [ ] Commits use Conventional Commits.
- [ ] The PR template is complete.
- [ ] The PR is self-contained and independently testable.
- [ ] A human has reviewed and approved the PR.
- [ ] A human performs the merge.
