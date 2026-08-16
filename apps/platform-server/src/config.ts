export type PlatformServerMode = "platform" | "legacy";

export function platformServerMode(value = process.env.PLATFORM_SERVER_MODE): PlatformServerMode {
  if (!value || value === "platform") return "platform";
  if (value === "legacy") return "legacy";
  throw new Error("PLATFORM_SERVER_MODE must be platform or legacy.");
}

export function platformServerPort(value = process.env.PLATFORM_SERVER_PORT || process.env.PORT): number {
  const port = Number(value || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PLATFORM_SERVER_PORT must be a valid TCP port.");
  return port;
}
