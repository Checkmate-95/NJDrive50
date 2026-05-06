import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.njdrive50.app',
  appName: 'NJDRIVE50',
  webDir: 'dist',

  server: {
    androidScheme: 'https',
    cleartext: false,
  },

  android: {
    allowMixedContent: true, // ✅ allow external scripts like Google Maps
    captureInput: true,
    webContentsDebuggingEnabled: true, // ✅ helpful during dev
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
