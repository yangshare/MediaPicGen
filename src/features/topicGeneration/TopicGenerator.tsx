import React, { useState } from 'react';
import { TopicInput } from './components/TopicInput';
import { ResultCard } from './components/ResultCard';
import { HistorySidebar } from './components/HistorySidebar';
import { ImageViewer } from './components/ImageViewer';
import { generateTopicContent, regenerateImage } from './logic/api';
import { TopicResult } from './types';
import { useTopicHistory, HistoryItem } from './hooks/useTopicHistory';
import { useToast } from '../../components/Toast';

interface TopicGeneratorProps {
  onEditImage?: (url: string) => void;
  onBusyStateChange?: (isBusy: boolean) => void;
}

export const TopicGenerator: React.FC<TopicGeneratorProps> = ({ onEditImage, onBusyStateChange }) => {
  const { showToast } = useToast();
  const [results, setResults] = useState<TopicResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | undefined>();
  
  const { history, addToHistory, updateHistoryItem, deleteHistoryItem } = useTopicHistory();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Notify parent component about busy state
  React.useEffect(() => {
    const isBusy = isLoading || regeneratingIds.size > 0;
    onBusyStateChange?.(isBusy);
  }, [isLoading, regeneratingIds, onBusyStateChange]);

  // Auto-select the latest history item on initial load
  React.useEffect(() => {
    if (!hasInitialized && history.length > 0) {
      handleHistorySelect(history[0]);
      setHasInitialized(true);
    }
  }, [history, hasInitialized]);

  const handleGenerate = async (topic: string, size: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentHistoryId(undefined); // Reset current history selection for new generation
    
    try {
      const data = await generateTopicContent(topic, size);
      setResults(data);
      const newHistoryId = addToHistory(topic, data);
      setCurrentHistoryId(newHistoryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setResults(item.results);
    setError(null);
    setCurrentHistoryId(item.id);
  };

  const handleHistoryDelete = (id: string) => {
    deleteHistoryItem(id);
    if (currentHistoryId === id) {
      setResults([]);
      setCurrentHistoryId(undefined);
    }
  };

  const handleContentUpdate = (index: number, newContent: string) => {
    const newResults = [...results];
    newResults[index] = {
      ...newResults[index],
      content: newContent
    };
    
    setResults(newResults);
    
    // Update history if we are currently viewing a history item
    if (currentHistoryId) {
      updateHistoryItem(currentHistoryId, newResults);
    }
  };

  const handleRegenerate = async (result: TopicResult, index: number) => {
    setRegeneratingIds(prev => new Set(prev).add(index));
    try {
      // Use result.content as prompt for regeneration as requested
      const newImageUrl = await regenerateImage(result.content);
      
      const newResults = [...results];
      newResults[index] = {
        ...result,
        uploadPath: newImageUrl
      };
      
      setResults(newResults);
      
      // Update history if we are currently viewing a history item
      if (currentHistoryId) {
        updateHistoryItem(currentHistoryId, newResults);
      }
      
    } catch (err) {
      console.error('Regeneration failed:', err);
      showToast('重新生成失败，请稍后重试', 'error');
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden">
      {/* Sidebar */}
      <HistorySidebar
        history={history}
        onSelect={handleHistorySelect}
        onDelete={handleHistoryDelete}
        currentId={currentHistoryId}
        disabled={isLoading || regeneratingIds.size > 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-50 h-full overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto pb-10">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AI 图文内容生成器</h1>
            <p className="text-lg text-gray-600">输入主题，一键生成精美图文卡片</p>
          </header>

          <TopicInput onGenerate={handleGenerate} isLoading={isLoading} />

          {error && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              Error: {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((result, index) => (
                <ResultCard 
                  key={`${result.topic}-${index}`} 
                  result={result}
                  onImageClick={() => setPreviewIndex(index)}
                  onEdit={(res) => onEditImage?.(res.uploadPath)}
                  onRegenerate={(res) => handleRegenerate(res, index)}
                  isRegenerating={regeneratingIds.has(index)}
                  disabled={isLoading || regeneratingIds.size > 0}
                />
              ))}
            </div>
          )}

          {previewIndex !== null && (
            <ImageViewer 
              results={results}
              initialIndex={previewIndex}
              onClose={() => setPreviewIndex(null)}
              onUpdateContent={handleContentUpdate}
            />
          )}
          
          {!isLoading && results.length === 0 && !error && (
            <div className="text-center text-gray-400 mt-20">
              <p>暂无内容，请在上方输入主题开始生成，或从左侧选择历史记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
