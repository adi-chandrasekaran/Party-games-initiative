import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import http from "node:http";

process.env.DATABASE_URL = "postgresql://forge:forge-local-password@127.0.0.1:5432/forge";
process.env.GOOGLE_CLIENT_ID = "fixture-client";
const { createHubApiServer, setGoogleVerifierForTests, setSessionTtlForTests, setSupabaseVerifierForTests, resetAuthRateLimitForTests } = await import("../../apps/hub/server.js");

function request(server, path, body, headers = {}) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: "127.0.0.1", port, path, method: "POST", headers: { "Content-Type": "application/json", ...headers } }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, payload: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    request.on("error", reject); request.end(JSON.stringify(body));
  });
}

function get(server, path, headers = {}) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: "127.0.0.1", port, path, method: "GET", headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, payload: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    request.on("error", reject); request.end();
  });
}

test("Google auth creates a server session for a verified member fixture", async () => {
  setSessionTtlForTests(8 * 60 * 60 * 1000);
  setGoogleVerifierForTests(async () => ({ email: "member@aischennai.org", name: "Member", picture: "", googleSub: "fixture-sub" }));
  const server = createHubApiServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await request(server, "/api/auth/google", { credential: "fixture", role: "member" });
    assert.equal(response.status, 200); assert.equal(response.payload.user.email, "member@aischennai.org");
    assert.match(String(response.headers["set-cookie"]), /HttpOnly/);
    const localPassword = await request(server, "/api/login", { email: "member@aischennai.org", password: "not-a-local-password" });
    assert.equal(localPassword.status, 401);
    assert.match(localPassword.payload.error, /Forgot password/);
    const cookie = String(response.headers["set-cookie"]).split(";")[0];
    const logout = await request(server, "/api/logout", {}, { Cookie: cookie });
    assert.equal(logout.status, 200);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test("Google auth rejects an expired server session", async () => {
  setGoogleVerifierForTests(async () => ({ email: "expired-session@aischennai.org", name: "Expired", picture: "", googleSub: "expired-session" }));
  setSessionTtlForTests(0);
  const server = createHubApiServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await request(server, "/api/auth/google", { credential: "fixture" });
    const cookie = String(response.headers["set-cookie"]).split(";")[0];
    const bootstrap = await get(server, "/api/bootstrap", { Cookie: cookie });
    assert.equal(bootstrap.status, 200); assert.equal(bootstrap.payload.user, null);
  } finally { setSessionTtlForTests(8 * 60 * 60 * 1000); await new Promise((resolve) => server.close(resolve)); }
});

test("Google auth assigns the owner role only to the configured owner fixture", async () => {
  setGoogleVerifierForTests(async () => ({ email: "caditi28@aischennai.org", name: "Owner", picture: "", googleSub: "owner-fixture" }));
  const server = createHubApiServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await request(server, "/api/auth/google", { credential: "fixture", role: "owner" });
    assert.equal(response.status, 200); assert.equal(response.payload.user.role, "owner");
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test("Google auth rejects an invalid fixture and cross-origin mutation", async () => {
  setGoogleVerifierForTests(async () => { throw new Error("Google sign-in credential has expired."); });
  const server = createHubApiServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const rejected = await request(server, "/api/auth/google", { credential: "expired" });
    assert.equal(rejected.status, 401);
    const crossOrigin = await request(server, "/api/auth/google", { credential: "fixture" }, { Origin: "https://attacker.example" });
    assert.equal(crossOrigin.status, 403);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test("Google auth rate-limits repeated credential attempts", async () => {
  setGoogleVerifierForTests(async () => { throw new Error("Google sign-in credential has expired."); });
  const server = createHubApiServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      assert.equal((await request(server, "/api/auth/google", { credential: `attempt-${attempt}` })).status, 401);
    }
    const limited = await request(server, "/api/auth/google", { credential: "limited" });
    assert.equal(limited.status, 429); assert.match(String(limited.headers["retry-after"]), /^\d+$/);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test("Supabase Google identity creates a stable Forge session without a role supplied by the browser", async () => {
  resetAuthRateLimitForTests();
  setSupabaseVerifierForTests(async (token) => {
    assert.equal(token, "supabase-fixture-token");
    return { id: "b5c36e72-1e09-4cef-8a91-e2c65c9bc728", email: "supabase-member@aischennai.org", name: "Supabase Member", picture: "" };
  });
  const server = createHubApiServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const first = await request(server, "/api/auth/supabase", { accessToken: "supabase-fixture-token", role: "owner" });
    assert.equal(first.status, 200); assert.equal(first.payload.user.email, "supabase-member@aischennai.org");
    assert.equal(first.payload.user.role, "member");
    const second = await request(server, "/api/auth/supabase", { accessToken: "supabase-fixture-token" });
    assert.equal(second.status, 200); assert.equal(second.payload.user.id, first.payload.user.id);
  } finally {
    setSupabaseVerifierForTests();
    await new Promise((resolve) => server.close(resolve));
  }
});
