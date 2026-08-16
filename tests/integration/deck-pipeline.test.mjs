import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import http from "node:http";

process.env.DATABASE_URL = "postgresql://forge:forge-local-password@127.0.0.1:5432/forge";
const { createHubApiServer } = await import("../../apps/hub/server.js");

function request(server, method, path, body, headers = {}) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, path, method, headers: { "Content-Type": "application/json", ...headers } }, (res) => {
      const chunks = []; res.on("data", (chunk) => chunks.push(chunk)); res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, payload: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    req.on("error", reject); req.end(body === undefined ? undefined : JSON.stringify(body));
  });
}

test("deck API validates uploads, exposes structured metadata, and enforces delete ownership", async () => {
  const server = createHubApiServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const suffix = `${process.pid}-${Date.now()}`;
    const ownerLogin = await request(server, "POST", "/api/signup", { name: "Deck owner", username: `deck-owner-${suffix}`, email: `deck-owner-${suffix}@aischennai.org`, password: "safe-test-password" });
    const ownerCookie = String(ownerLogin.headers["set-cookie"]).split(";")[0];
    const invalid = await request(server, "POST", "/api/decks", { title: "Invalid", fileName: "bad.pdf", dataUrl: "data:application/pdf;base64,bm90LXBkZg==" }, { Cookie: ownerCookie });
    assert.equal(invalid.status, 400);
    const upload = await request(server, "POST", "/api/decks", { title: "Science", fileName: "science.pdf", dataUrl: `data:application/pdf;base64,${Buffer.from("%PDF-1.7\nnot-a-complete-pdf").toString("base64")}` }, { Cookie: ownerCookie });
    assert.equal(upload.status, 201);
    assert.equal(upload.payload.deck.sourceDataUrl, undefined);
    const deckId = upload.payload.deck.id;
    const secondLogin = await request(server, "POST", "/api/signup", { name: "Deck second", username: `deck-second-${suffix}`, email: `deck-second-${suffix}@aischennai.org`, password: "safe-test-password" });
    const secondCookie = String(secondLogin.headers["set-cookie"]).split(";")[0];
    const forbidden = await request(server, "DELETE", `/api/decks/${deckId}`, undefined, { Cookie: secondCookie });
    assert.equal(forbidden.status, 403);
    const removed = await request(server, "DELETE", `/api/decks/${deckId}`, undefined, { Cookie: ownerCookie });
    assert.equal(removed.status, 200);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
