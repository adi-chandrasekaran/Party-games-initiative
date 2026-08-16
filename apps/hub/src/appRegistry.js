import { getAppManifest, listLauncherCards } from "@forge/app-registry";

const environment = import.meta.env;

export const ARCADE_APPS = Object.freeze(listLauncherCards("arcade", environment));
export const PLANNER_APPS = Object.freeze(listLauncherCards("planner", environment));

export function getHubAppManifest(id) { return getAppManifest(id); }
