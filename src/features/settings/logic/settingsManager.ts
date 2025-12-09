import { AppSettings } from '../types';
import { store } from '../../../utils/store';

const SETTINGS_STORAGE_KEY = 'MediaPicGen_settings';

export const SettingsManager = {
  saveSettings: async (settings: AppSettings): Promise<void> => {
    await store.set(SETTINGS_STORAGE_KEY, settings);
  },

  getSettings: async (): Promise<AppSettings | null> => {
    let settings = await store.get<AppSettings>(SETTINGS_STORAGE_KEY);
    if (!settings) {
      // Try to migrate from localStorage
      const legacy = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (legacy) {
        try {
          settings = JSON.parse(legacy);
          await store.set(SETTINGS_STORAGE_KEY, settings);
        } catch (e) {
          console.error('Settings migration failed', e);
        }
      }
    }
    return settings;
  },

  clearSettings: async (): Promise<void> => {
    await store.delete(SETTINGS_STORAGE_KEY);
  }
};
