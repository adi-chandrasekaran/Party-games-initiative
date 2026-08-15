# Manual Verification

## PR-03 Registry-backed launchers

This is the manual equivalent of the PR-03 Playwright launcher test.

1. Start all compatibility processes from the repository root with `pnpm dev`.
2. Open `http://localhost:5176`, create a disposable local account, and select **Arcade**.
3. Click **Imposter**, **Quiz Shooter**, and **Build A Beast** one at a time. Each must navigate
   to its existing legacy URL.
4. Return to the hub, select **Planner**, and click **Habit Tracker**, **To-do Board**, **Timer**,
   and **Assignments**. Each must navigate to its existing legacy URL.
5. Return to **Arcade** and click **Flashcards**, **Quiz Bowl**, and **Word Match**. Each must
   remain in the hub and show a **Back to Arcade** button.
6. Stop the processes with `Ctrl+C`.

Expected result: every card is driven by the app registry. The seven external apps remain on their
legacy ports in this PR; same-origin app loading is intentionally deferred to PR-05 and PR-06.

## PR-04 Figma shell

This is the manual equivalent of the PR-04 Playwright visual and keyboard tests. It verifies the
existing hub through the shared shell tokens; it does not migrate any launcher destination.

1. From the repository root, run `pnpm dev` and open `http://localhost:5176`.
2. Create a disposable local account, then use the left rail to open **Forge home**, **Profile**,
   **Arcade**, **Planner**, **Clubs**, **Classes**, and **Requests**. On a normal desktop window,
   each destination should remain readable, with the rail visible and the destination content
   scrollable.
3. Select the rail's theme button (sun/moon icon). Repeat the seven destinations in light theme.
   Text, cards, borders, and selected navigation states must remain distinguishable in both
   themes.
4. In browser responsive mode, set the viewport to `390 × 844`. Repeat the seven destinations in
   dark and light themes. The rail may reflow horizontally, but must remain reachable without
   clipping the selected destination.
5. Refresh in dark theme. Press `Tab` until the **Planner** rail button is focused, press
   `Enter`, and confirm the **PLANNER** heading appears. Continue tabbing to the theme control,
   press `Enter`, and confirm the theme changes. The focused control must remain visibly
   indicated.
6. Select **Arcade** and **Planner** once more. Follow the PR-03 launcher checklist above to
   confirm that no card destination changed.
7. Stop the local processes with `Ctrl+C`.

Expected result: all seven shell destinations work in both themes and viewport sizes; rail
controls work by keyboard; legacy game and planner launch behavior is unchanged.

## PR-05 same-origin simple micro-apps

This is the manual equivalent of the PR-05 Playwright coverage. Start the workspace with
`pnpm dev`, open `http://localhost:5176`, and create a disposable local account.

1. Open **Arcade**, select **Imposter**, and confirm the address stays on `localhost:5176` at
   `/arcade/imposter`. Enter a manual secret word and select **Next**; the player-entry screen
   must appear.
2. Open **Planner**. For **Habit Tracker**, add a habit. For **To-do Board**, add a task. For
   **Timer**, select a preset. For **Assignments**, add a row with a subject and assignment.
   Each address must remain on `localhost:5176` under its `/planner/...` route.
3. In each embedded app, use **Back to Arcade/Planner** in the shell toolbar. Confirm the
   corresponding launcher grid reappears.
4. Select **Open legacy fallback** in one migrated app only. Confirm its existing standalone URL
   still opens, then return to the hub.
5. At the PR-05 milestone, **Quiz Shooter** and **Build A Beast** were intentionally left on their
   legacy URLs. Their migration is verified by the PR-06 checklist below.

Expected result at the PR-05 milestone: the five migrated apps run through the shell origin with
their existing primary workflows, their standalone versions remain available as fallbacks, and
only the two multiplayer clients retain separate frontend ports.

## PR-06 same-origin multiplayer clients

This is the manual equivalent of the PR-06 Playwright and Socket.IO contract coverage. Start the
workspace with `pnpm dev`, then open `http://localhost:5176` in two separate browser windows (or
one normal and one private window). Create a disposable local account in each window.

1. In the first window, open **Arcade** and select **Quiz Shooter**. Confirm the address is
   `http://localhost:5176/arcade/quiz-shooter`, the game is displayed inside the shell, and the
   shell toolbar offers **Back to Arcade** and **Open legacy fallback**. Enter a username and
   choose **Host Game**. Copy the displayed room code.
2. In the second window, open **Arcade** and select **Quiz Shooter**. Enter a different username,
   paste the room code, and choose **Join as Player**. Confirm **Waiting for Host** appears.
   Refresh that window, reopen Quiz Shooter, and join with the same room code again; the lobby
   must accept the fresh connection. Back in the first window, use the deck editor to change the
   question deck before starting a round.
3. Repeat the two-window flow for **Build A Beast** at
   `http://localhost:5176/arcade/build-a-beast`: host a room, copy the room code, join it from the
   other window, and confirm **Waiting for host...** appears. Refresh and reopen the player game,
   then join the same lobby again.
4. In either game, select **Host Game** with a blank AISC username. Confirm the app presents an
   error and does not create a room. Use **Back to Arcade** to return to the launcher grid. The
   **Open legacy fallback** link must retain the configured standalone URL; the legacy client is
   not started by the standard `pnpm dev` command.
5. Stop local processes with `Ctrl+C`.

Expected result: both clients load from the hub origin and support host/join/disconnect/fresh-join
flows while their existing Socket.IO servers remain unchanged. Quiz Shooter applies a host-selected
question deck. Build A Beast's visible shared-deck selector is a recorded legacy limitation: its
server does not yet apply a selected deck, which is deferred to PR-11.
