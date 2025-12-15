import React, { useState } from 'react';
import { useEditorStore } from '../../ai-editing/hooks/useEditorStore';
import { generatePptFromState } from '../logic/converter';
import { Presentation } from 'lucide-react';

export const ExportPptButton: React.FC = () => {
  const { getActiveSession } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const session = getActiveSession();
    if (!session || !session.canvasState) {
        alert('没有可导出的内容');
        return;
    }

    try {
      setIsExporting(true);
      // Cast the state to our type (assuming compatibility for now)
      await generatePptFromState(session.canvasState as any, `presentation-${Date.now()}.pptx`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请查看控制台');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="导出为 PPT"
    >
      <Presentation size={16} />
      {isExporting ? '生成中...' : '导出 PPT'}
    </button>
  );
};
