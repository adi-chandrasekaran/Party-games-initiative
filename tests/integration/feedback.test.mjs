import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import http from "node:http";

process.env.DATABASE_URL = "postgresql://forge:forge-local-password@127.0.0.1:5432/forge";
process.env.GOOGLE_CLIENT_ID = "fixture-client";
const { createHubApiServer, setGoogleVerifierForTests } = await import("../../apps/hub/server.js");
const { readPostgresStore } = await import("../../apps/hub/postgres-store.js");

function post(server, path, body, headers = {}) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: "127.0.0.1", port, path, method: "POST", headers: { "Content-Type": "application/json", ...headers } }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, payload: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    request.on("error", reject);
    request.end(JSON.stringify(body));
  });
}

test("feedback requires a session, validates its message, and persists recipient and author attribution", async () => {
  setGoogleVerifierForTests(async () => ({ email: "feedback-member@aischennai.org", name: "Feedback Member", picture: "", googleSub: "feedback-member" }));
  const server = createHubApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const anonymous = await post(server, "/api/feedback", { message: "Useful idea" });
    assert.equal(anonymous.status, 401);

    const login = await post(server, "/api/auth/google", { credential: "feedback-fixture" });
    const cookie = String(login.headers["set-cookie"]).split(";")[0];
    const invalid = await post(server, "/api/feedback", { message: "   " }, { Cookie: cookie });
    assert.equal(invalid.status, 400);

    const submitted = await post(server, "/api/feedback", { message: "  Please add a study mode.  " }, { Cookie: cookie });
    assert.equal(submitted.status, 201);
    assert.equal(submitted.payload.feedback.message, "Please add a study mode.");
    assert.equal(submitted.payload.feedback.recipientEmail, "caditi28@aischennai.org");
    assert.deepEqual(submitted.payload.feedback.submittedBy, {
      userId: login.payload.user.id,
      email: "feedback-member@aischennai.org",
      name: "Feedback Member",
    });

    const store = await readPostgresStore({});
    assert.ok(store.feedback.some((entry) => entry.id === submitted.payload.feedback.id));
  } finally {
    setGoogleVerifierForTests();
    await new Promise((resolve) => server.close(resolve));
  }
});
