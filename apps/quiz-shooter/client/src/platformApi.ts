const BASES = Array.from(new Set([(import.meta.env.VITE_PLATFORM_API_URL as string | undefined) || "http://localhost:8787", "http://localhost:8787"].filter(Boolean)));

export async function platformRequest(pathname: string, { method = "GET", body }: { method?: string; body?: unknown } = {}) {
  let lastError: unknown = null;

  for (const base of BASES) {
    try {
      const response = await fetch(`${base}${pathname}`, {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) return payload;
      const error = new Error(payload.error || "Request failed") as Error & { status?: number };
      error.status = response.status;
      lastError = error;
      if (response.status !== 404) throw error;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Request failed");
}
