const PLATFORM_API_BASES = Array.from(
  new Set([import.meta.env.VITE_PLATFORM_API_URL || "http://localhost:8787", "http://localhost:8787"].filter(Boolean)),
);

export async function platformRequest(pathname, { method = "GET", body, code } = {}) {
  let lastError = null;

  for (const base of PLATFORM_API_BASES) {
    try {
      const response = await fetch(`${base}${pathname}`, {
        method,
        credentials: "include",
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(code ? { "x-owner-admin-code": code } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) return payload;

      const error = new Error(payload.error || "Request failed");
      error.status = response.status;
      lastError = error;

      if (response.status !== 404) {
        throw error;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Request failed");
}

export async function fetchPlatformGames() {
  const payload = await platformRequest("/api/platform/games");
  return payload.games || [];
}

export function platformGameUrl(game) {
  return game?.url || game?.route || "";
}
