import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseTokenVerifier } from "../../apps/hub/supabase-auth.js";

test("Supabase verifier fails closed when production configuration is absent", async () => {
  const verify = createSupabaseTokenVerifier({ url: "", publishableKey: "" });
  await assert.rejects(() => verify("access-token"), /not configured/);
});
