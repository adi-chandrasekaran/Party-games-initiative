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
