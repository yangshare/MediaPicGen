import React from 'react';
import { X } from 'lucide-react';

interface BatchPanelProps {
  files: File[];
  onRemove: (index: number) => void;
}

export const BatchPanel: React.FC<BatchPanelProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="absolute bottom-8 left-28 right-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 flex flex-col max-h-48 z-20">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-slate-800">待处理图片 ({files.length})</h3>
        <span className="text-xs text-slate-500">点击 "开始批量处理" 按钮应用当前样式</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {files.map((file, index) => (
          <div key={index} className="relative group flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
            <img 
              src={URL.createObjectURL(file)} 
              alt={file.name} 
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 truncate">
              {file.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
