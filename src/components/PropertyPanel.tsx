import React, { useEffect, useState } from 'react';
import { fabric } from 'fabric';

interface PropertyPanelProps {
  canvas: fabric.Canvas | null;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ canvas }) => {
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [textProps, setTextProps] = useState({
    text: '',
    fontSize: 24,
    fill: '#000000',
    fontFamily: 'Arial',
  });

  useEffect(() => {
    if (!canvas) return;

    const updateSelection = () => {
      const activeObject = canvas.getActiveObject();
      setSelectedObject(activeObject);

      if (activeObject && activeObject.type === 'i-text') {
        const textObj = activeObject as fabric.IText;
        setTextProps({
          text: textObj.text || '',
          fontSize: textObj.fontSize || 24,
          fill: textObj.fill as string || '#000000',
          fontFamily: textObj.fontFamily || 'Arial',
        });
      }
    };

    canvas.on('selection:created', updateSelection);
    canvas.on('selection:updated', updateSelection);
    canvas.on('selection:cleared', () => setSelectedObject(null));
    canvas.on('object:modified', updateSelection); // Capture resize/move

    return () => {
      canvas.off('selection:created', updateSelection);
      canvas.off('selection:updated', updateSelection);
      canvas.off('selection:cleared');
      canvas.off('object:modified', updateSelection);
    };
  }, [canvas]);

  const updateTextProperty = (key: keyof fabric.IText, value: any) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'i-text') return;

    const textObj = selectedObject as fabric.IText;
    textObj.set(key, value);
    
    // Update local state immediately for responsiveness
    if (key === 'fontSize') setTextProps(p => ({ ...p, fontSize: parseInt(value) }));
    if (key === 'fill') setTextProps(p => ({ ...p, fill: value }));
    if (key === 'fontFamily') setTextProps(p => ({ ...p, fontFamily: value }));

    canvas.requestRenderAll();
  };

  if (!selectedObject) {
    return (
      <div className="w-64 bg-white border-l border-slate-200 p-4 text-slate-500 text-sm flex flex-col items-center justify-center">
        <p>请选择画布上的元素</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-slate-200 p-4 flex flex-col gap-6 overflow-y-auto">
      <div>
        <h3 className="font-medium text-slate-900 mb-3">文字属性</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">字号 (px)</label>
            <input
              type="number"
              value={textProps.fontSize}
              onChange={(e) => updateTextProperty('fontSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">颜色</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={textProps.fill}
                onChange={(e) => updateTextProperty('fill', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-sm text-slate-600 uppercase">{textProps.fill}</span>
            </div>
          </div>

          <div>
             <label className="block text-xs text-slate-500 mb-1">字体</label>
             <select 
                value={textProps.fontFamily}
                onChange={(e) => updateTextProperty('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
             >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Microsoft YaHei">微软雅黑</option>
                <option value="SimSun">宋体</option>
                <option value="SimHei">黑体</option>
             </select>
          </div>
        </div>
      </div>
    </div>
  );
};
