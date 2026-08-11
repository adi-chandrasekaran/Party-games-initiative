/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_A_BEAST_SERVER_URL?: string;
  readonly VITE_PLATFORM_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
