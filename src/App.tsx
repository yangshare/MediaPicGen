import { useState, useEffect } from 'react';
import { Editor } from './features/editor/Editor';
import { TopicGenerator } from './features/topicGeneration/TopicGenerator';
import { AIEditor } from './features/ai-editing/components/AIEditor';
import { LayoutGrid, Stamp, Settings, Wand2 } from 'lucide-react';
import { SettingsModal } from './features/settings/components/SettingsModal';
import { SettingsManager } from './features/settings/logic/settingsManager';

function App() {
  const [currentView, setCurrentView] = useState<'topic' | 'editor' | 'ai-editing'>('topic');
  const [editorInitialImage, setEditorInitialImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  useEffect(() => {
    const settings = SettingsManager.getSettings();
    if (!settings) {
      setIsInitialSetup(true);
      setShowSettings(true);
    }
  }, []);

  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  useEffect(() => {
    try {
      // @ts-ignore
      const electron = window.require ? window.require('electron') : require('electron');
      const { ipcRenderer } = electron;
      
      const handleUpdateStatus = (_: any, text: string) => {
        setUpdateStatus(text);
        // Clean up status after 5 seconds if it's not a persistent state or an error
        if (!text.includes('下载') && !text.includes('重启') && !text.includes('失败')) {
          setTimeout(() => setUpdateStatus(null), 5000);
        }
      };
      
      const handleUpdateProgress = (_: any, percent: number) => {
        setDownloadProgress(percent);
        if (percent >= 100) {
          setTimeout(() => setDownloadProgress(null), 1000);
        }
      };

      const handleUpdateError = (_: any, errorMsg: string) => {
        console.error('Update Error:', errorMsg);
        // 自动弹窗提示错误，方便用户反馈
        alert(`更新失败: ${errorMsg}\n\n请检查网络连接或稍后重试。`);
      };

      ipcRenderer.on('update-status', handleUpdateStatus);
      ipcRenderer.on('update-progress', handleUpdateProgress);
      ipcRenderer.on('update-error', handleUpdateError);

      return () => {
        ipcRenderer.removeListener('update-status', handleUpdateStatus);
        ipcRenderer.removeListener('update-progress', handleUpdateProgress);
        ipcRenderer.removeListener('update-error', handleUpdateError);
      };
    } catch (e) {
      console.log('Not in Electron environment or IPC not available');
    }
  }, []);


  const handleAIEdit = (imageUrl: string) => {
    setEditorInitialImage(imageUrl);
    setCurrentView('ai-editing');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <nav className="w-20 bg-slate-900 flex flex-col items-center py-6 gap-6 z-50">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50 mb-4 cursor-default overflow-hidden" title="MediaPicGen">
          <img src="/icon.svg" alt="Logo" className="w-full h-full object-cover" />
        </div>
        
        <button 
          onClick={() => setCurrentView('topic')}
          className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 w-16 ${currentView === 'topic' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          title="AI内容生成"
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-medium">生成</span>
        </button>
        
        <button 
          onClick={() => setCurrentView('editor')}
          className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 w-16 ${currentView === 'editor' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          title="批量水印"
        >
          <Stamp size={24} />
          <span className="text-[10px] font-medium">水印</span>
        </button>

        <button 
          onClick={() => setCurrentView('ai-editing')}
          className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 w-16 ${currentView === 'ai-editing' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          title="AI编辑"
        >
          <Wand2 size={24} />
          <span className="text-[10px] font-medium">AI编辑</span>
        </button>

        <div className="flex-1" />
        
        <button 
          onClick={() => {
            setIsInitialSetup(false);
            setShowSettings(true);
          }}
          className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 flex flex-col items-center gap-1 w-16"
          title="设置"
        >
          <Settings size={24} />
          <span className="text-[10px] font-medium">设置</span>
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-slate-50">
        {currentView === 'topic' ? (
          <TopicGenerator onEditImage={handleAIEdit} />
        ) : currentView === 'editor' ? (
          // 水印模块只处理本地上传，不再接收生成的图片
          <Editor initialImageUrl={null} />
        ) : (
          <AIEditor initialImageUrl={editorInitialImage} onBack={() => setCurrentView('topic')} onConsumedInitialImage={() => setEditorInitialImage(null)} />
        )}
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        isInitialSetup={isInitialSetup}
      />

      {/* Update Notification */}
      {updateStatus && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-blue-100 z-[100] max-w-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-slate-700">{updateStatus}</div>
          </div>
          {downloadProgress !== null && downloadProgress < 100 && (
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
