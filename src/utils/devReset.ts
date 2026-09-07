// src/utils/devReset.ts
import { Preferences } from '@capacitor/preferences';

export async function clearLocalSessionState() {
  try {
    await Preferences.clear();
    localStorage.clear();

    Object.keys(localStorage)
      .filter((k) => k.includes('zustand'))
      .forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error('[clearLocalSessionState] Failed to clear local state:', err);
  }
}