import { nanoid } from 'nanoid';
import type { Block, SimpleSection, Section } from '../types';

/**
 * Migrate existing blocks into a default SimpleSection
 * This is used when loading legacy data or initializing
 */
export function migrateBlocksToSections(blocks: Block[]): Section[] {
  if (blocks.length === 0) {
    return [];
  }

  // Create a single SimpleSection containing all blocks
  const section: SimpleSection = {
    id: nanoid(),
    type: 'simple',
    slots: {
      main: [...blocks],
    },
  };

  return [section];
}

/**
 * Extract all blocks from sections (for backward compatibility)
 */
export function extractBlocksFromSections(sections: Section[]): Block[] {
  const blocks: Block[] = [];
  
  for (const section of sections) {
    if (section.type === 'simple') {
      blocks.push(...section.slots.main);
    } else if (section.type === 'two-column') {
      blocks.push(...section.slots.left, ...section.slots.right);
    }
  }
  
  return blocks;
}

/**
 * Find a block by ID across all sections
 */
export function findBlockInSections(sections: Section[], blockId: string): Block | null {
  for (const section of sections) {
    if (section.type === 'simple') {
      const block = section.slots.main.find(b => b.id === blockId);
      if (block) return block;
    } else if (section.type === 'two-column') {
      const leftBlock = section.slots.left.find(b => b.id === blockId);
      if (leftBlock) return leftBlock;
      const rightBlock = section.slots.right.find(b => b.id === blockId);
      if (rightBlock) return rightBlock;
    }
  }
  return null;
}

/**
 * Find which section and slot contains a block
 */
export function findBlockLocation(sections: Section[], blockId: string): {
  sectionId: string;
  slot: 'main' | 'left' | 'right';
  index: number;
} | null {
  for (const section of sections) {
    if (section.type === 'simple') {
      const index = section.slots.main.findIndex(b => b.id === blockId);
      if (index !== -1) {
        return { sectionId: section.id, slot: 'main', index };
      }
    } else if (section.type === 'two-column') {
      const leftIndex = section.slots.left.findIndex(b => b.id === blockId);
      if (leftIndex !== -1) {
        return { sectionId: section.id, slot: 'left', index: leftIndex };
      }
      const rightIndex = section.slots.right.findIndex(b => b.id === blockId);
      if (rightIndex !== -1) {
        return { sectionId: section.id, slot: 'right', index: rightIndex };
      }
    }
  }
  return null;
}

