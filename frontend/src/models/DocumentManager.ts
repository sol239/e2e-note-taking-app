import { Block, IBlock, BlockType } from './Block';

// Document Manager - manages the collection of blocks
export interface IDocumentManager {
  getBlocks(): Block[];
  addBlock(block: Block, index?: number): void;
  updateBlock(id: string, updates: Partial<IBlock>): void;
  deleteBlock(id: string): void;
  moveBlock(id: string, newIndex: number): void;
}

export class DocumentManager implements IDocumentManager {
  private blocks: Block[];
  private onChange?: (blocks: Block[]) => void;

  constructor(initialBlocks?: Block[], onChange?: (blocks: Block[]) => void) {
    this.blocks = initialBlocks || [new Block(this.generateId(), BlockType.PARAGRAPH)];
    this.onChange = onChange;
  }

  getBlocks(): Block[] {
    return [...this.blocks];
  }

  addBlock(block: Block, index?: number): void {
    if (index !== undefined && index >= 0 && index <= this.blocks.length) {
      this.blocks.splice(index, 0, block);
    } else {
      this.blocks.push(block);
    }
    this.notifyChange();
  }

  updateBlock(id: string, updates: Partial<IBlock>): void {
    const index = this.blocks.findIndex((b) => b.id === id);
    if (index !== -1) {
      const currentBlock = this.blocks[index];
      this.blocks[index] = new Block(
        updates.id ?? currentBlock.id,
        updates.type ?? currentBlock.type,
        updates.content ?? currentBlock.content,
        updates.metadata ?? currentBlock.metadata
      );
    }
    this.notifyChange();
  }

  deleteBlock(id: string): void {
    this.blocks = this.blocks.filter((b) => b.id !== id);
    // Ensure at least one block exists
    if (this.blocks.length === 0) {
      this.blocks.push(new Block(this.generateId(), BlockType.PARAGRAPH));
    }
    this.notifyChange();
  }

  moveBlock(id: string, newIndex: number): void {
    const currentIndex = this.blocks.findIndex((b) => b.id === id);
    if (currentIndex !== -1 && newIndex >= 0 && newIndex < this.blocks.length) {
      const [block] = this.blocks.splice(currentIndex, 1);
      this.blocks.splice(newIndex, 0, block);
      this.notifyChange();
    }
  }

  generateId(): string {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyChange(): void {
    if (this.onChange) {
      this.onChange(this.getBlocks());
    }
  }
}
