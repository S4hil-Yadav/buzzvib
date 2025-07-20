/// <reference types="vite/client" />

type ImportMetaEnv = Readonly<{
  VITE_API_URL: string;
  VITE_CLIENT_URL: string;
  VITE_GOOGLE_CLIENT_ID: string;
}>;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
