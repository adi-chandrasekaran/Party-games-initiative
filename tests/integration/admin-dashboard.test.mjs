import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import http from "node:http";

process.env.DATABASE_URL = "postgresql://forge:forge-local-password@127.0.0.1:5432/forge";
process.env.GOOGLE_CLIENT_ID = "fixture-client";
const { createHubApiServer, setGoogleVerifierForTests } = await import("../../apps/hub/server.js");

function request(server, path, { method = "GET", body, headers = {} } = {}) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, path, method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers } }, (res) => {
      const chunks = []; res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, payload: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    req.on("error", reject); req.end(body ? JSON.stringify(body) : undefined);
  });
}

test("only the configured owner can read the dashboard and persist planning items", async () => {
  setGoogleVerifierForTests(async (credential) => credential === "owner" ? { email: "caditi28@aischennai.org", name: "Caditi", picture: "", googleSub: "owner-dashboard" } : { email: "dashboard-student@aischennai.org", name: "Student", picture: "", googleSub: "student-dashboard" });
  const server = createHubApiServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const student = await request(server, "/api/auth/google", { method: "POST", body: { credential: "student" } });
    const studentCookie = String(student.headers["set-cookie"]).split(";")[0];
    assert.equal((await request(server, "/api/admin/dashboard", { headers: { Cookie: studentCookie } })).status, 403);

    const owner = await request(server, "/api/auth/google", { method: "POST", body: { credential: "owner" } });
    const ownerCookie = String(owner.headers["set-cookie"]).split(";")[0];
    const dashboard = await request(server, "/api/admin/dashboard", { headers: { Cookie: ownerCookie } });
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.payload.stats.ratings.length, 10);
    assert.equal(dashboard.payload.permissions.length, 6);

    const note = await request(server, "/api/admin/planning/notes", { method: "POST", body: { text: "Review feedback today" }, headers: { Cookie: ownerCookie } });
    assert.equal(note.status, 200);
    assert.ok(note.payload.planning.notes.some((entry) => entry.text === "Review feedback today"));

    const todo = await request(server, "/api/admin/planning/todos", { method: "POST", body: { text: "Publish the next build" }, headers: { Cookie: ownerCookie } });
    assert.equal(todo.status, 200);
    assert.ok(todo.payload.planning.todos.some((entry) => entry.text === "Publish the next build" && !entry.completed));
  } finally { setGoogleVerifierForTests(); await new Promise((resolve) => server.close(resolve)); }
});
