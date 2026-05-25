import type { CapacitorConfig } from "@capacitor/cli";

const appEnv = process.env.CAP_BUILD_TARGET ?? process.env.NODE_ENV ?? "development";
const isProduction = appEnv === "production";

const config: CapacitorConfig = {
  appId: "com.njdrive50.app",
  appName: "NJDRIVE50",
  webDir: "dist",

  server: {
    androidScheme: "https",
    cleartext: false,
  },

  android: {
    allowMixedContent: !isProduction,
    webContentsDebuggingEnabled: !isProduction,
    captureInput: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
};

export default config;