const PLATFORM_API_BASES = [import.meta.env.VITE_PLATFORM_API_URL || window.location.origin];

export async function platformRequest(pathname, { method = "GET", body } = {}) {
  let lastError = null;

  for (const base of PLATFORM_API_BASES) {
    try {
      const response = await fetch(`${base}${pathname}`, {
        method,
        credentials: "include",
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
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
