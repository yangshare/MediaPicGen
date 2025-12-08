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
    const settings = SettingsManager.getSettings();
    if (!settings) {
      setIsInitialSetup(true);
      setShowSettings(true);
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
    </div>
  );
}

export default App;
