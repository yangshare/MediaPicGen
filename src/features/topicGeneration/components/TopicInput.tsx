import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSimulatedProgress } from '../../../hooks/useSimulatedProgress';
import { CircularProgress } from '../../../components/ui/CircularProgress';

interface TopicInputProps {
  onGenerate: (topic: string) => void;
  isLoading: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState('');
  
  // 10 minutes = 600 seconds. 1% every 6 seconds.
  const progress = useSimulatedProgress(isLoading, { stepInterval: 6000 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onGenerate(topic);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="flex gap-2">
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
