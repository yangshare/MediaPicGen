import { useState, useEffect } from 'react';
import { Editor } from './features/editor/Editor';
import { TopicGenerator } from './features/topicGeneration/TopicGenerator';
import { LayoutGrid, PenTool, Settings } from 'lucide-react';
import { SettingsModal } from './features/settings/components/SettingsModal';
import { SettingsManager } from './features/settings/logic/settingsManager';

function App() {
  const [currentView, setCurrentView] = useState<'topic' | 'editor'>('topic');
  const [editorInitialImage, setEditorInitialImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  useEffect(() => {
    const checkSettings = async () => {
      const settings = await SettingsManager.getSettings();
      if (!settings) {
        setIsInitialSetup(true);
        setShowSettings(true);
      }
    };
    checkSettings();
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

  const handleEditImage = (imageUrl: string) => {
    setEditorInitialImage(imageUrl);
    setCurrentView('editor');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100">
      {/* Navigation Bar */}
      <nav className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-6 z-50 shadow-sm shrink-0">
        <div className="font-bold text-xl text-slate-800 mr-4">MediaPicGen</div>
        
        <button
          onClick={() => setCurrentView('topic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'topic' 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LayoutGrid size={18} />
          AI 内容生成
        </button>

        <button
          onClick={() => setCurrentView('editor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'editor' 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <PenTool size={18} />
          图片编辑器
        </button>

        <div className="flex-1" />

        <button
          onClick={() => {
            setIsInitialSetup(false);
            setShowSettings(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Settings size={18} />
          设置
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'topic' ? (
          <TopicGenerator onEditImage={handleEditImage} />
        ) : (
          <Editor initialImageUrl={editorInitialImage} />
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
