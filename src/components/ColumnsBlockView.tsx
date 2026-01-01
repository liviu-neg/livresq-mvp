import React from 'react';
import type { ColumnsBlock, Block, Resource } from '../types';
import { RowView } from './RowView';
import { isBlock } from '../utils/sections';

interface ColumnsBlockViewProps {
  block: ColumnsBlock;
  isSelected: boolean;
  isPreview: boolean;
  selectedBlockId: string | null;
  selectedCellId?: string | null;
  editingBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onSelectCell?: (cellId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: Block) => void;
  renderResource: (resource: Resource) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: Block[];
  showStructureStrokes?: boolean;
}

export function ColumnsBlockView({
  block,
  isSelected,
  isPreview,
  selectedBlockId,
  selectedCellId,
  editingBlockId,
  onSelectBlock,
  onSelectCell,
  onEditBlock,
  onUpdateBlock,
  renderResource,
  activeId,
  allBlocks,
  showStructureStrokes = false,
}: ColumnsBlockViewProps) {
  // Handler for updating blocks within the columns block
  const handleUpdateBlockInColumns = (updatedBlock: Block) => {
    // Find and update the block in the row's cells
    const updatedRow = {
      ...block.row,
      cells: block.row.cells.map((cell) => ({
        ...cell,
        resources: cell.resources.map((resource) => {
          if (isBlock(resource) && resource.id === updatedBlock.id) {
            return updatedBlock;
          }
          return resource;
        }),
      })),
    };
    onUpdateBlock({
      ...block,
      row: updatedRow,
    });
  };

  // Handler for deleting a cell (shouldn't happen in columns block, but handle it)
  const handleDeleteCell = () => {
    // Don't allow deleting cells in columns block
    // This maintains the column structure
  };

  // Handler for duplicating a cell (shouldn't happen in columns block, but handle it)
  const handleDuplicateCell = () => {
    // Don't allow duplicating cells in columns block
    // This maintains the column structure
  };

  // Render directly as RowView - no wrapper divs
  return (
    <RowView
      row={block.row}
      selectedBlockId={selectedBlockId}
      selectedCellId={selectedCellId}
      selectedRowId={null} // Don't allow row selection inside columns block
      editingBlockId={editingBlockId}
      isPreview={isPreview}
      onSelectBlock={onSelectBlock}
      onSelectCell={onSelectCell}
      onSelectRow={undefined} // Don't allow row selection
      onEditBlock={onEditBlock}
      onUpdateBlock={handleUpdateBlockInColumns}
      onDeleteCell={handleDeleteCell}
      onDuplicateCell={handleDuplicateCell}
      onDeleteRow={undefined} // Don't allow row deletion
      onDuplicateRow={undefined} // Don't allow row duplication
      onAddEmptyStateRow={undefined} // Don't allow adding empty state rows
      renderResource={renderResource}
      activeId={activeId}
      allBlocks={allBlocks}
      showStructureStrokes={showStructureStrokes}
    />
  );
}
