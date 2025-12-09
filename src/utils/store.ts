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
      const val = localStorage.getItem(key);
      try {
        return val ? JSON.parse(val) : null;
      } catch (e) {
        return null;
      }
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
      localStorage.setItem(key, JSON.stringify(value));
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
      localStorage.removeItem(key);
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
      localStorage.clear();
    }
  }
};
