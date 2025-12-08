import { AppSettings } from '../types';

const SETTINGS_STORAGE_KEY = 'multit2i_settings';

export const SettingsManager = {
  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  },

  getSettings: (): AppSettings | null => {
    const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!settingsJson) {
      return null;
    }
    try {
      return JSON.parse(settingsJson) as AppSettings;
    } catch (e) {
      console.error('Failed to parse settings:', e);
      return null;
    }
  },

  clearSettings: (): void => {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  }
};
