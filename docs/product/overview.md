# Product Overview

## Product

**The Forge** is an AISC-only platform for student-built learning games, personal planning
tools, shared study decks, social collaboration, and request-based club and class apps.

## Audience

- AISC students and staff with verified `@aischennai.org` Google accounts.
- The product owner, initially `caditi28@aischennai.org`.
- Club leaders and teachers who need private, request-based apps.

## Product Areas

- **Forge Home:** product introduction, feature explanations, and updates.
- **Profile:** account identity, editable profile details, theme, and logout.
- **Arcade:** public learning games and their workspace utilities.
- **Planner:** personal productivity micro-apps and their workspace utilities.
- **Clubs:** request-to-join club spaces containing private apps.
- **Classes:** request-to-join classroom spaces containing private apps.
- **Requests:** a clear path for requesting new apps from the owner.

## Product Principles

- AISC access is verified, not simulated.
- Public games are hostable by any authenticated member.
- Private apps enforce host and membership permissions server-side.
- Games are real working micro-apps, never decorative cards or placeholders.
- A shared shell supplies identity, navigation, theme, decks, chat, and statistics.
- New games and tools should be registerable without redesigning the platform.
- The Figma prototype is the canonical visual direction for the shell.
- Local correctness and automated testing come before deployment work.

## Non-Goals During the Refactor

- Production deployment or cloud-provider selection.
- Premature service decomposition into independently deployed microservices.
- Module Federation or independent frontend deployment pipelines.
- New product features not required to preserve existing behavior or complete a roadmap item.
