import type { Row, Cell, Resource, Block, Section } from '../types';
import { createRow, createCell, createResource } from '../types';

/**
 * Find a block within rows (including nested blocks inside columns)
 */
export function findBlockInRows(rows: Row[], blockId: string): Block | null {
  // Helper function to recursively search for a block
  const searchInBlock = (block: Block): Block | null => {
    if (block.id === blockId) {
      return block;
    }
    
    // If it's a columns block, search in its children
    if (block.type === 'columns') {
      for (const columnBlocks of block.children || []) {
        for (const childBlock of columnBlocks) {
          const found = searchInBlock(childBlock);
          if (found) return found;
        }
      }
    }
    
    return null;
  };
  
  for (const row of rows) {
    for (const cell of row.cells) {
      for (const block of cell.resource.blocks) {
        const found = searchInBlock(block);
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * Find the location of a block within rows
 */
export function findBlockLocationInRows(
  rows: Row[],
  blockId: string
): { rowId: string; cellId: string; resourceId: string; index: number } | null {
  for (const row of rows) {
    for (const cell of row.cells) {
      const index = cell.resource.blocks.findIndex(b => b.id === blockId);
      if (index !== -1) {
        return {
          rowId: row.id,
          cellId: cell.id,
          resourceId: cell.resource.id,
          index,
        };
      }
    }
  }
  return null;
}

/**
 * Find a cell by ID
 */
export function findCellInRows(rows: Row[], cellId: string): { row: Row; cell: Cell; cellIndex: number } | null {
  for (const row of rows) {
    const cellIndex = row.cells.findIndex(c => c.id === cellId);
    if (cellIndex !== -1) {
      return { row, cell: row.cells[cellIndex], cellIndex };
    }
  }
  return null;
}

/**
 * Migrate sections to rows (for backward compatibility)
 */
export function migrateSectionsToRows(sections: Section[]): Row[] {
  const rows: Row[] = [];
  
  for (const section of sections) {
    if (section.type === 'simple') {
      // Create a row with one cell containing all blocks
      const resource = createResource(section.slots.main);
      const cell = createCell(resource);
      const row = createRow([cell]);
      rows.push(row);
    } else if (section.type === 'two-column') {
      // Create a row with two cells
      const leftResource = createResource(section.slots.left);
      const rightResource = createResource(section.slots.right);
      const leftCell = createCell(leftResource);
      const rightCell = createCell(rightResource);
      const row = createRow([leftCell, rightCell]);
      rows.push(row);
    }
  }
  
  return rows;
}

/**
 * Extract all blocks from rows
 */
export function extractBlocksFromRows(rows: Row[]): Block[] {
  const blocks: Block[] = [];
  for (const row of rows) {
    for (const cell of row.cells) {
      blocks.push(...cell.resource.blocks);
    }
  }
  return blocks;
}

