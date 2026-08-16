export function platformServerPort(value = process.env.PLATFORM_SERVER_PORT || process.env.PORT): number {
  const port = Number(value || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PLATFORM_SERVER_PORT must be a valid TCP port.");
  return port;
}
