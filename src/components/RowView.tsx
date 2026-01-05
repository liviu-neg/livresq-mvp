import React, { useRef } from 'react';
import type { Row, Resource, Block, ThemeSpecificRowProps } from '../types';
import { isBlock, isConstructor } from '../utils/sections';
import { CellView } from './CellView';
import { RowToolbar } from './RowToolbar';
import { EmptyStateRow } from './EmptyStateRow';
import { useThemeSwitcher } from '../theme/ThemeProvider';

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
  onEditCell?: () => void; // Open properties panel for cell
  onDeleteRow?: () => void;
  onDuplicateRow?: () => void;
  onEditRow?: () => void; // Open properties panel for row
  onAddEmptyStateRow?: () => void;
  renderResource: (resource: Resource) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: Block[];
  showStructureStrokes?: boolean;
}

// Helper function to get theme-specific row properties with fallback to legacy props
function getRowThemeProps(row: Row, themeId: 'plain' | 'neon'): ThemeSpecificRowProps {
  const themeProps = row.props?.themes?.[themeId];
  // If theme-specific props exist, use them; otherwise fall back to legacy props
  if (themeProps) {
    return themeProps;
  }
  // Fallback to legacy props for backward compatibility
  return {
    verticalAlign: row.props?.verticalAlign,
    padding: row.props?.padding,
    backgroundColor: row.props?.backgroundColor,
    backgroundColorOpacity: row.props?.backgroundColorOpacity,
    backgroundImage: row.props?.backgroundImage,
    backgroundImageOpacity: row.props?.backgroundImageOpacity,
    border: row.props?.border,
  };
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
  onEditCell,
  onDeleteRow,
  onDuplicateRow,
  onEditRow,
  onAddEmptyStateRow,
  renderResource,
  activeId,
  allBlocks,
  showStructureStrokes = false,
}: RowViewProps) {
  const { themeId } = useThemeSwitcher();
  // Get theme-specific properties
  const themeProps = getRowThemeProps(row, themeId);
  const rowRef = useRef<HTMLDivElement>(null);
  const rowCellsRef = useRef<HTMLDivElement>(null);
  // Row is only selected if selectedRowId matches AND no block/cell is selected
  const isSelected = selectedRowId === row.id && !selectedBlockId && !selectedCellId;

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
    // TODO: Implement row drag
    e.stopPropagation();
  };

  // If this is an empty state row, render it with cell structure but show empty state content
  if (row.isEmptyState) {
    return (
      <>
        <div
          ref={rowRef}
          className={`row-view empty-state-row-view ${showStructureStrokes ? 'show-strokes' : ''} ${isSelected ? 'selected' : ''}`}
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
        ref={rowRef}
        className={`row-view ${showStructureStrokes ? 'show-strokes' : ''} ${isSelected ? 'selected' : ''} ${row.props?.isColumnsBlock ? 'columns-block-row' : ''}`}
        data-row-id={row.id}
        onClick={handleRowClick}
        style={{
          ...(row.props?.isColumnsBlock ? {
            '--column-gap': `${row.props.columnGap || 16}px`,
            '--column-count': row.props.columns || 2,
          } as React.CSSProperties : {}),
          position: 'relative',
        }}
      >
        {/* Row background layers - separate layers for color and image to allow independent opacity control */}
        {/* Background color layer (z-index: 0) */}
        {themeProps.backgroundColor && (
          <div 
            className="row-background-color-layer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: themeProps.backgroundColor,
              opacity: themeProps.backgroundColorOpacity ?? 1,
              zIndex: 0,
              pointerEvents: 'none',
              borderRadius: themeProps.borderRadius?.mode === 'uniform' && themeProps.borderRadius.uniform !== undefined
                ? `${themeProps.borderRadius.uniform}px`
                : themeProps.borderRadius?.mode === 'individual'
                ? `${themeProps.borderRadius.topLeft || 0}px ${themeProps.borderRadius.topRight || 0}px ${themeProps.borderRadius.bottomRight || 0}px ${themeProps.borderRadius.bottomLeft || 0}px`
                : undefined,
            }}
          />
        )}
        {/* Background image layer (z-index: 1, above color layer) */}
        {themeProps.backgroundImage && (
          <div 
            className="row-background-image-layer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${themeProps.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: themeProps.backgroundImageOpacity ?? 1,
              zIndex: 1,
              pointerEvents: 'none',
              borderRadius: themeProps.borderRadius?.mode === 'uniform' && themeProps.borderRadius.uniform !== undefined
                ? `${themeProps.borderRadius.uniform}px`
                : themeProps.borderRadius?.mode === 'individual'
                ? `${themeProps.borderRadius.topLeft || 0}px ${themeProps.borderRadius.topRight || 0}px ${themeProps.borderRadius.bottomRight || 0}px ${themeProps.borderRadius.bottomLeft || 0}px`
                : undefined,
            }}
          />
        )}
        {/* Row cells container - applies padding and vertical alignment from row props */}
        {/* z-index: 2 ensures content appears above background layers */}
        <div 
          ref={rowCellsRef} 
          className={`row-cells ${row.props?.isColumnsBlock ? 'columns-block-cells' : ''}`}
          data-vertical-align={themeProps.verticalAlign || 'top'}
          style={{
            ...(themeProps.border?.color && themeProps.border.width ? (
              themeProps.border.width.mode === 'uniform' && themeProps.border.width.uniform && themeProps.border.width.uniform > 0 ? {
                border: `${themeProps.border.width.uniform}px ${themeProps.border.style || 'solid'} ${themeProps.border.color}`,
                boxSizing: 'border-box',
              } : themeProps.border.width.mode === 'individual' && (
                (themeProps.border.width.top && themeProps.border.width.top > 0) ||
                (themeProps.border.width.right && themeProps.border.width.right > 0) ||
                (themeProps.border.width.bottom && themeProps.border.width.bottom > 0) ||
                (themeProps.border.width.left && themeProps.border.width.left > 0)
              ) ? {
                borderTop: themeProps.border.width.top ? `${themeProps.border.width.top}px ${themeProps.border.style || 'solid'} ${themeProps.border.color}` : 'none',
                borderRight: themeProps.border.width.right ? `${themeProps.border.width.right}px ${themeProps.border.style || 'solid'} ${themeProps.border.color}` : 'none',
                borderBottom: themeProps.border.width.bottom ? `${themeProps.border.width.bottom}px ${themeProps.border.style || 'solid'} ${themeProps.border.color}` : 'none',
                borderLeft: themeProps.border.width.left ? `${themeProps.border.width.left}px ${themeProps.border.style || 'solid'} ${themeProps.border.color}` : 'none',
                boxSizing: 'border-box',
              } : {}
            ) : {}),
            padding: themeProps.padding?.mode === 'uniform' 
              ? `${themeProps.padding.uniform || 0}px`
              : themeProps.padding?.mode === 'individual'
              ? `${themeProps.padding.top || 0}px ${themeProps.padding.right || 0}px ${themeProps.padding.bottom || 0}px ${themeProps.padding.left || 0}px`
              : undefined,
            borderRadius: themeProps.borderRadius?.mode === 'uniform' && themeProps.borderRadius.uniform !== undefined
              ? `${themeProps.borderRadius.uniform}px`
              : themeProps.borderRadius?.mode === 'individual'
              ? `${themeProps.borderRadius.topLeft || 0}px ${themeProps.borderRadius.topRight || 0}px ${themeProps.borderRadius.bottomRight || 0}px ${themeProps.borderRadius.bottomLeft || 0}px`
              : undefined,
            position: 'relative',
            zIndex: 2,
          }}
        >
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
              onEditCell={onEditCell}
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
            onEdit={onEditRow}
            isEmptyColumnsBlock={row.props?.isColumnsBlock === true && row.cells.every(cell => cell.resources.length === 0)}
          />
      )}
    </>
  );
}

