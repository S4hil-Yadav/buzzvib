declare namespace NodeJS {
  interface ProcessEnv
    extends Readonly<{
      DB_PREFIX: string;
      CLIENT_URL: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      CLOUDINARY_CLOUD_NAME: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_REDIRECT_URI: string;
      IPINFO_TOKEN: string;
      JWT_SECRET: string;
      REFRESH_SECRET: string;
      MODE: "development" | "production";
      MONGODB_URI: string;
      PORT: string;
      REDIS_URL: string;
      SMTP_FROM: string;
      SMTP_USER: string;
      SMTP_PASS: string;
    }> {}
}
