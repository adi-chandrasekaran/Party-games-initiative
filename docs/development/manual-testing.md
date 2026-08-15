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
