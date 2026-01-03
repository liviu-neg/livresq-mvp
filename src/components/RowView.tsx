import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Row, Resource, Block } from '../types';
import { isBlock, isConstructor } from '../utils/sections';
import { CellView } from './CellView';
import { RowToolbar } from './RowToolbar';
import { EmptyStateRow } from './EmptyStateRow';

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
  onAddEmptyStateRow?: () => void;
  renderResource: (resource: Resource) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: Block[];
  showStructureStrokes?: boolean;
  isRowDragging?: boolean; // Whether row dragging is enabled
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
  onAddEmptyStateRow,
  renderResource,
  activeId,
  allBlocks,
  showStructureStrokes = false,
  isRowDragging = false,
}: RowViewProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const rowCellsRef = useRef<HTMLDivElement>(null);
  const allowDragRef = useRef(false);
  // Row is only selected if selectedRowId matches AND no block/cell is selected
  const isSelected = selectedRowId === row.id && !selectedBlockId && !selectedCellId;

  // Make row draggable (always enabled, but only triggered by button)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `row:${row.id}`,
    disabled: isPreview, // Only disable in preview mode
    data: {
      type: 'row',
      rowId: row.id,
    },
  });

  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Create custom listeners that check if drag is allowed
  const customListeners = React.useMemo(() => {
    if (!listeners) return {};
    
    const originalOnMouseDown = listeners.onMouseDown;
    
    return {
      ...listeners,
      onMouseDown: (e: React.MouseEvent) => {
        // Check both the ref flag and data attribute
        const allowDrag = allowDragRef.current || 
          (e.currentTarget as HTMLElement)?.getAttribute('data-allow-drag') === 'true';
        
        // Only allow drag if flag is set (button was pressed)
        if (!allowDrag) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        // Reset flag and attribute
        allowDragRef.current = false;
        if (e.currentTarget) {
          (e.currentTarget as HTMLElement).removeAttribute('data-allow-drag');
        }
        // Call original listener
        if (originalOnMouseDown) {
          originalOnMouseDown(e as any);
        }
      },
    };
  }, [listeners]);

  const handleRowClick = (e: React.MouseEvent) => {
    // Only select row if clicking directly on the row container, not on nested content
    const target = e.target as HTMLElement;
    
    // For empty state rows, allow clicking on empty state content to select the row
    if (row.isEmptyState) {
      // Don't select if clicking on toolbars
      if (
        target.closest('.row-toolbar') ||
        target.closest('.cell-toolbar') ||
        target.closest('.block-toolbar') ||
        target.closest('.bubble-toolbar')
      ) {
        return;
      }
      
      // Allow clicking on empty state content (buttons, text, etc.) to select the row
      if (target.closest('.empty-state-row') || target.closest('.empty-state-row-content') || target.closest('.empty-state-row-button')) {
        if (onSelectRow) {
          onSelectRow(row.id);
          onSelectBlock(null);
          if (onSelectCell) onSelectCell(null);
          e.stopPropagation();
        }
        return;
      }
    }
    
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
    // Set flag to allow drag
    allowDragRef.current = true;
    // Also set a data attribute on the row element as a backup
    if (rowRef.current) {
      rowRef.current.setAttribute('data-allow-drag', 'true');
    }
    // Use setTimeout to trigger the drag after a brief moment
    // This ensures the flag is set before the drag starts
    setTimeout(() => {
      if (rowRef.current && listeners?.onMouseDown) {
        // Create a proper mouse event that dnd-kit can handle
        const rect = rowRef.current.getBoundingClientRect();
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 1,
          screenX: e.clientX + window.screenX,
          screenY: e.clientY + window.screenY,
          clientX: e.clientX,
          clientY: e.clientY,
          button: 0,
          buttons: 1,
        });
        rowRef.current.dispatchEvent(mouseEvent);
      }
    }, 10);
  };

  // If this is an empty state row, render it with cell structure but show empty state content
  if (row.isEmptyState) {
    return (
      <>
        <div
          ref={(node) => {
            setNodeRef(node);
            if (rowRef.current !== node) {
              rowRef.current = node;
            }
          }}
          style={rowStyle}
          className={`row-view empty-state-row-view ${showStructureStrokes ? 'show-strokes' : ''} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
          data-row-id={row.id}
          onClick={handleRowClick}
          {...attributes}
          {...customListeners}
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
                isEmptyStateRow={true}
                rowId={row.id}
                isColumnsBlock={row.props?.isColumnsBlock === true}
              />
            ))}
          </div>
        </div>
        {isSelected && 
         !isPreview && 
         !selectedBlockId && 
         !selectedCellId && 
         !editingBlockId && 
         onDeleteRow && (
          <RowToolbar
            rowContainerRef={rowRef}
            onDelete={onDeleteRow}
            onDuplicate={() => {}} // Empty function for empty state rows
            onDragStart={handleDragStart}
            isEmptyState={true}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={(node) => {
          setNodeRef(node);
          if (rowRef.current !== node) {
            rowRef.current = node;
          }
        }}
        style={{
          ...rowStyle,
          ...(row.props?.isColumnsBlock ? {
            '--column-gap': `${row.props.columnGap || 16}px`,
            '--column-count': row.props.columns || 2,
          } as React.CSSProperties : {}),
        }}
        className={`row-view ${showStructureStrokes ? 'show-strokes' : ''} ${isSelected ? 'selected' : ''} ${row.props?.isColumnsBlock ? 'columns-block-row' : ''} ${isDragging ? 'dragging' : ''}`}
        data-row-id={row.id}
        onClick={handleRowClick}
        {...attributes}
        {...customListeners}
      >
        <div ref={rowCellsRef} className={`row-cells ${row.props?.isColumnsBlock ? 'columns-block-cells' : ''}`}>
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
              rowId={row.id}
              isColumnsBlock={row.props?.isColumnsBlock === true}
            />
          ))}
        </div>
        {/* Add section button - shown at bottom of selected row */}
        {isSelected && 
         !isPreview && 
         !selectedBlockId && 
         !selectedCellId && 
         !editingBlockId && 
         onAddEmptyStateRow && 
         !(row.props?.isColumnsBlock === true && row.cells.every(cell => cell.resources.length === 0)) && (
          <button
            type="button"
            className="row-add-section-button"
            onClick={(e) => {
              e.stopPropagation();
              onAddEmptyStateRow();
            }}
            aria-label="Add section"
          >
            add section
          </button>
        )}
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
          isEmptyColumnsBlock={row.props?.isColumnsBlock === true && row.cells.every(cell => cell.resources.length === 0)}
        />
      )}
    </>
  );
}

