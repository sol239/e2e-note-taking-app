// Block Model - represents a single content block/cell
export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING1 = 'heading1',
  HEADING2 = 'heading2',
  HEADING3 = 'heading3',
  BULLETED_LIST = 'bulleted_list',
  NUMBERED_LIST = 'numbered_list',
  TODO = 'todo',
  CODE = 'code',
  QUOTE = 'quote',
  MATH = 'math',
  DIVIDER = 'divider',
  IMAGE = 'image',
  VIDEO = 'video',
  GRID = 'grid',
}

export interface IBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    language?: string; // For code blocks
    checked?: boolean; // For todo items
    url?: string; // For images and videos
    alt?: string; // For images
    gridRows?: number; // For grid blocks
    gridCols?: number; // For grid blocks
    gridCells?: Record<string, string[]>; // For grid blocks - cell key to block IDs
  };
  settings?: {
    styling?: {
      fontSize?: number;
      fontFamily?: string;
      textColor?: string;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      borderRadius?: number;
      padding?: number;
    };
  };
}

export class Block implements IBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    language?: string;
    checked?: boolean;
    url?: string;
    alt?: string;
    gridRows?: number;
    gridCols?: number;
    gridCells?: Record<string, string[]>;
  };
  settings?: {
    styling?: {
      fontSize?: number;
      fontFamily?: string;
      textColor?: string;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      borderRadius?: number;
      padding?: number;
    };
  };

  constructor(
    id: string,
    type: BlockType = BlockType.PARAGRAPH,
    content: string = '',
    metadata?: {
      language?: string;
      checked?: boolean;
      url?: string;
      alt?: string;
      gridRows?: number;
      gridCols?: number;
      gridCells?: Record<string, string[]>;
    },
    settings?: {
      styling?: {
        fontSize?: number;
        fontFamily?: string;
        textColor?: string;
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: number;
        borderRadius?: number;
        padding?: number;
      };
    }
  ) {
    this.id = id;
    this.type = type;
    this.content = content;
    this.metadata = metadata;
    this.settings = settings;
  }

  clone(): Block {
    return new Block(this.id, this.type, this.content, { ...this.metadata }, this.settings);
  }

  isEmpty(): boolean {
    return this.content.trim() === '';
  }
}
