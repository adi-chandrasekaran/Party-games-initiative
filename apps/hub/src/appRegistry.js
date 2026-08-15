import { getAppManifest, listLauncherCards, resolveLegacyLaunch } from "@forge/app-registry";

const environment = import.meta.env;

export const ARCADE_APPS = Object.freeze(listLauncherCards("arcade", environment));
export const PLANNER_APPS = Object.freeze(listLauncherCards("planner", environment));

export function getHubAppManifest(id) {
  const manifest = getAppManifest(id);
  return manifest ? { ...manifest, legacyUrl: manifest.launchMode === "embedded" ? null : resolveLegacyLaunch(manifest, environment) } : null;
}

export function resolveHubLaunch(app) {
  return app.launchMode === "legacy-external" ? resolveLegacyLaunch(app, environment) : null;
}
