import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { EditorStoreContextType, EditingSession } from '../types';

const EditorStoreContext = createContext<EditorStoreContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 9);

export const EditorStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<EditingSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const addSession = useCallback(async (fileOrUrl: File | string) => {
    const id = generateId();
    let originalUrl = '';
    let name = 'Untitled';
    let file: File | null = null;

    if (fileOrUrl instanceof File) {
      originalUrl = URL.createObjectURL(fileOrUrl);
      name = fileOrUrl.name;
      file = fileOrUrl;
    } else {
      originalUrl = fileOrUrl;
      name = `Image ${sessions.length + 1}`;
    }

    const newSession: EditingSession = {
      id,
      file,
      originalUrl,
      previewUrl: originalUrl,
      canvasState: null,
      history: [],
      historyIndex: -1,
      lastModified: Date.now(),
      name,
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(id);
    return id;
  }, [sessions.length]);

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => {
      const newSessions = prev.filter((s) => s.id !== id);
      // If we removed the active session, switch to another one
      if (id === activeSessionId) {
        if (newSessions.length > 0) {
          setActiveSessionId(newSessions[newSessions.length - 1].id);
        } else {
          setActiveSessionId(null);
        }
      }
      return newSessions;
    });
  }, [activeSessionId]);

  const setActiveSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const updateSessionState = useCallback((id: string, canvasJson: any, previewUrl?: string) => {
    setSessions((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        canvasState: canvasJson,
        previewUrl: previewUrl || s.previewUrl,
        lastModified: Date.now(),
      };
    }));
  }, []);

  const getActiveSession = useCallback(() => {
    return sessions.find((s) => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveSessionId(null);
  }, []);

  return (
    <EditorStoreContext.Provider
      value={{
        sessions,
        activeSessionId,
        addSession,
        removeSession,
        setActiveSession,
        updateSessionState,
        getActiveSession,
        clearAllSessions,
      }}
    >
      {children}
    </EditorStoreContext.Provider>
  );
};

export const useEditorStore = () => {
  const context = useContext(EditorStoreContext);
  if (!context) {
    throw new Error('useEditorStore must be used within an EditorStoreProvider');
  }
  return context;
};
