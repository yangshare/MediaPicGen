import React from 'react';
import { ImageListSidebar } from './ImageListSidebar';
import { CanvasWorkspace } from './CanvasWorkspace';
import { ToolsPanel } from './ToolsPanel';
import { useEditorStore } from '../hooks/useEditorStore';
import { ArrowLeft, Download } from 'lucide-react';


interface EditorLayoutProps {
  onBack: () => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({ onBack }) => {
  const { activeSessionId, getActiveSession } = useEditorStore();

  const handleExport = () => {
    const session = getActiveSession();
    if (!session || !session.canvasState) return;
    
    // Quick hack to get canvas data URL. 
    // Ideally we should access the canvas instance from CanvasWorkspace or store ref in context.
    // For now, let's rely on the fact that we might need to "re-render" to get high quality output 
    // or just grab the current preview if it's high enough quality. 
    // BETTER APPROACH: Use a ref or event bus to request export from CanvasWorkspace.
    
    // Since we don't have direct access to fabric canvas instance here easily without complex ref forwarding,
    // let's assume for this MVP we just download the source for now or alert user.
    // Wait, we can store the `toDataURL` result in the session state too? 
    // Or better: Let CanvasWorkspace expose a ref with `exportImage` method.
    
    alert('导出功能将在对接真实Canvas实例后完善。目前请右键图片另存为或截图。');
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg text-slate-800">AI 图像编辑器</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            disabled={!activeSessionId}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            导出当前
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <ImageListSidebar />
        <CanvasWorkspace />
        <ToolsPanel />
      </div>
    </div>
  );
};
