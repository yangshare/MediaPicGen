import { useState, useEffect } from 'react';
import { TopicResult } from '../types';
import { store } from '../../../utils/store';

export interface HistoryItem {
  id: string;
  topic: string;
  timestamp: number;
  results: TopicResult[];
}

const STORAGE_KEY = 'MediaPicGen_topic_history';

export const useTopicHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
        let saved = await store.get<HistoryItem[]>(STORAGE_KEY);
        
        if (!saved || saved.length === 0) {
           // Migration from localStorage
           const legacy = localStorage.getItem(STORAGE_KEY);
           if (legacy) {
             try {
               const parsed = JSON.parse(legacy);
               if (parsed && parsed.length > 0) {
                 saved = parsed;
                 await store.set(STORAGE_KEY, saved);
               }
             } catch (e) {
                console.error('History migration failed', e);
             }
           }
        }

        if (saved) {
            setHistory(saved);
        }
    };
    loadHistory();
  }, []);

  const addToHistory = (topic: string, results: TopicResult[]) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      topic,
      timestamp: Date.now(),
      results,
    };

    setHistory((prev) => {
      const newHistory = [newItem, ...prev];
      store.set(STORAGE_KEY, newHistory);
      return newHistory;
    });

    return newItem.id;
  };

  const updateHistoryItem = (id: string, newResults: TopicResult[]) => {
    setHistory((prev) => {
      const newHistory = prev.map((item) => 
        item.id === id ? { ...item, results: newResults } : item
      );
      store.set(STORAGE_KEY, newHistory);
      return newHistory;
    });
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.id !== id);
      store.set(STORAGE_KEY, newHistory);
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    store.delete(STORAGE_KEY);
  };

  return {
    history,
    addToHistory,
    updateHistoryItem,
    deleteHistoryItem,
    clearHistory,
  };
};
