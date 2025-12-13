import React, { useState } from 'react';
import { TopicResult } from '../types';
import { ImageOff, Edit, RefreshCw, Download } from 'lucide-react';
import { useSimulatedProgress } from '../../../hooks/useSimulatedProgress';
import { LinearProgress } from '../../../components/ui/LinearProgress';

interface ResultCardProps {
  result: TopicResult;
  onImageClick?: (url: string) => void;
  onEdit?: (result: TopicResult) => void;
  onRegenerate?: (result: TopicResult) => void;
  isRegenerating?: boolean;
  disabled?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  result, 
  onImageClick, 
  onEdit, 
  onRegenerate,
  isRegenerating = false,
  disabled = false
}) => {
  const [imageError, setImageError] = useState(false);
  
  // 2 minutes = 120 seconds. 1% every 1.2 seconds.
  // User asked for "2 minutes for 100%, step 2s increase 1%". 
  // We'll prioritize the "step 2s" instruction as it is more specific mechanically.
  // So stepInterval = 2000ms. Total duration = 200s.
  const progress = useSimulatedProgress(isRegenerating, { stepInterval: 150 });
  const handleDownload = async () => {
    try {
      // @ts-ignore
      if (window.require) {
        // @ts-ignore
        const { ipcRenderer } = window.require('electron');
        const safeName = result.topic.replace(/[^\w\u4e00-\u9fa5]/g, '') + '.png';
        await ipcRenderer.invoke('save-image', { 
            url: result.uploadPath,
            defaultName: safeName
        });
      }
    } catch (e) {
        console.error('Download failed', e);
    }
  };

  return (
    <div className="w-full h-96 bg-white rounded-lg shadow-md overflow-hidden flex flex-col border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      {/* Top 80% - Image */}
      <div className="h-[80%] w-full bg-gray-100 relative flex items-center justify-center group overflow-hidden">
        {!imageError ? (
          <>
            <img
              src={result.uploadPath}
              alt={result.topic}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${onImageClick ? 'cursor-zoom-in' : ''}`}
              loading="lazy"
              onError={() => setImageError(true)}
              onClick={() => onImageClick?.(result.uploadPath)}
            />
            
            {/* Loading Overlay - Visible when regenerating */}
            {isRegenerating && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 px-8">
                <div className="w-full max-w-[200px] flex flex-col items-center gap-3">
                  <div className="flex items-center justify-between w-full text-blue-700 font-medium text-sm">
                    <span>重新生成中...</span>
                    <span>{progress}%</span>
                  </div>
                  <LinearProgress 
                    progress={progress} 
                    height={8} 
                    trackClassName="bg-blue-100" 
                    indicatorClassName="bg-blue-600" 
                  />
                </div>
              </div>
            )}

            {/* Hover Actions Overlay */}
            <div 
              className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 cursor-zoom-in z-10 ${isRegenerating ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={() => onImageClick?.(result.uploadPath)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                disabled={disabled}
                className={`flex items-center gap-2 px-6 py-2.5 bg-white/90 hover:bg-white text-slate-800 rounded-full font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Download size={16} />
                下载
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(result);
                }}
                disabled={disabled}
                className={`flex items-center gap-2 px-6 py-2.5 bg-white/90 hover:bg-white text-slate-800 rounded-full font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Edit size={16} />
                AI编辑
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate?.(result);
                }}
                disabled={isRegenerating || disabled}
                className={`flex items-center gap-2 px-6 py-2.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded-full font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${disabled ? 'opacity-50' : ''}`}
              >
                <RefreshCw size={16} className={isRegenerating ? "animate-spin" : ""} />
                {isRegenerating ? '生成中...' : '重新生成'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 gap-2 p-4 text-center">
            <ImageOff className="w-12 h-12 opacity-50" />
            <span className="text-sm">图片加载失败</span>
          </div>
        )}
      </div>
      
      {/* Bottom 20% - Content */}
      <div className="h-[20%] w-full p-3 bg-white flex items-center">
        <p className="text-sm text-gray-700 line-clamp-3 overflow-hidden" title={result.content}>
          {result.content}
        </p>
      </div>
    </div>
  );
};
