import React, { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Cell, Resource, Block } from '../types';
import { isBlock, isConstructor } from '../utils/sections';
import { RowView } from './RowView';
import { CellToolbar } from './CellToolbar';
import { EmptyStateRow } from './EmptyStateRow';

interface CellViewProps {
  cell: Cell;
  selectedBlockId: string | null;
  selectedCellId?: string | null;
  editingBlockId: string | null;
  isPreview: boolean;
  onSelectBlock: (blockId: string | null) => void;
  onSelectCell?: (cellId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: Block) => void;
  onDeleteCell?: () => void;
  onDuplicateCell?: () => void;
  renderResource: (resource: Resource) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: Block[];
  showStructureStrokes?: boolean;
  isEmptyStateRow?: boolean; // True if this cell is in an empty state row
  rowId?: string; // Row ID for empty state row
  isColumnsBlock?: boolean; // True if this cell is in a columns block row
}

export function CellView({
  cell,
  selectedBlockId,
  selectedCellId,
  editingBlockId,
  isPreview,
  onSelectBlock,
  onSelectCell,
  onEditBlock,
  onUpdateBlock,
  onDeleteCell,
  onDuplicateCell,
  renderResource,
  activeId,
  allBlocks,
  showStructureStrokes = false,
  isEmptyStateRow = false,
  rowId,
  isColumnsBlock = false,
}: CellViewProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  const cellResourcesRef = useRef<HTMLDivElement>(null);
  const isSelected = selectedCellId === cell.id;

  // Make cell droppable so blocks can be dropped into it
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `cell:${cell.id}`,
    data: {
      type: 'cell',
      cellId: cell.id,
      rowId: rowId,
    },
  });

  // Combine refs - use droppable ref as primary, also set cellRef
  const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
    setDroppableRef(node);
    if (cellRef.current !== node) {
      cellRef.current = node;
    }
  }, [setDroppableRef]);

  const handleCellClick = (e: React.MouseEvent) => {
    // Don't allow cell selection if it's in an empty state row
    if (isEmptyStateRow) {
      return;
    }
    
    // Only select cell if clicking directly on the cell container padding/border area, not on nested content
    const target = e.target as HTMLElement;
    
    // Don't select if clicking on:
    // - Toolbars
    // - Block content (canvas-block, block-card-content, text-block-content, etc.)
    // - Editor content (ProseMirror, bubble-toolbar)
    // - Resource wrappers (actual block content)
    // - Any interactive elements inside blocks
    // - If there's a text selection active
    if (
      target.closest('.cell-toolbar') ||
      target.closest('.block-toolbar') ||
      target.closest('.bubble-toolbar') ||
      target.closest('.canvas-block') ||
      target.closest('.block-card-content') ||
      target.closest('.text-block-content') ||
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
    // 1. The cell container itself (border area)
    // 2. The cell-resources container (padding area, but not its children)
    const isCellContainer = target === cellRef.current;
    const isCellResources = target === cellResourcesRef.current;
    
    // Also allow clicking on the padding area of cell-resources (empty space between border and content)
    // Check if the click is within cell-resources but not on any resource-wrapper
    const isInCellResources = cellResourcesRef.current?.contains(target);
    const isOnResourceContent = target.closest('.resource-wrapper');
    
    if ((isCellContainer || isCellResources || (isInCellResources && !isOnResourceContent)) && onSelectCell) {
      onSelectCell(cell.id);
      onSelectBlock(null); // Clear block selection when selecting cell
      // Note: Row selection clearing should be handled by RowView
      e.stopPropagation();
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    // TODO: Implement cell drag
    e.stopPropagation();
  };

  return (
    <>
      <div
        ref={combinedRef}
        className={`cell-view ${isEmptyStateRow ? 'empty-state-cell' : ''} ${showStructureStrokes && !isEmptyStateRow ? 'show-strokes' : ''} ${isSelected ? 'selected' : ''} ${isOver ? 'drag-over' : ''}`}
        data-cell-id={cell.id}
        onClick={handleCellClick}
      >
        <div ref={cellResourcesRef} className="cell-resources">
          {cell.resources.length === 0 && isEmptyStateRow && rowId ? (
            // Show empty state UI when cell is empty and it's an empty state row
            <EmptyStateRow rowId={rowId} />
          ) : cell.resources.length === 0 && isColumnsBlock ? (
            // Show placeholder text for empty cells in columns blocks
            <div className="columns-block-empty-placeholder">
              Drag and drop content here
            </div>
          ) : cell.resources.length === 0 && !isEmptyStateRow && !isColumnsBlock ? (
            // Show placeholder text for empty regular cells (after block is removed)
            <div className="cell-empty-placeholder">
              Drag and drop content here
            </div>
          ) : (
            cell.resources.map((resource) => {
              if (isBlock(resource)) {
                const isColumnsBlock = resource.type === 'columns';
                return (
                  <div key={resource.id} className={`resource-wrapper ${isColumnsBlock ? 'resource-wrapper-columns' : ''}`}>
                    {renderResource(resource)}
                  </div>
                );
              } else if (isConstructor(resource)) {
                // Nested constructor (Row inside a Cell)
                return (
                  <div key={resource.id} className="resource-wrapper resource-constructor">
                    <RowView
                      row={resource}
                      selectedBlockId={selectedBlockId}
                      selectedCellId={selectedCellId}
                      editingBlockId={editingBlockId}
                      isPreview={isPreview}
                      onSelectBlock={onSelectBlock}
                      onSelectCell={onSelectCell}
                      onEditBlock={onEditBlock}
                      onUpdateBlock={onUpdateBlock}
                      onDeleteCell={onDeleteCell}
                      onDuplicateCell={onDuplicateCell}
                      renderResource={renderResource}
                      activeId={activeId}
                      allBlocks={allBlocks}
                      showStructureStrokes={showStructureStrokes}
                    />
                  </div>
                );
              }
              return null;
            })
          )}
        </div>
      </div>
      {isSelected && 
       !isPreview && 
       !selectedBlockId && // Don't show cell toolbar if a block is selected
       !editingBlockId && // Don't show cell toolbar if a block is being edited
       onDeleteCell && 
       onDuplicateCell && (
        <CellToolbar
          cellContainerRef={cellRef as React.RefObject<HTMLElement>}
          onDelete={onDeleteCell}
          onDuplicate={onDuplicateCell}
          onDragStart={handleDragStart}
        />
      )}
    </>
  );
}

