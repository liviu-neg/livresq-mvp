import React, { useRef } from 'react';
import type { Row, Resource, Block } from '../types';
import { isBlock, isConstructor } from '../utils/sections';
import { CellView } from './CellView';
import { RowToolbar } from './RowToolbar';

interface RowViewProps {
  row: Row;
  selectedBlockId: string | null;
  selectedCellId?: string | null;
  selectedRowId?: string | null;
  editingBlockId: string | null;
  isPreview: boolean;
  onSelectBlock: (blockId: string | null) => void;
  onSelectCell?: (cellId: string | null) => void;
  onSelectRow?: (rowId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: Block) => void;
  onDeleteCell?: () => void;
  onDuplicateCell?: () => void;
  onDeleteRow?: () => void;
  onDuplicateRow?: () => void;
  renderResource: (resource: Resource) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: Block[];
  showStructureStrokes?: boolean;
}

export function RowView({
  row,
  selectedBlockId,
  selectedCellId,
  selectedRowId,
  editingBlockId,
  isPreview,
  onSelectBlock,
  onSelectCell,
  onSelectRow,
  onEditBlock,
  onUpdateBlock,
  onDeleteCell,
  onDuplicateCell,
  onDeleteRow,
  onDuplicateRow,
  renderResource,
  activeId,
  allBlocks,
  showStructureStrokes = false,
}: RowViewProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const rowCellsRef = useRef<HTMLDivElement>(null);
  // Row is only selected if selectedRowId matches AND no block/cell is selected
  const isSelected = selectedRowId === row.id && !selectedBlockId && !selectedCellId;

  const handleRowClick = (e: React.MouseEvent) => {
    // Only select row if clicking directly on the row container, not on nested content
    const target = e.target as HTMLElement;
    
    // Don't select if clicking on:
    // - Toolbars
    // - Block content (canvas-block, block-card-content, text-block-content, etc.)
    // - Editor content (ProseMirror, bubble-toolbar)
    // - Cell content (cell-view, cell-resources, resource-wrapper)
    // - Any interactive elements inside blocks
    // - If there's a text selection active
    if (
      target.closest('.row-toolbar') ||
      target.closest('.cell-toolbar') ||
      target.closest('.block-toolbar') ||
      target.closest('.bubble-toolbar') ||
      target.closest('.canvas-block') ||
      target.closest('.block-card-content') ||
      target.closest('.text-block-content') ||
      target.closest('.cell-view') ||
      target.closest('.cell-resources') ||
      target.closest('.resource-wrapper') ||
      target.closest('.ProseMirror') ||
      target.closest('.block-edit-field') ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      window.getSelection()?.toString().length > 0
    ) {
      return;
    }

    // Only select if clicking directly on:
    // 1. The row container itself (border area)
    // 2. The row-cells container (padding area, but not its children)
    const isRowContainer = target === rowRef.current;
    const isRowCells = target === rowCellsRef.current;
    
    // Also allow clicking on the padding area of row-cells (empty space between border and content)
    // Check if the click is within row-cells but not on any cell-view
    const isInRowCells = rowCellsRef.current?.contains(target);
    const isOnCellContent = target.closest('.cell-view');
    
    if ((isRowContainer || isRowCells || (isInRowCells && !isOnCellContent)) && onSelectRow) {
      onSelectRow(row.id);
      onSelectBlock(null); // Clear block selection when selecting row
      if (onSelectCell) onSelectCell(null); // Clear cell selection when selecting row
      e.stopPropagation();
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    // TODO: Implement row drag
    e.stopPropagation();
  };

  return (
    <>
      <div
        ref={rowRef}
        className={`row-view ${showStructureStrokes ? 'show-strokes' : ''} ${isSelected ? 'selected' : ''}`}
        data-row-id={row.id}
        onClick={handleRowClick}
      >
        <div ref={rowCellsRef} className="row-cells">
          {row.cells.map((cell) => (
            <CellView
              key={cell.id}
              cell={cell}
              selectedBlockId={selectedBlockId}
              selectedCellId={selectedCellId}
              editingBlockId={editingBlockId}
              isPreview={isPreview}
              onSelectBlock={(blockId) => {
                onSelectBlock(blockId);
                if (onSelectRow) onSelectRow(null); // Clear row selection when selecting block
              }}
              onSelectCell={(cellId) => {
                if (onSelectCell) onSelectCell(cellId);
                if (onSelectRow) onSelectRow(null); // Clear row selection when selecting cell
              }}
              onEditBlock={onEditBlock}
              onUpdateBlock={onUpdateBlock}
              onDeleteCell={onDeleteCell}
              onDuplicateCell={onDuplicateCell}
              renderResource={renderResource}
              activeId={activeId}
              allBlocks={allBlocks}
              showStructureStrokes={showStructureStrokes}
            />
          ))}
        </div>
      </div>
      {isSelected && 
       !isPreview && 
       !selectedBlockId && // Don't show row toolbar if a block is selected
       !selectedCellId && // Don't show row toolbar if a cell is selected
       !editingBlockId && // Don't show row toolbar if a block is being edited
       onDeleteRow && 
       onDuplicateRow && (
        <RowToolbar
          rowContainerRef={rowRef}
          onDelete={onDeleteRow}
          onDuplicate={onDuplicateRow}
          onDragStart={handleDragStart}
        />
      )}
    </>
  );
}

