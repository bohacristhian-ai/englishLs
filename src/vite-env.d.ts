/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Azure Speech key. Local development only — see .env.example. */
  readonly VITE_AZURE_SPEECH_KEY?: string;
  readonly VITE_AZURE_SPEECH_REGION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
