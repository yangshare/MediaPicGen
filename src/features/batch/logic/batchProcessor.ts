import { fabric } from 'fabric';
import JSZip from 'jszip';

export interface BatchProcessOptions {
  files: File[];
  templateObjects: any[]; // fabric object json
  onProgress?: (current: number, total: number) => void;
}

export const processBatchImages = async ({
  files,
  templateObjects,
  onProgress
}: BatchProcessOptions): Promise<Blob> => {
  const zip = new JSZip();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    await new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgObj = new Image();
        imgObj.src = e.target?.result as string;
        imgObj.onload = () => {
          try {
            // Create a temporary canvas for processing
            // Note: In React Strict Mode or certain environments, creating too many canvases might be heavy.
            // But since we dispose them, it should be fine.
            const tempCanvas = new fabric.StaticCanvas(null, {
              width: imgObj.width,
              height: imgObj.height
            });

            const bgImage = new fabric.Image(imgObj);
            tempCanvas.setBackgroundImage(bgImage, () => {
              // Add template texts
              // The third argument "" is for namespace, which is often empty in standard usage
              fabric.util.enlivenObjects(templateObjects, (enlivenedObjects: fabric.Object[]) => {
                enlivenedObjects.forEach((obj) => {
                  tempCanvas.add(obj);
                });
                
                tempCanvas.renderAll();
                
                // Export to blob
                const dataUrl = tempCanvas.toDataURL({ format: 'png', quality: 0.8 });
                const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
                zip.file(`processed_${file.name}`, base64Data, { base64: true });
                
                tempCanvas.dispose();
                resolve();
              }, ""); 
            });
          } catch (err) {
            reject(err);
          }
        };
        imgObj.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
    
    if (onProgress) {
        onProgress(i + 1, files.length);
    }
  }

  return await zip.generateAsync({ type: "blob" });
};
