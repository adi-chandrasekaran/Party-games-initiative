import test from "node:test";
import assert from "node:assert/strict";
import { createGoogleVerifier } from "../../apps/hub/google-verifier.js";

const clientId = "forge-test-client";
const valid = { sub: "subject", email: "member@aischennai.org", email_verified: true, iss: "https://accounts.google.com", aud: clientId, exp: Math.floor(Date.now() / 1000) + 60, hd: "aischennai.org", name: "Member" };

function verifier(payload) { return createGoogleVerifier({ clientId, verifyIdToken: async () => payload }); }

test("Google verifier accepts a verified AISC identity", async () => {
  assert.equal((await verifier(valid)("token")).email, valid.email);
});

for (const [name, payload, message] of [
  ["expired", { ...valid, exp: Math.floor(Date.now() / 1000) - 1 }, /expired/],
  ["wrong audience", { ...valid, aud: "other" }, /different client/],
  ["wrong issuer", { ...valid, iss: "https://issuer.example" }, /invalid issuer/],
  ["non-AISC", { ...valid, email: "member@example.com" }, /aischennai/],
  ["unmanaged AISC domain", { ...valid, hd: "example.com" }, /managed by AISC/],
]) test(`Google verifier rejects ${name} credentials`, async () => {
  await assert.rejects(verifier(payload)("token"), message);
});
