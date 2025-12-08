import React from 'react';
import { Upload, Type, Download, FolderInput, Play } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  onAddImage: (file: File) => void;
  onAddText: () => void;
  onExport: () => void;
  onBatchImport: (files: FileList) => void;
  onBatchProcess: () => void;
  isProcessing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onAddImage, 
  onAddText, 
  onExport,
  onBatchImport,
  onBatchProcess,
  isProcessing
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const batchInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAddImage(e.target.files[0]);
    }
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onBatchImport(e.target.files);
    }
  };

  return (
    <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-10">
      <div className="flex flex-col gap-2 w-full items-center border-b border-slate-100 pb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors relative group"
          title="上传单张模板图"
        >
          <Upload size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
            上传模板图
          </span>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </button>

        <button
          onClick={onAddText}
          className="p-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors relative group"
          title="添加文字"
        >
          <Type size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
            添加文字
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-2 w-full items-center pt-2">
        <button
          onClick={() => batchInputRef.current?.click()}
          className="p-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors relative group"
          title="批量导入图片"
        >
          <FolderInput size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
            批量导入
          </span>
          <input
            type="file"
            ref={batchInputRef}
            className="hidden"
            accept="image/*"
            multiple
            // @ts-ignore - webkitdirectory attribute is not standard but supported
            webkitdirectory="" 
            onChange={handleBatchChange}
          />
        </button>
        
        <button
          onClick={onBatchProcess}
          disabled={isProcessing}
          className={clsx(
            "p-3 rounded-xl transition-colors relative group",
            isProcessing 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200"
          )}
          title="批量处理并导出"
        >
          <Play size={24} className={isProcessing ? "animate-pulse" : ""} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
            开始批量处理
          </span>
        </button>
      </div>

      <div className="flex-1" />

      <button
        onClick={onExport}
        className="p-3 rounded-xl text-green-600 hover:bg-green-50 transition-colors relative group"
        title="导出当前预览图"
      >
        <Download size={24} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
          导出当前图
        </span>
      </button>
    </div>
  );
};
