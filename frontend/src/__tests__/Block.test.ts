/**
 * Unit tests for Block model.
 * 
 * Tests block creation, cloning, and utility methods.
 */

import { Block, BlockType, IBlock } from '../models/Block';

describe('Block', () => {
  describe('constructor', () => {
    it('should create a block with minimal parameters', () => {
      const block = new Block('test-id', BlockType.PARAGRAPH);
      
      expect(block.id).toBe('test-id');
      expect(block.type).toBe(BlockType.PARAGRAPH);
      expect(block.content).toBe('');
      expect(block.metadata).toBeUndefined();
      expect(block.settings).toBeUndefined();
      expect(block.position_id).toBe(0);
      expect(block.position_order).toBe(0);
    });

    it('should create a block with all parameters', () => {
      const metadata = { language: 'python', checked: true };
      const settings = { styling: { fontSize: 16 } };
      
      const block = new Block(
        'test-id',
        BlockType.CODE,
        'console.log("test")',
        metadata,
        settings,
        5,
        3
      );
      
      expect(block.id).toBe('test-id');
      expect(block.type).toBe(BlockType.CODE);
      expect(block.content).toBe('console.log("test")');
      expect(block.metadata).toEqual(metadata);
      expect(block.settings).toEqual(settings);
      expect(block.position_id).toBe(5);
      expect(block.position_order).toBe(3);
    });

    it('should create different block types', () => {
      const heading = new Block('h1', BlockType.HEADING1);
      const paragraph = new Block('p1', BlockType.PARAGRAPH);
      const code = new Block('c1', BlockType.CODE);
      const image = new Block('i1', BlockType.IMAGE);
      
      expect(heading.type).toBe(BlockType.HEADING1);
      expect(paragraph.type).toBe(BlockType.PARAGRAPH);
      expect(code.type).toBe(BlockType.CODE);
      expect(image.type).toBe(BlockType.IMAGE);
    });
  });

  describe('clone', () => {
    it('should create a shallow copy of the block', () => {
      const original = new Block(
        'original-id',
        BlockType.PARAGRAPH,
        'test content',
        { language: 'javascript' },
        { styling: { fontSize: 14 } },
        2,
        1
      );
      
      const cloned = original.clone();
      
      expect(cloned).not.toBe(original);
      expect(cloned.id).toBe(original.id);
      expect(cloned.type).toBe(original.type);
      expect(cloned.content).toBe(original.content);
      expect(cloned.metadata).toEqual(original.metadata);
      expect(cloned.settings).toEqual(original.settings);
      expect(cloned.position_id).toBe(original.position_id);
      expect(cloned.position_order).toBe(original.position_order);
    });

    it('should not share metadata reference with original', () => {
      const original = new Block('id', BlockType.CODE, '', { language: 'python' });
      const cloned = original.clone();
      
      // Modify cloned metadata
      if (cloned.metadata) {
        cloned.metadata.language = 'javascript';
      }
      
      expect(original.metadata?.language).toBe('python');
      expect(cloned.metadata?.language).toBe('javascript');
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty content', () => {
      const block = new Block('id', BlockType.PARAGRAPH, '');
      expect(block.isEmpty()).toBe(true);
    });

    it('should return true for whitespace-only content', () => {
      const block1 = new Block('id1', BlockType.PARAGRAPH, '   ');
      const block2 = new Block('id2', BlockType.PARAGRAPH, '\n\t  ');
      
      expect(block1.isEmpty()).toBe(true);
      expect(block2.isEmpty()).toBe(true);
    });

    it('should return false for non-empty content', () => {
      const block = new Block('id', BlockType.PARAGRAPH, 'Hello');
      expect(block.isEmpty()).toBe(false);
    });

    it('should return false for content with leading/trailing whitespace', () => {
      const block = new Block('id', BlockType.PARAGRAPH, '  Hello  ');
      expect(block.isEmpty()).toBe(false);
    });
  });

  describe('BlockType enum', () => {
    it('should contain all expected block types', () => {
      expect(BlockType.PARAGRAPH).toBe('paragraph');
      expect(BlockType.HEADING1).toBe('heading1');
      expect(BlockType.HEADING2).toBe('heading2');
      expect(BlockType.HEADING3).toBe('heading3');
      expect(BlockType.BULLETED_LIST).toBe('bulleted_list');
      expect(BlockType.NUMBERED_LIST).toBe('numbered_list');
      expect(BlockType.TODO).toBe('todo');
      expect(BlockType.CODE).toBe('code');
      expect(BlockType.QUOTE).toBe('quote');
      expect(BlockType.MATH).toBe('math');
      expect(BlockType.DIVIDER).toBe('divider');
      expect(BlockType.IMAGE).toBe('image');
      expect(BlockType.VIDEO).toBe('video');
      expect(BlockType.AUDIO).toBe('audio');
      expect(BlockType.GRID).toBe('grid');
      expect(BlockType.NOTEBOOK_LINK).toBe('notebook_link');
    });
  });

  describe('metadata variations', () => {
    it('should support code block metadata', () => {
      const block = new Block('id', BlockType.CODE, 'code', {
        language: 'typescript',
      });
      
      expect(block.metadata?.language).toBe('typescript');
    });

    it('should support todo block metadata', () => {
      const block = new Block('id', BlockType.TODO, 'Task', {
        checked: true,
      });
      
      expect(block.metadata?.checked).toBe(true);
    });

    it('should support image block metadata', () => {
      const block = new Block('id', BlockType.IMAGE, '', {
        url: 'https://example.com/image.png',
        alt: 'Test image',
        width: 500,
        height: 300,
      });
      
      expect(block.metadata?.url).toBe('https://example.com/image.png');
      expect(block.metadata?.alt).toBe('Test image');
      expect(block.metadata?.width).toBe(500);
      expect(block.metadata?.height).toBe(300);
    });

    it('should support grid block metadata', () => {
      const block = new Block('id', BlockType.GRID, '', {
        gridRows: 2,
        gridCols: 3,
        gridCells: {
          '0-0': ['block-id-1'],
          '0-1': ['block-id-2'],
        },
      });
      
      expect(block.metadata?.gridRows).toBe(2);
      expect(block.metadata?.gridCols).toBe(3);
      expect(block.metadata?.gridCells).toBeDefined();
    });

    it('should support notebook link metadata', () => {
      const block = new Block('id', BlockType.NOTEBOOK_LINK, '', {
        notebookId: 'notebook-123',
        notebookName: 'My Notebook',
      });
      
      expect(block.metadata?.notebookId).toBe('notebook-123');
      expect(block.metadata?.notebookName).toBe('My Notebook');
    });
  });

  describe('settings variations', () => {
    it('should support styling settings', () => {
      const block = new Block('id', BlockType.PARAGRAPH, 'text', undefined, {
        styling: {
          fontSize: 18,
          fontFamily: 'Arial',
          textColor: '#000000',
          backgroundColor: '#FFFFFF',
          borderColor: '#CCCCCC',
          borderWidth: 2,
          borderRadius: 5,
          padding: 10,
        },
      });
      
      expect(block.settings?.styling?.fontSize).toBe(18);
      expect(block.settings?.styling?.fontFamily).toBe('Arial');
      expect(block.settings?.styling?.textColor).toBe('#000000');
      expect(block.settings?.styling?.backgroundColor).toBe('#FFFFFF');
      expect(block.settings?.styling?.borderColor).toBe('#CCCCCC');
      expect(block.settings?.styling?.borderWidth).toBe(2);
      expect(block.settings?.styling?.borderRadius).toBe(5);
      expect(block.settings?.styling?.padding).toBe(10);
    });

    it('should support partial styling settings', () => {
      const block = new Block('id', BlockType.PARAGRAPH, 'text', undefined, {
        styling: {
          fontSize: 16,
          textColor: '#FF0000',
        },
      });
      
      expect(block.settings?.styling?.fontSize).toBe(16);
      expect(block.settings?.styling?.textColor).toBe('#FF0000');
      expect(block.settings?.styling?.fontFamily).toBeUndefined();
    });
  });
});
