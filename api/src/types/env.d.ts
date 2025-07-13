declare namespace NodeJS {
  interface ProcessEnv {
    CLIENT_URL: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    CLOUDINARY_CLOUD_NAME: string;
    IPINFO_TOKEN: string;
    JWT_SECRET: string;
    REFRESH_SECRET: string;
    MODE: "development" | "production";
    MONGODB_URI: string;
    OPENROUTER_API_URL: string;
    PORT: string;
    REDIS_URL: string;
    WHATSAPP_TOKEN: string;
    PHONE_NUMBER_ID: string;
  }
}
