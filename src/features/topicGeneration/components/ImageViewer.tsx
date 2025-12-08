import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { TopicResult } from '../types';

interface ImageViewerProps {
  results: TopicResult[];
  initialIndex: number;
  onClose: () => void;
  onUpdateContent?: (index: number, newContent: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ results, initialIndex, onClose, onUpdateContent }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentItem = results[currentIndex];
  
  const [editContent, setEditContent] = useState(currentItem.content);
  const [isDirty, setIsDirty] = useState(false);

  // Sync editContent when currentItem changes
  useEffect(() => {
    setEditContent(currentItem.content);
    setIsDirty(false);
  }, [currentIndex, currentItem.content]);

  const handleSave = () => {
    onUpdateContent?.(currentIndex, editContent);
    setIsDirty(false);
  };

  const handlePrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
  }, [results.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrevious, handleNext]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-20"
      >
        <X size={32} />
      </button>

      {/* Previous Button */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10 z-20"
        >
          <ChevronLeft size={48} />
        </button>
      )}

      {/* Next Button */}
      {currentIndex < results.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10 z-20"
        >
          <ChevronRight size={48} />
        </button>
      )}
      
      {/* Content Container */}
      <div 
        className="flex w-full max-w-7xl h-[85vh] gap-12 px-12 items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Text Side */}
        <div className="w-1/3 h-full flex flex-col justify-center text-white/90 animate-in slide-in-from-left-4 duration-300 relative group">
          <div className="max-h-full overflow-y-auto pr-4 custom-scrollbar flex flex-col h-full">
            <div className="flex items-center justify-between sticky top-0 bg-black/95 py-2 z-10 mb-4">
              <h3 className="text-2xl font-bold">{currentItem.topic}</h3>
              {isDirty && (
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-all animate-in fade-in zoom-in"
                >
                  <Save size={16} />
                  保存
                </button>
              )}
            </div>
            
            <textarea
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                setIsDirty(e.target.value !== currentItem.content);
              }}
              className="w-full flex-1 bg-transparent text-lg leading-relaxed whitespace-pre-wrap outline-none resize-none border-none p-0 focus:ring-0 placeholder-white/30 text-white/90 custom-scrollbar"
              placeholder="输入文案内容..."
            />
          </div>
        </div>

        {/* Image Side */}
        <div className="flex-1 h-full flex flex-col items-center justify-center relative">
          <img
            key={currentIndex} // Force re-render for animation
            src={currentItem.uploadPath}
            alt={`Preview ${currentIndex + 1}/${results.length}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
          />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {currentIndex + 1} / {results.length}
          </div>
        </div>
      </div>
    </div>
  );
};
