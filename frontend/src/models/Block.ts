/**
 * Block Model - Represents a single content block/cell in a notebook.
 * 
 * Blocks are the fundamental content units that make up a notebook. Each block
 * has a type (paragraph, heading, code, etc.), content, and optional metadata
 * and styling settings.
 */

/**
 * Available block types for content blocks.
 */
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
  AUDIO = 'audio',
  GRID = 'grid',
  NOTEBOOK_LINK = 'notebook_link',
}

/**
 * Interface defining the structure of a block.
 */
export interface IBlock {
  /** Unique identifier (UUID) */
  id: string;
  /** Block type (paragraph, heading, code, etc.) */
  type: BlockType;
  /** Block content (text, code, URL, etc.) */
  content: string;
  /** Optional metadata specific to block type */
  metadata?: {
    language?: string; // For code blocks
    checked?: boolean; // For todo items
    url?: string; // For images and videos
    alt?: string; // For images
    filename?: string; // For uploaded images
    uploaded?: boolean; // For uploaded images
    width?: number; // For resizable images and videos
    height?: number; // For resizable images and videos
    gridRows?: number; // For grid blocks
    gridCols?: number; // For grid blocks
    gridCells?: Record<string, string[]>; // For grid blocks - cell key to block IDs
    notebookId?: string; // For notebook link blocks
    notebookName?: string; // For notebook link blocks
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
  position_id?: number;
  position_order?: number;
}

/**
 * Block class implementation with utility methods.
 * 
 * Provides methods for cloning blocks and checking if a block is empty.
 * Immutable operations return new instances rather than modifying in place.
 */
export class Block implements IBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    language?: string;
    checked?: boolean;
    url?: string;
    alt?: string;
    filename?: string;
    uploaded?: boolean;
    gridRows?: number;
    gridCols?: number;
    gridCells?: Record<string, string[]>;
    notebookId?: string;
    notebookName?: string;
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
  position_id?: number;
  position_order?: number;

  constructor(
    id: string,
    type: BlockType = BlockType.PARAGRAPH,
    content: string = '',
    metadata?: {
      language?: string;
      checked?: boolean;
      url?: string;
      alt?: string;
      filename?: string;
      uploaded?: boolean;
      gridRows?: number;
      gridCols?: number;
      gridCells?: Record<string, string[]>;
      notebookId?: string;
      notebookName?: string;
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
    },
    position_id: number = 0,
    position_order: number = 0
  ) {
    this.id = id;
    this.type = type;
    this.content = content;
    this.metadata = metadata;
    this.settings = settings;
    this.position_id = position_id;
    this.position_order = position_order;
  }

  /**
   * Create a shallow copy of this block.
   * @returns A new Block instance with the same properties
   */
  clone(): Block {
    return new Block(this.id, this.type, this.content, { ...this.metadata }, this.settings, this.position_id, this.position_order);
  }

  /**
   * Check if the block has no content.
   * @returns True if content is empty or whitespace-only
   */
  isEmpty(): boolean {
    return this.content.trim() === '';
  }
}
