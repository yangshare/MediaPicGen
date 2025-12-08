import React, { useState } from 'react';
import { HistoryItem } from '../hooks/useTopicHistory';
import { Clock, Trash2, ChevronRight, Download, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { SettingsManager } from '../../settings/logic/settingsManager';

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  currentId?: string;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  onSelect,
  onDelete,
  currentId,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    
    const settings = SettingsManager.getSettings();
    if (!settings || !settings.downloadPath) {
      alert('请先在设置中配置下载路径');
      return;
    }

    if (downloadingId) return;

    try {
      setDownloadingId(item.id);
      // @ts-ignore
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('download-batch-images', {
        basePath: settings.downloadPath,
        topic: item.topic,
        images: item.results.map(r => ({ uploadPath: r.uploadPath, content: r.content }))
      });

      if (result.success) {
        alert(`下载成功！已保存至：${result.path}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Download failed:', error);
      alert(`下载失败: ${error.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="w-80 h-full bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-500" />
        <h2 className="font-semibold text-slate-700">生成记录</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-sm">
            暂无历史记录
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className={clsx(
                "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border",
                currentId === item.id
                  ? "bg-blue-50 border-blue-200 shadow-sm"
                  : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
              )}
              onClick={() => onSelect(item)}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className={clsx(
                  "font-medium truncate text-sm mb-1",
                  currentId === item.id ? "text-blue-700" : "text-slate-700"
                )}>
                  {item.topic}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleDownload(e, item)}
                  disabled={downloadingId === item.id}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="下载图片"
                >
                  {downloadingId === item.id ? (
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                  ) : (
                    <Download size={14} />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
