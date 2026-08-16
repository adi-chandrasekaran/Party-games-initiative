export type ProductArea = "arcade" | "planner";
export type AccessPolicy = "authenticated-member" | "public-host";
export type DeckCapability = "none" | "optional" | "required";
export type LaunchMode = "same-origin" | "embedded";

export interface AppManifest {
  id: string;
  title: string;
  subtitle: string;
  area: ProductArea;
  canonicalRoute: string;
  launchMode: LaunchMode;
  access: AccessPolicy;
  deckCapability: DeckCapability;
  color: string;
  icon: string;
  packageName?: string;
  serverPackageName?: string;
  apiContracts: readonly string[];
  realtimeContract?: string;
  sameOriginEntry?: string;
}
