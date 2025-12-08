import { useState, useEffect } from 'react';
import { TopicResult } from '../types';

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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });

    return newItem.id;
  };

  const updateHistoryItem = (id: string, newResults: TopicResult[]) => {
    setHistory((prev) => {
      const newHistory = prev.map((item) => 
        item.id === id ? { ...item, results: newResults } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    history,
    addToHistory,
    updateHistoryItem,
    deleteHistoryItem,
    clearHistory,
  };
};
