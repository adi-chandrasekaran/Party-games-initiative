/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QUIZ_SHOOTER_SERVER_URL?: string;
  readonly VITE_PLATFORM_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
