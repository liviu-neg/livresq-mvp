import { nanoid } from 'nanoid';
import type { Block, SimpleSection, Section, Row, Cell, Resource, Constructor } from '../types';

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

/**
 * Row/Cell/Resource Model Functions
 */

/**
 * Check if a Resource is a Constructor (nested Row)
 */
export function isConstructor(resource: Resource): resource is Constructor {
  return 'cells' in resource && Array.isArray((resource as Constructor).cells);
}

/**
 * Check if a Resource is a Block
 */
export function isBlock(resource: Resource): resource is Block {
  return 'type' in resource && typeof (resource as Block).type === 'string';
}

/**
 * Migrate Sections to Rows
 * Each Section becomes a Row, each slot becomes a Cell
 */
export function migrateSectionsToRows(sections: Section[]): Row[] {
  return sections.map((section) => {
    if (section.type === 'simple') {
      // SimpleSection = Row with one Cell
      return {
        id: section.id,
        cells: [
          {
            id: nanoid(),
            resources: [...section.slots.main],
          },
        ],
        props: section.props,
      };
    } else {
      // TwoColumnSection = Row with two Cells
      return {
        id: section.id,
        cells: [
          {
            id: nanoid(),
            resources: [...section.slots.left],
          },
          {
            id: nanoid(),
            resources: [...section.slots.right],
          },
        ],
        props: section.props,
      };
    }
  });
}

/**
 * Migrate Rows to Sections (for backward compatibility)
 */
export function migrateRowsToSections(rows: Row[]): Section[] {
  return rows.map((row) => {
    if (row.cells.length === 1) {
      // Row with one Cell = SimpleSection
      return {
        id: row.id,
        type: 'simple' as const,
        slots: {
          main: row.cells[0].resources.filter(isBlock),
        },
        props: row.props,
      };
    } else if (row.cells.length === 2) {
      // Row with two Cells = TwoColumnSection
      return {
        id: row.id,
        type: 'two-column' as const,
        slots: {
          left: row.cells[0].resources.filter(isBlock),
          right: row.cells[1].resources.filter(isBlock),
        },
        props: row.props,
      };
    } else {
      // Row with multiple Cells - convert to SimpleSection with first cell
      // (fallback for now)
      return {
        id: row.id,
        type: 'simple' as const,
        slots: {
          main: row.cells[0].resources.filter(isBlock),
        },
        props: row.props,
      };
    }
  });
}

/**
 * Find a block by ID across all rows (including nested constructors)
 */
export function findBlockInRows(rows: Row[], blockId: string): Block | null {
  for (const row of rows) {
    for (const cell of row.cells) {
      for (const resource of cell.resources) {
        if (isBlock(resource) && resource.id === blockId) {
          return resource;
        }
        if (isConstructor(resource)) {
          // Recursively search nested constructors
          const found = findBlockInRows([resource], blockId);
          if (found) return found;
        }
      }
    }
  }
  return null;
}

/**
 * Find which row, cell, and index contains a resource (block or constructor)
 */
export function findResourceLocation(
  rows: Row[],
  resourceId: string
): {
  rowId: string;
  cellId: string;
  index: number;
} | null {
  for (const row of rows) {
    for (const cell of row.cells) {
      const index = cell.resources.findIndex((r) => {
        if (isBlock(r)) {
          return r.id === resourceId;
        }
        if (isConstructor(r)) {
          return r.id === resourceId;
        }
        return false;
      });
      if (index !== -1) {
        return { rowId: row.id, cellId: cell.id, index };
      }
    }
  }
  return null;
}

/**
 * Find which row, cell, and index contains a block
 */
export function findBlockLocationInRows(
  rows: Row[],
  blockId: string
): {
  rowId: string;
  cellId: string;
  index: number;
} | null {
  for (const row of rows) {
    for (const cell of row.cells) {
      const index = cell.resources.findIndex(
        (r) => isBlock(r) && r.id === blockId
      );
      if (index !== -1) {
        return { rowId: row.id, cellId: cell.id, index };
      }
      // Also check nested constructors
      for (const resource of cell.resources) {
        if (isConstructor(resource)) {
          const nested = findBlockLocationInRows([resource], blockId);
          if (nested) {
            return nested;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Create a new Row with one empty Cell
 */
export function createNewRow(): Row {
  return {
    id: nanoid(),
    cells: [
      {
        id: nanoid(),
        resources: [],
      },
    ],
  };
}

/**
 * Create a new Row with multiple empty Cells (constructor)
 */
export function createNewConstructor(cellCount: number = 2): Row {
  return {
    id: nanoid(),
    cells: Array.from({ length: cellCount }, () => ({
      id: nanoid(),
      resources: [],
    })),
  };
}

