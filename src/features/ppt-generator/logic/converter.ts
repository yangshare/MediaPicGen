import PptxGenJS from 'pptxgenjs';
import { FabricCanvasState } from '../types';

const PPT_WIDTH_INCHES = 10;

/**
 * Converts a Fabric.js color (hex, rgb, etc.) to PPT hex (without #)
 */
const formatColor = (color: string | undefined): string => {
  if (!color) return 'FFFFFF'; // Default white
  if (color === 'transparent') return 'FFFFFF'; // Transparency handling might differ
  if (color.startsWith('#')) return color.substring(1);
  // Basic RGB handling could be added here if needed, 
  // but Fabric usually outputs hex or rgba. 
  // For now assume Hex or handle simple cases.
  return '000000';
};

const pixelsToInches = (px: number, scaleFactor: number): number => {
  return px * scaleFactor;
};

/**
 * Converts an image URL to a base64 string using fetch.
 * Handles local file protocols if supported by browser/electron environment,
 * otherwise relies on standard fetch.
 */
export const getBase64FromUrl = async (url: string): Promise<string> => {
  if (url.startsWith('data:')) return url;
  
  try {
    // Check if running in Electron renderer with Node integration enabled (less likely in modern Electron)
    // or if we can use fetch.
    
    // For local files in Electron (if webSecurity is disabled or via custom protocol), fetch might work.
    // However, if the URL is a local path without protocol (e.g. C:\...), we need to prefix it.
    let fetchUrl = url;
    if (/^[a-zA-Z]:\\/.test(url)) {
       fetchUrl = `file:///${url.replace(/\\/g, '/')}`;
    }

    const response = await fetch(fetchUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64 string'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert image to base64, returning original URL:', url, error);
    return url;
  }
};

export const generatePptFromState = async (
  canvasState: FabricCanvasState, 
  filename: string = 'presentation.pptx'
) => {
  const pres = new PptxGenJS();
  
  // 1. Calculate Layout
  const canvasWidth = canvasState.width || 800;
  const canvasHeight = canvasState.height || 600;
  const aspectRatio = canvasWidth / canvasHeight;
  
  const pptHeight = PPT_WIDTH_INCHES / aspectRatio;
  const scaleFactor = PPT_WIDTH_INCHES / canvasWidth;

  // Define custom layout to match canvas aspect ratio
  pres.defineLayout({ 
    name: 'CANVAS_LAYOUT', 
    width: PPT_WIDTH_INCHES, 
    height: pptHeight 
  });
  pres.layout = 'CANVAS_LAYOUT';

  // 2. Create Slide
  const slide = pres.addSlide();

  // 3. Handle Background
  if (canvasState.backgroundImage && canvasState.backgroundImage.src) {
    // If background is an image
    const bgBase64 = await getBase64FromUrl(canvasState.backgroundImage.src);
    slide.background = { data: bgBase64 };
  } else {
    // Default background
    slide.background = { color: 'FFFFFF' }; 
  }

  // 4. Process Objects
  for (const obj of canvasState.objects) {
    const w_px = obj.width * (obj.scaleX || 1);
    const h_px = obj.height * (obj.scaleY || 1);
    
    let x_px = obj.left;
    if (obj.originX === 'center') x_px -= w_px / 2;
    if (obj.originX === 'right') x_px -= w_px;
    
    let y_px = obj.top;
    if (obj.originY === 'center') y_px -= h_px / 2;
    if (obj.originY === 'bottom') y_px -= h_px;

    const x = pixelsToInches(x_px, scaleFactor);
    const y = pixelsToInches(y_px, scaleFactor);
    const w = pixelsToInches(w_px, scaleFactor);
    const h = pixelsToInches(h_px, scaleFactor);
    const rotate = obj.angle || 0;

    // Common options
    const commonOpts: any = {
      x, y, w, h,
      rotate,
    };

    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      const fontSize = (obj.fontSize || 16) * (obj.scaleY || 1) * 0.75; // Approx px to pt conversion (usually 0.75 or similar depending on DPI)
      // Note: pptxgenjs font size is in points. Fabric is pixels.
      // 96dpi: 1 px = 0.75 pt.
      
      const color = formatColor(obj.fill);
      
      slide.addText(obj.text || '', {
        ...commonOpts,
        fontSize: fontSize, // Simplified scaling
        fontFace: obj.fontFamily || 'Arial',
        color: color,
        align: obj.textAlign as any || 'left',
        // Fabric aligns text relative to the bounding box. 
        // We might need adjustment if fabric origin is center.
        // Assuming default top/left origin for now.
      });
    } 
    else if (obj.type === 'image') {
      if (obj.src) {
        const imgBase64 = await getBase64FromUrl(obj.src);
        slide.addImage({
          data: imgBase64,
          ...commonOpts,
        });
      }
    }
    else if (obj.type === 'rect') {
      const color = formatColor(obj.fill);
      slide.addShape('rect', {
        ...commonOpts,
        fill: { color: color },
      });
    }
    else if (obj.type === 'circle') {
        const color = formatColor(obj.fill);
        slide.addShape('ellipse', {
          ...commonOpts,
          fill: { color: color },
        });
      }
  }

  // 5. Save
  await pres.writeFile({ fileName: filename });
};
