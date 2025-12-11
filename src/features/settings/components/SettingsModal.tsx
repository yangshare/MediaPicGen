import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { SettingsManager } from '../logic/settingsManager';
import { X, Save, FolderOpen } from 'lucide-react';
import { useToast } from '../../../components/Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialSetup?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isInitialSetup = false }) => {
  const { showToast } = useToast();
  const [baseUrl, setBaseUrl] = useState('');
  const [authHeader, setAuthHeader] = useState('');
  const [downloadPath, setDownloadPath] = useState('');
  const [appVersion, setAppVersion] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadSettings = async () => {
        const currentSettings = await SettingsManager.getSettings();
        if (currentSettings) {
          setBaseUrl(currentSettings.apiBaseUrl);
          setAuthHeader(currentSettings.authHeader);
          setDownloadPath(currentSettings.downloadPath || '');
        } else {
          // Default placeholders or empty
          setBaseUrl('https://n8n.api.yangshare.com/api/v1');
          setAuthHeader('Basic YW1iOjZ5SXReaGwqNlR2NUFa');
          setDownloadPath('');
        }
      };
      loadSettings();

      // Get App Version
      try {
        // @ts-ignore
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.invoke('get-app-version').then((version: string) => {
          setAppVersion(version);
        });
      } catch (e) {
        console.log('Not in Electron environment');
        setAppVersion('Web Mode');
      }
    }
  }, [isOpen]);

  const handleSelectFolder = async () => {
    try {
      // @ts-ignore
      const { ipcRenderer } = window.require('electron');
      const path = await ipcRenderer.invoke('dialog:openDirectory');
      if (path) {
        setDownloadPath(path);
      }
    } catch (e) {
      console.error('Failed to open directory dialog', e);
      alert('无法打开文件夹选择器，请手动输入路径');
    }
  };
  const handleOpenLog = async () => {
    try {
      // @ts-ignore
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('open-log-folder');
    } catch (e) {
      console.error('Failed to open log folder', e);
      alert('无法打开日志文件夹');
    }
  };

  const handleSave = async () => {
    if (!baseUrl.trim() || !authHeader.trim()) {
      setError('所有字段都是必填项');
      return;
    }

    const settings: AppSettings = {
      apiBaseUrl: baseUrl.trim(),
      authHeader: authHeader.trim(),
      downloadPath: downloadPath.trim(),
    };

    await SettingsManager.saveSettings(settings);
    setError(null);
    
    if (isInitialSetup) {
      onClose();
    } else {
      showToast('设置保存成功', 'success');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {isInitialSetup ? '欢迎使用 MediaPicGen' : '系统设置'}
          </h2>
          {!isInitialSetup && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isInitialSetup && (
            <p className="text-sm text-slate-600 mb-4">
              初次使用，请配置 API 连接信息以继续。
            </p>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">API Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Auth Header</label>
            <input
              type="text"
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              placeholder="Basic ..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">下载路径</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
                placeholder="选择下载保存路径..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSelectFolder}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                title="选择文件夹"
              >
                <FolderOpen size={18} />
              </button>
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
             <div className="text-xs text-slate-400">
               当前版本: v{appVersion}
             </div>
             <button
               onClick={handleOpenLog}
               className="text-xs text-blue-500 hover:text-blue-600 hover:underline cursor-pointer"
             >
               打开日志目录
             </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
          >
            <Save size={18} />
            {isInitialSetup ? '开始使用' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
};
