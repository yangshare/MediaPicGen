export interface EditingSession {
  id: string;
  file: File | null; // The original file object (if uploaded locally)
  originalUrl: string; // The source URL (local blob or remote URL)
  previewUrl: string; // Current preview URL (could be same as original initially)
  canvasState: any | null; // Fabric.js JSON state object
  history: any[]; // Undo/Redo history stack (simplified for now)
  historyIndex: number;
  lastModified: number;
  name: string;
}

export interface EditorStoreContextType {
  sessions: EditingSession[];
  activeSessionId: string | null;
  
  // Actions
  addSession: (fileOrUrl: File | string) => Promise<string>;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  updateSessionState: (id: string, canvasJson: any, previewUrl?: string) => void;
  getActiveSession: () => EditingSession | undefined;
  clearAllSessions: () => void;
}
