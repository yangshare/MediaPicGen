export interface FabricObject {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  opacity?: number;
  fill?: string;
  originX?: string;
  originY?: string;
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
  // Image specific
  src?: string;
  // Shape specific
  rx?: number; // for rect radius
  ry?: number;
}

export interface FabricCanvasState {
  version: string;
  objects: FabricObject[];
  backgroundImage?: FabricObject;
  width: number;
  height: number;
}

export interface PptSlideData {
  title?: string;
  content: string;
  imageUrl?: string;
}

export interface PptGenerationOptions {
  topic: string;
  author?: string;
}
