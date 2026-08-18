# Feature Catalog

This catalog describes behavior that must be preserved through the refactor. Detailed feature
specifications can be added as separate files under `docs/product/` when a roadmap milestone
touches an area.

## Authentication and Roles

- Sign in uses Supabase-managed Google authorization for verified `@aischennai.org` accounts.
- Supabase is the identity authority; the Forge exchanges a verified Supabase session for its
  HttpOnly compatibility session at the platform boundary.
- The only platform roles are `admin`, `teacher`, and `student`. New AISC identities start as
  students; `caditi28@aischennai.org` is the bootstrap admin.
- Admins manage roles, game visibility, and host assignments. Teachers may host only their
  assigned private apps; students retain personal features and authenticated public-game access.
- Authentication and authorization decisions must be enforced by the server.
- The profile provides logout and editable user-facing fields allowed by the design.

## Forge Home

- The `F` rail item opens a scrollable Forge home page.
- The page introduces The Forge and explains the six primary tabs with cards.
- An updates area initially displays `updates will appear here!` until real updates exist.

## Arcade

The arcade contains six functioning games:

1. Imposter
2. Quiz Shooter
3. Build A Beast
4. Flashcards
5. Quiz Bowl
6. Word Match

Arcade workspace utilities include statistics, chats, and decks. Public games can be hosted or
joined by any authenticated AISC member using their existing Forge identity.

### Imposter

- Supports manual secret words.
- Supports randomized words from language/topic presets.
- Supports easy, medium, and hard difficulty presets where content exists.
- Supports selecting an already uploaded deck without re-uploading it.
- Selects one hidden random word from a chosen deck for a game.
- Preserves the chosen deck when returning to setup as required by the game flow.

### Quiz Shooter and Build A Beast

- Launch from the Arcade shell and retain existing multiplayer behavior.
- Accept compatible selected decks from the shared deck library.
- Public hosting is not restricted to assigned private-app hosts.

### Flashcards, Quiz Bowl, and Word Match

- Remain functioning games rather than placeholder or coming-soon cards.
- Use the shared deck model where their game format is compatible.

## Planner

The planner contains four functioning personal micro-apps:

1. Habit Tracker
2. To-do Board
3. Timer
4. Assignments

Planner workspace utilities include statistics, chats, and decks.

### Habit Tracker

- Provides all twelve month tabs.
- Allows any number of habits per month.
- Shows the correct number of daily checkboxes for the selected month.
- Saves completion state per signed-in user.

### To-do Board

- Provides user-created category tabs such as School or Work.
- Uses To Do, In Progress, and Finished lanes.
- Allows manual task movement between lanes.
- Supports deadlines selected from a calendar and task notes.

### Timer

- Offers 5, 25, 30, 45, 60, and 120 minute presets.
- Opens a selected timer and allows returning to the preset page.
- Supports start, pause, reset, and completion behavior.

### Assignments

- Uses Subject, Assignment, Due Date, Notes, and Teacher in Charge columns.
- Allows completion toggles.
- Orders incomplete assignments by nearest due date.
- Supports multiple user-created tabs.

## Decks

- Authenticated users can name and upload PDF decks.
- Uploaded decks are associated with the user and available from both workspaces.
- Compatible games select existing decks through the shared deck library.
- Games consume structured material appropriate to their format rather than displaying an
  entire PDF as one prompt.

## Statistics, Chats, and Social Spaces

- Statistics include recent and most-played activity and platform-wide popularity where
  applicable.
- Chats support AISC user search, direct conversations, and groups.
- Empty states use truthful messages rather than invented users or conversations.
- Clubs and Classes are visible directories with request-based access.
- A club or class may contain multiple private apps with hosts and members.
- Join requests and host-only actions are permission controlled.

## Requests and Owner Tools

- Requests direct app ideas to `caditi28@aischennai.org`.
- Owner controls distinguish creation of public and private app requests.
- Creating the actual app remains a reviewed development change, not arbitrary runtime code
  generation.

## Design and Accessibility

- Shell styling follows the pinned Figma prototype documented in
  [`docs/design/figma-reference.md`](../design/figma-reference.md).
- Light and dark modes maintain readable semantic colors.
- Primary pages scroll when content exceeds the viewport.
- Navigation, theme control, and profile control remain accessible across all shell tabs.
- Interactive cards are keyboard accessible and have reliable click targets.
