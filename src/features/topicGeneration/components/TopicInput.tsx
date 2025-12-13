import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSimulatedProgress } from '../../../hooks/useSimulatedProgress';
import { CircularProgress } from '../../../components/ui/CircularProgress';

interface TopicInputProps {
  onGenerate: (topic: string, size: string) => void;
  isLoading: boolean;
}

const SIZE_OPTIONS = [
  { label: '1:1 (1024*1024)', value: '1024x1024' },
  { label: '4:3 (1024*768)', value: '1024x768' },
  { label: '3:4 (768*1024)', value: '768x1024' },
  { label: '16:9 (1024*576)', value: '1024x576' },
  { label: '9:16 (576*1024)', value: '576x1024' },
  { label: '3:2 (1024*640)', value: '1024x640' },
  { label: '2:3 (640*1024)', value: '640x1024' },
];

export const TopicInput: React.FC<TopicInputProps> = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [selectedSize, setSelectedSize] = useState(SIZE_OPTIONS[0].value);
  
  // 10 minutes = 600 seconds. 1% every 6 seconds.
  const progress = useSimulatedProgress(isLoading, { stepInterval: 6000 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onGenerate(topic, selectedSize);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative">
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="h-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white cursor-pointer min-w-[160px]"
            disabled={isLoading}
          >
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="请输入主题（例如：冬季护肤保湿）..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            disabled={isLoading}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-w-[120px] justify-center"
        >
          {isLoading ? (
            <>
              <CircularProgress 
                progress={progress} 
                size={20} 
                strokeWidth={3} 
                trackColor="text-blue-400/30" 
                indicatorColor="text-white" 
              />
              <span>{progress}%</span>
            </>
          ) : (
            '生成内容'
          )}
        </button>
      </form>
    </div>
  );
};
