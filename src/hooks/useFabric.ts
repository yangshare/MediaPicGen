import { fabric } from 'fabric';
import { useEffect, useState } from 'react';

export interface EditorState {
  canvas: fabric.Canvas | null;
  backgroundImage: fabric.Image | null;
  texts: fabric.IText[];
}

export const useFabric = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [editor, setEditor] = useState<EditorState>({
    canvas: null,
    backgroundImage: null,
    texts: [],
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f3f4f6',
      preserveObjectStacking: true,
    });

    setEditor((prev) => ({ ...prev, canvas }));

    const handleResize = () => {
      // Optional: Responsive canvas logic
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  return editor;
};
