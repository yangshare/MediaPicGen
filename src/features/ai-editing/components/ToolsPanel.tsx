import React from 'react';
import { Wand2, Eraser, Move, Crop, Maximize, Palette } from 'lucide-react';

export const ToolsPanel: React.FC = () => {
  const handleAITool = (toolName: string) => {
    console.log(`[AI-Editor] Activated AI Tool: ${toolName}`);
    // Future: Open modal or activate canvas interaction mode
  };

  return (
    <div className="w-72 h-full bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Wand2 size={18} className="text-purple-600" />
          AI 智能编辑
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* AI Tools Section */}
        <section>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">AI 能力</h4>
          <div className="grid grid-cols-2 gap-3">
            <ToolButton
              icon={<Eraser size={20} />}
              label="智能消除"
              onClick={() => handleAITool('inpainting-remove')}
              description="涂抹消除多余物体"
            />
            <ToolButton
              icon={<Palette size={20} />}
              label="局部重绘"
              onClick={() => handleAITool('inpainting-fill')}
              description="生成新的内容填补"
            />
            <ToolButton
              icon={<Maximize size={20} />}
              label="画质增强"
              onClick={() => handleAITool('upscale')}
              description="提升分辨率与细节"
            />
            <ToolButton
              icon={<Wand2 size={20} />}
              label="背景移除"
              onClick={() => handleAITool('remove-bg')}
              description="一键扣除背景"
            />
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Basic Tools Section */}
        <section>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">基础调整</h4>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <Crop size={18} className="text-slate-500 group-hover:text-blue-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 group-hover:text-blue-700">裁剪与旋转</div>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <Move size={18} className="text-slate-500 group-hover:text-blue-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 group-hover:text-blue-700">调整尺寸</div>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  description?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, onClick, description }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 hover:shadow-sm transition-all group text-center h-28"
    >
      <div className="mb-2 p-2 bg-white rounded-full shadow-sm text-slate-600 group-hover:text-purple-600 transition-colors">
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-700 group-hover:text-purple-700 mb-1">{label}</span>
      {description && (
        <span className="text-[10px] text-slate-400 leading-tight group-hover:text-purple-400/80 line-clamp-2">
          {description}
        </span>
      )}
    </button>
  );
};
