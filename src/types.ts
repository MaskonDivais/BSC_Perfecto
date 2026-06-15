export interface MediaFile {
  id: string;
  name: string;
  type: string;
  dataUrl: string; 
  size: number;
}

export interface NodeField {
  id: string;
  type: 'text' | 'media';
  name: string;
  textValue?: string;
  mediaValue?: MediaFile[];
}

export interface ChoiceVariation {
  id: string;
  text: string;
}

export interface StoryNode {
  id: string;
  title: string;
  x: number;
  y: number;
  script: string;
  tag: string; 
  media: MediaFile[];
  isSaved: boolean;
  borderColor?: string; 
  lineColor?: string; 
  borderThickness?: number; 
  lineThickness?: number; 
  lineDashed?: boolean; 
  fields?: NodeField[]; 
  nodeType?: 'start' | 'end' | 'variation' | 'description';
  variations?: ChoiceVariation[];
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  color?: string; 
  thickness?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  fromChoiceId?: string;
}

export interface Group {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  borderStyle?: 'dashed' | 'solid' | 'dotted';
  borderWidth?: number;
}

export interface PyQtFile {
  path: string;
  description: string;
  content: string;
}
