/**
 * Unit tests for DocumentManager.
 * 
 * Tests CRUD operations on block collections with change notifications.
 */

import { DocumentManager } from '../models/DocumentManager';
import { Block, BlockType } from '../models/Block';

describe('DocumentManager', () => {
  describe('constructor', () => {
    it('should create with default empty block if no initial blocks provided', () => {
      const onChange = jest.fn();
      const manager = new DocumentManager(undefined, onChange);
      
      const blocks = manager.getBlocks();
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe(BlockType.PARAGRAPH);
    });

    it('should create with provided initial blocks', () => {
      const initialBlocks = [
        new Block('1', BlockType.HEADING1, 'Title'),
        new Block('2', BlockType.PARAGRAPH, 'Content'),
      ];
      
      const manager = new DocumentManager(initialBlocks);
      const blocks = manager.getBlocks();
      
      expect(blocks).toHaveLength(2);
      expect(blocks[0].id).toBe('1');
      expect(blocks[1].id).toBe('2');
    });

    it('should accept onChange callback', () => {
      const onChange = jest.fn();
      const manager = new DocumentManager(undefined, onChange);
      
      manager.addBlock(new Block('new', BlockType.PARAGRAPH));
      
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('getBlocks', () => {
    it('should return a copy of blocks array', () => {
      const manager = new DocumentManager();
      const blocks1 = manager.getBlocks();
      const blocks2 = manager.getBlocks();
      
      expect(blocks1).toEqual(blocks2);
      expect(blocks1).not.toBe(blocks2); // Different array instances
    });
  });

  describe('addBlock', () => {
    it('should add block to the end by default', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
      ]);
      
      manager.addBlock(new Block('2', BlockType.PARAGRAPH, 'Second'));
      
      const blocks = manager.getBlocks();
      expect(blocks).toHaveLength(2);
      expect(blocks[1].id).toBe('2');
    });

    it('should add block at specified index', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
        new Block('3', BlockType.PARAGRAPH, 'Third'),
      ]);
      
      manager.addBlock(new Block('2', BlockType.PARAGRAPH, 'Second'), 1);
      
      const blocks = manager.getBlocks();
      expect(blocks).toHaveLength(3);
      expect(blocks[0].id).toBe('1');
      expect(blocks[1].id).toBe('2');
      expect(blocks[2].id).toBe('3');
    });

    it('should notify onChange when block is added', () => {
      const onChange = jest.fn();
      const manager = new DocumentManager(undefined, onChange);
      
      onChange.mockClear();
      manager.addBlock(new Block('new', BlockType.PARAGRAPH));
      
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should add block at index 0', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
      ]);
      
      manager.addBlock(new Block('0', BlockType.HEADING1, 'Title'), 0);
      
      const blocks = manager.getBlocks();
      expect(blocks[0].id).toBe('0');
      expect(blocks[1].id).toBe('1');
    });
  });

  describe('updateBlock', () => {
    it('should update existing block', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'Original'),
      ]);
      
      manager.updateBlock('1', { content: 'Updated' });
      
      const blocks = manager.getBlocks();
      expect(blocks[0].content).toBe('Updated');
    });

    it('should update block type', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'Text'),
      ]);
      
      manager.updateBlock('1', { type: BlockType.HEADING1 });
      
      const blocks = manager.getBlocks();
      expect(blocks[0].type).toBe(BlockType.HEADING1);
    });

    it('should update block metadata', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.CODE, 'code'),
      ]);
      
      manager.updateBlock('1', { metadata: { language: 'python' } });
      
      const blocks = manager.getBlocks();
      expect(blocks[0].metadata?.language).toBe('python');
    });

    it('should notify onChange when block is updated', () => {
      const onChange = jest.fn();
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'Text'),
      ], onChange);
      
      onChange.mockClear();
      manager.updateBlock('1', { content: 'New' });
      
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if block not found', () => {
      const onChange = jest.fn();
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'Text'),
      ], onChange);
      
      onChange.mockClear();
      manager.updateBlock('nonexistent', { content: 'New' });
      
      const blocks = manager.getBlocks();
      expect(blocks[0].content).toBe('Text');
      expect(onChange).toHaveBeenCalledTimes(1); // Still notified
    });
  });

  describe('deleteBlock', () => {
    it('should delete existing block', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
        new Block('2', BlockType.PARAGRAPH, 'Second'),
      ]);
      
      manager.deleteBlock('1');
      
      const blocks = manager.getBlocks();
      expect(blocks).toHaveLength(1);
      expect(blocks[0].id).toBe('2');
    });

    it('should ensure at least one block exists after deletion', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'Only'),
      ]);
      
      manager.deleteBlock('1');
      
      const blocks = manager.getBlocks();
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe(BlockType.PARAGRAPH);
    });

    it('should notify onChange when block is deleted', () => {
      const onChange = jest.fn();
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
        new Block('2', BlockType.PARAGRAPH, 'Second'),
      ], onChange);
      
      onChange.mockClear();
      manager.deleteBlock('1');
      
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if block not found', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'Text'),
      ]);
      
      manager.deleteBlock('nonexistent');
      
      const blocks = manager.getBlocks();
      expect(blocks).toHaveLength(1);
      expect(blocks[0].id).toBe('1');
    });
  });

  describe('moveBlock', () => {
    it('should move block to new position', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
        new Block('2', BlockType.PARAGRAPH, 'Second'),
        new Block('3', BlockType.PARAGRAPH, 'Third'),
      ]);
      
      manager.moveBlock('1', 2);
      
      const blocks = manager.getBlocks();
      expect(blocks[0].id).toBe('2');
      expect(blocks[1].id).toBe('3');
      expect(blocks[2].id).toBe('1');
    });

    it('should move block backwards', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
        new Block('2', BlockType.PARAGRAPH, 'Second'),
        new Block('3', BlockType.PARAGRAPH, 'Third'),
      ]);
      
      manager.moveBlock('3', 0);
      
      const blocks = manager.getBlocks();
      expect(blocks[0].id).toBe('3');
      expect(blocks[1].id).toBe('1');
      expect(blocks[2].id).toBe('2');
    });

    it('should notify onChange when block is moved', () => {
      const onChange = jest.fn();
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
        new Block('2', BlockType.PARAGRAPH, 'Second'),
      ], onChange);
      
      onChange.mockClear();
      manager.moveBlock('1', 1);
      
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if block not found', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
        new Block('2', BlockType.PARAGRAPH, 'Second'),
      ]);
      
      manager.moveBlock('nonexistent', 0);
      
      const blocks = manager.getBlocks();
      expect(blocks[0].id).toBe('1');
      expect(blocks[1].id).toBe('2');
    });

    it('should do nothing if newIndex is out of bounds', () => {
      const manager = new DocumentManager([
        new Block('1', BlockType.PARAGRAPH, 'First'),
        new Block('2', BlockType.PARAGRAPH, 'Second'),
      ]);
      
      manager.moveBlock('1', 10);
      
      const blocks = manager.getBlocks();
      expect(blocks[0].id).toBe('1');
      expect(blocks[1].id).toBe('2');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const manager = new DocumentManager();
      const id1 = manager.generateId();
      const id2 = manager.generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate UUID format', () => {
      const manager = new DocumentManager();
      const id = manager.generateId();
      
      // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidPattern);
    });
  });
});
