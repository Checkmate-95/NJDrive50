import { Preferences } from '@capacitor/preferences';

export async function devResetAll() {
  try {
    // Clear Capacitor Preferences (main storage)
    await Preferences.clear();

    // Clear localStorage (web fallback)
    localStorage.clear();

    // Clear Zustand persisted stores
    Object.keys(localStorage)
      .filter((k) => k.includes('zustand'))
      .forEach((k) => localStorage.removeItem(k));

    console.log('[DEV RESET] All storage cleared');
  } catch (err) {
    console.error('[DEV RESET ERROR]', err);
  }
}
