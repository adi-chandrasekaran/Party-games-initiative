import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import http from "node:http";
process.env.DATABASE_URL = "postgresql://forge:forge-local-password@127.0.0.1:5432/forge";
import { createHubApiServer } from "../../apps/hub/server.js";

async function request(server, pathname, options = {}) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const requestOptions = { hostname: "127.0.0.1", port: address.port, path: pathname, ...options };
    const clientRequest = http.request(requestOptions, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, payload: JSON.parse(Buffer.concat(chunks).toString("utf8")) }));
    });
    clientRequest.on("error", reject);
    clientRequest.end();
  });
}

test("platform compatibility server preserves supported health and unknown-route contracts", async () => {
  const server = createHubApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    assert.deepEqual(await request(server, "/health"), { status: 200, payload: { ok: true, database: "ready" } });
    assert.deepEqual(await request(server, "/api/health"), { status: 200, payload: { ok: true, database: "ready" } });
    assert.deepEqual(await request(server, "/api/not-a-route"), { status: 404, payload: { error: "Not found" } });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
