import { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { saveAs } from 'file-saver';
import { processBatchImages } from '../batch/logic/batchProcessor';
import { Sidebar } from '../../components/Sidebar';
import { PropertyPanel } from '../../components/PropertyPanel';
import { BatchPanel } from '../../components/BatchPanel';
import { useFabric } from '../../hooks/useFabric';

interface EditorProps {
  initialImageUrl?: string | null;
}

export const Editor: React.FC<EditorProps> = ({ initialImageUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { canvas } = useFabric(canvasRef);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialImageUrl && canvas) {
      fabric.Image.fromURL(initialImageUrl, (img) => {
        if (!img) return;
        
        // Reset canvas dimensions to image dimensions
        canvas.setWidth(img.width || 800);
        canvas.setHeight(img.height || 600);
        
        canvas.setBackgroundImage(img, canvas.requestRenderAll.bind(canvas), {
          // Make sure image fits or scales correctly if needed, but for now exact match
        });
      }, { crossOrigin: 'anonymous' });
    }
  }, [initialImageUrl, canvas]);

  const handleAddImage = (file: File) => {
    if (!canvas) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgObj = new Image();
      imgObj.src = e.target?.result as string;
      imgObj.onload = () => {
        const fabricImage = new fabric.Image(imgObj);
        
        canvas.setWidth(imgObj.width);
        canvas.setHeight(imgObj.height);
        
        canvas.setBackgroundImage(fabricImage, canvas.requestRenderAll.bind(canvas));
      };
    };
    reader.readAsDataURL(file);
  };

  const handleAddText = () => {
    if (!canvas) return;
    const text = new fabric.IText('请输入文字', {
      left: 50,
      top: 50,
      fontFamily: 'Arial',
      fill: '#000000',
      fontSize: 40,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  const handleExport = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
    });
    const link = document.createElement('a');
    link.download = 'output.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchImport = (fileList: FileList) => {
    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    setBatchFiles(prev => [...prev, ...files]);
  };

  const handleRemoveBatchFile = (index: number) => {
    setBatchFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchProcess = async () => {
    if (!canvas || batchFiles.length === 0) return;
    
    // 1. Get current text objects (template)
    const objects = canvas.getObjects().filter(obj => obj.type === 'i-text');
    if (objects.length === 0) {
        alert("请先在画布上添加文字作为模板");
        return;
    }

    setIsProcessing(true);
    // Serialize template
    const templateJSON = objects.map(obj => obj.toObject());

    try {
      const blob = await processBatchImages({
        files: batchFiles,
        templateObjects: templateJSON
      });
      saveAs(blob, "processed_images.zip");
    } catch (error) {
      console.error("Batch processing failed:", error);
      alert("批量处理失败，请检查图片格式");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full w-full flex bg-slate-100 overflow-hidden">
      <Sidebar 
        onAddImage={handleAddImage} 
        onAddText={handleAddText}
        onExport={handleExport}
        onBatchImport={handleBatchImport}
        onBatchProcess={handleBatchProcess}
        isProcessing={isProcessing}
      />
      
      <div className="flex-1 relative overflow-auto flex items-center justify-center bg-slate-100 p-8">
        <div className="shadow-2xl">
          <canvas ref={canvasRef} />
        </div>
        
        <BatchPanel files={batchFiles} onRemove={handleRemoveBatchFile} />
      </div>

      <PropertyPanel canvas={canvas} />
    </div>
  );
};
