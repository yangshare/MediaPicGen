import React, { useState } from 'react';
import { generatePptFromTopic } from '../logic/pptBuilder';
import { ArrowLeft, Presentation, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../components/Toast';

interface PptGeneratorProps {
  onBack?: () => void;
}

export const PptGenerator: React.FC<PptGeneratorProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [lastGeneratedFile, setLastGeneratedFile] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast('请输入主题描述', 'error');
      return;
    }

    setIsGenerating(true);
    setStatus('初始化...');
    setLastGeneratedFile(null);

    try {
      await generatePptFromTopic(topic, (s) => setStatus(s));
      showToast('PPT 生成成功！已开始下载', 'success');
      setLastGeneratedFile(`${topic}.pptx`);
    } catch (error: any) {
      console.error(error);
      showToast(`生成失败: ${error.message}`, 'error');
      setStatus('生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
              <Presentation size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">PPT 智能生成</h1>
              <p className="text-xs text-slate-500">输入主题，自动生成图文并茂的演示文稿</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Input Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText size={16} />
                主题描述
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：为我生成一份关于人工智能发展历史的 PPT，包含起源、现状和未来展望..."
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none text-slate-700 placeholder:text-slate-400"
                disabled={isGenerating}
              />
              <div className="flex justify-end">
                <span className="text-xs text-slate-400">
                  {topic.length} 字
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-3
                ${isGenerating 
                  ? 'bg-orange-100 text-orange-400 cursor-wait' 
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:shadow-xl hover:-translate-y-0.5'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  {status || '正在处理...'}
                </>
              ) : (
                <>
                  <Presentation size={24} />
                  开始生成 PPT
                </>
              )}
            </button>
          </div>

          {/* Success State */}
          {lastGeneratedFile && !isGenerating && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex items-center gap-4 animate-fade-in">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">生成完成！</h3>
                <p className="text-green-600">
                  文件已自动下载。如果未开始，请检查浏览器下载设置。
                </p>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: '智能配图', desc: '根据内容自动生成高质量背景图' },
              { title: '结构化内容', desc: '自动拆分章节和要点' },
              { title: '一键导出', desc: '直接生成 .pptx 源文件' }
            ].map((tip, i) => (
              <div key={i} className="bg-white/50 p-4 rounded-xl border border-slate-100 text-center">
                <h4 className="font-medium text-slate-700 mb-1">{tip.title}</h4>
                <p className="text-xs text-slate-500">{tip.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
