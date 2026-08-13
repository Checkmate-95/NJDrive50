/// <reference types="vite/client" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENWEATHER_API_KEY?: string
      EXPO_PUBLIC_WEATHER_KEY?: string
    }
  }
}

export {}
