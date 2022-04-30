declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      SESSION_SECRET: string;
      SPOTIFY_CLIENT_ID: string;
      SPOTIFY_CLIENT_SECRET: string;
      SPOTIFY_CALLBACK_URL: string;
      YOUTUBE_API_KEY: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_CALLBACK_URL: string;
    }
  }
}

export {}
