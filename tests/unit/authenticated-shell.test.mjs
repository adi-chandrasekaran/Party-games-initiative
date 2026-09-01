import assert from "node:assert/strict";
import test from "node:test";

import { shouldEnableFigmaShell } from "../../apps/hub/src/authenticated-shell.js";

test("authenticated users receive the Figma shell without local-preview query access", () => {
  assert.equal(shouldEnableFigmaShell({
    isAuthenticated: true,
    localPreviewEnabled: false,
    localPreviewRequested: false,
  }), true);
});

test("unauthenticated sessions cannot enable the Figma shell with a query alone", () => {
  assert.equal(shouldEnableFigmaShell({
    isAuthenticated: false,
    localPreviewEnabled: false,
    localPreviewRequested: true,
  }), false);
});

test("explicit local preview remains available when its build flag is enabled", () => {
  assert.equal(shouldEnableFigmaShell({
    isAuthenticated: false,
    localPreviewEnabled: true,
    localPreviewRequested: true,
  }), true);
});
