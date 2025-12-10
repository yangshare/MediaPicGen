import React, { useRef } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { Plus, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export const ImageListSidebar: React.FC = () => {
  const { sessions, activeSessionId, setActiveSession, removeSession, addSession } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        addSession(file);
      });
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="w-64 h-full bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <h3 className="font-semibold text-slate-700">项目列表</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 hover:bg-slate-100 rounded-md text-blue-600 transition-colors"
          title="添加图片"
        >
          <Plus size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setActiveSession(session.id)}
            className={clsx(
              "group relative flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border",
              session.id === activeSessionId
                ? "bg-white border-blue-500 shadow-sm"
                : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"
            )}
          >
            <div className="w-12 h-12 bg-slate-200 rounded overflow-hidden flex-shrink-0 border border-slate-100">
              <img
                src={session.previewUrl}
                alt={session.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{session.name}</p>
              <p className="text-xs text-slate-400">
                {new Date(session.lastModified).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
            <ImageIcon size={32} className="opacity-50" />
            <span className="text-sm">暂无图片</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-500 hover:underline"
            >
              点击上传
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
