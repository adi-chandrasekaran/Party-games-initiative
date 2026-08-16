// The legacy implementation is intentionally JavaScript during the PR-07 strangler phase.
// Its public lifecycle is covered by the legacy/platform contract tests below.
// @ts-expect-error JavaScript compatibility adapter has no declaration file yet.
import { startHubApiServer } from "../../hub/server.js";
import { platformServerMode, platformServerPort } from "./config.js";

const mode = platformServerMode();
const port = platformServerPort();

if (mode !== "platform") {
  throw new Error("Use apps/hub's api:legacy script to run legacy server mode.");
}

await startHubApiServer({ port });
