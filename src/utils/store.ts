import { browserStore } from './browserStore';

export const isElectron = () => {
  return typeof window !== 'undefined' && window.require && window.require('electron');
};

export const store = {
  get: async <T>(key: string): Promise<T | null> => {
    if (isElectron()) {
      try {
        // @ts-ignore
        const { ipcRenderer } = window.require('electron');
        return await ipcRenderer.invoke('store:get', key);
      } catch (e) {
        console.error('Failed to get from electron-store:', e);
        return null;
      }
    } else {
      return browserStore.get<T>(key);
    }
  },
  
  set: async (key: string, value: any): Promise<void> => {
    if (isElectron()) {
      try {
        // @ts-ignore
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('store:set', key, value);
      } catch (e) {
        console.error('Failed to set to electron-store:', e);
      }
    } else {
      await browserStore.set(key, value);
    }
  },

  delete: async (key: string): Promise<void> => {
    if (isElectron()) {
      try {
        // @ts-ignore
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('store:delete', key);
      } catch (e) {
        console.error('Failed to delete from electron-store:', e);
      }
    } else {
      await browserStore.delete(key);
    }
  },
  
  clear: async (): Promise<void> => {
    if (isElectron()) {
      try {
        // @ts-ignore
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('store:clear');
      } catch (e) {
        console.error('Failed to clear electron-store:', e);
      }
    } else {
      await browserStore.clear();
    }
  }
};
