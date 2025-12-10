import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '../hooks/useEditorStore';
import { Loader2 } from 'lucide-react';

export const CanvasWorkspace: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const { getActiveSession, updateSessionState, activeSessionId } = useEditorStore();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    if (fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f3f4f6',
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    const handleModification = () => {
      const activeSession = getActiveSession();
      if (activeSession) {
        const json = canvas.toJSON();
        const state = {
            ...json,
            width: canvas.width,
            height: canvas.height
        };

        let preview: string | undefined = undefined;
        try {
          preview = canvas.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.2 });
        } catch {}
        updateSessionState(activeSession.id, state, preview);
      }
    };

    canvas.on('object:modified', handleModification);
    canvas.on('object:added', handleModification);
    canvas.on('object:removed', handleModification);
    canvas.on('path:created', handleModification);

    return () => {
      const inst = fabricCanvasRef.current;
      fabricCanvasRef.current = null;
      if (inst) inst.dispose();
    };
  }, []);

  // Handle Session Switching & Image Loading
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;
    if (!activeSessionId) {
        fabricCanvas.clear();
        fabricCanvas.setBackgroundImage(null as any, fabricCanvas.requestRenderAll.bind(fabricCanvas));
        fabricCanvas.setWidth(800);
        fabricCanvas.setHeight(600);
        return;
    }

    const session = getActiveSession();
    if (!session) return;

    setIsLoading(true);

    // Helper to setup image centered
    const setupImage = (img: fabric.Image) => {
        fabricCanvas.clear();
        
        const imgWidth = img.width || 800;
        const imgHeight = img.height || 600;

        // Set canvas size to match image size
        fabricCanvas.setWidth(imgWidth);
        fabricCanvas.setHeight(imgHeight);
        
        // Reset zoom to 1
        fabricCanvas.setZoom(1);

        // Use setBackgroundImage like in Editor.tsx
        fabricCanvas.setBackgroundImage(img, fabricCanvas.requestRenderAll.bind(fabricCanvas), {
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0
        });
        
        // Force immediate render
        fabricCanvas.renderAll();
        setIsLoading(false);
    };

    const loadAndRender = (src: string) => {
        const imgObj = new Image();
        imgObj.onload = () => {
            const fImg = new fabric.Image(imgObj);
            setupImage(fImg);
            const json = fabricCanvas.toJSON();
            // Initial save with dimensions
            const state = {
                ...json,
                width: fabricCanvas.width,
                height: fabricCanvas.height
            };
            updateSessionState(session.id, state);
        };
        imgObj.onerror = () => setIsLoading(false);
        imgObj.src = src;
    };

    if (session.canvasState) {
      // Restore dimensions if available
      if (session.canvasState.width) fabricCanvas.setWidth(session.canvasState.width);
      if (session.canvasState.height) fabricCanvas.setHeight(session.canvasState.height);

      // Load existing state; if nothing renders, fall back to original URL
      fabricCanvas.loadFromJSON(session.canvasState, () => {
        // Check if canvas is still valid (not disposed)
        if (!fabricCanvas.getElement()) return;

        // Fallback for dimensions if not in state but in background image
        if (!session.canvasState.width && fabricCanvas.backgroundImage) {
            const bg = fabricCanvas.backgroundImage as fabric.Image;
            if (bg.width && bg.height) {
                 fabricCanvas.setWidth(bg.width * (bg.scaleX || 1));
                 fabricCanvas.setHeight(bg.height * (bg.scaleY || 1));
            }
        }

        fabricCanvas.requestRenderAll();
        const hasContent = (fabricCanvas.getObjects().length > 0) || !!fabricCanvas.backgroundImage;
        
        if (!hasContent) {
          // Fallback to original
          let urlToLoad = session.originalUrl;
          if (urlToLoad && /^[a-zA-Z]:\\/.test(urlToLoad)) {
            urlToLoad = `file:///${urlToLoad.replace(/\\/g, '/')}`;
          }
          loadAndRender(urlToLoad);
        } else {
          setIsLoading(false);
        }
      });
    } else {
      // Load fresh image
      // Try to handle local path if it doesn't start with protocol
      let urlToLoad = session.originalUrl;
      
      // Handle local files in Electron environment using Node.js fs
      // @ts-ignore
      if (window.require && !urlToLoad.startsWith('http') && !urlToLoad.startsWith('data:')) {
          try {
              // @ts-ignore
              const fs = window.require('fs');
              // Strip file protocol if present for fs reading
              let fsPath = urlToLoad.startsWith('file:///') ? decodeURIComponent(urlToLoad.replace('file:///', '')) : urlToLoad;
              
              console.log('[Canvas] Reading local file:', fsPath);
              
              if (fs.existsSync(fsPath)) {
                  const buffer = fs.readFileSync(fsPath);
                  const ext = fsPath.split('.').pop()?.toLowerCase();
                  let mime = 'image/png';
                  if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
                  if (ext === 'webp') mime = 'image/webp';
                  
                  const base64Url = `data:${mime};base64,${buffer.toString('base64')}`;
                  loadAndRender(base64Url);
                  return;
              }
          } catch (e) {
              console.error('[Canvas] FS read failed, falling back to URL:', e);
          }
      }

      // Basic check for Windows absolute paths that might need protocol (Fallback)
      if (urlToLoad && /^[a-zA-Z]:\\/.test(urlToLoad)) {
         urlToLoad = `file:///${urlToLoad.replace(/\\/g, '/')}`;
      }

      loadAndRender(urlToLoad);
    }

  }, [activeSessionId]);

  

  return (
    <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-8 relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        </div>
      )}
      <div className="shadow-lg">
        <canvas ref={canvasRef} />
      </div>
      {!activeSessionId && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none">
          请选择或上传一张图片开始编辑
        </div>
      )}
    </div>
  );
};
