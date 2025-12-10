import { fabric } from 'fabric';
import { useEffect, useState } from 'react';
import { store } from '../utils/store';

export interface EditorState {
  canvas: fabric.Canvas | null;
  backgroundImage: fabric.Image | null;
  texts: fabric.IText[];
}

export interface UseFabricOptions {
  disableAutoRestore?: boolean;
}

export const useFabric = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: UseFabricOptions = {}
) => {
  const [editor, setEditor] = useState<EditorState>({
    canvas: null,
    backgroundImage: null,
    texts: [],
  });

  const STORAGE_KEY = 'mpg_watermark_canvas_state';

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f3f4f6',
      preserveObjectStacking: true,
    });

    setEditor((prev) => ({ ...prev, canvas }));

    // Auto-save logic
    let saveTimeout: NodeJS.Timeout;
    const saveState = () => {
      try {
        // Skip saving if canvas is disposed or empty (basic check)
        if (!canvas.getElement()) return;

        const json = canvas.toJSON();
        const state = {
            ...json,
            width: canvas.width,
            height: canvas.height
        };
        store.set(STORAGE_KEY, state).catch(console.error);
      } catch (e) {
        console.error('Failed to save canvas state:', e);
      }
    };

    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveState, 1000); // 1s debounce
    };

    // Attach listeners for auto-save
    canvas.on('object:modified', debouncedSave);
    canvas.on('object:added', debouncedSave);
    canvas.on('object:removed', debouncedSave);
    canvas.on('text:changed', debouncedSave);
    // Also save on background change if possible, but fabric might not fire standard event for setBackgroundImage unless using setOverlayImage etc.
    // We can manually trigger save when needed or hook into more events.
    
    // Try restore previous state (persist across module switches)
    const restoreState = async () => {
      if (options.disableAutoRestore) return;

      try {
        const saved = await store.get<any>(STORAGE_KEY);
        // Check if canvas is still valid (not disposed)
        if (canvas.getElement() && saved) {
          if (saved.width) canvas.setWidth(saved.width);
          if (saved.height) canvas.setHeight(saved.height);
          
          canvas.loadFromJSON(saved, () => {
            // Check again inside callback
            if (canvas.getElement()) {
              canvas.requestRenderAll();
            }
          });
        }
      } catch (e) {
        console.error('Failed to restore canvas state:', e);
      }
    };

    restoreState();

    const handleResize = () => {
      // Optional: Responsive canvas logic
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(saveTimeout);
      // Optional: Force save on unmount if dirty? 
      // Risk: Async save might fail or race. 
      // Decision: Let's rely on debounced auto-save for now. 
      // If we really want, we can try one last synchronous save attempt if possible, but store is async.
      // Calling saveState() here triggers async store.set. It might work if app is not closing.
      saveState();
      
      canvas.dispose();
    };
  }, [options.disableAutoRestore]); // Added dependency to re-init if option changes (though unlikely)

  return editor;
};
