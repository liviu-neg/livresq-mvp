import React, { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Cell, Resource, Block, ThemeSpecificCellProps } from '../types';
import { isBlock, isConstructor } from '../utils/sections';
import { RowView } from './RowView';
import { CellToolbar } from './CellToolbar';
import { EmptyStateRow } from './EmptyStateRow';
import { useThemeSwitcher, useTheme } from '../theme/ThemeProvider';

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
  onEditCell?: () => void; // Open properties panel for cell
  renderResource: (resource: Resource) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: Block[];
  showStructureStrokes?: boolean;
  isEmptyStateRow?: boolean; // True if this cell is in an empty state row
  rowId?: string; // Row ID for empty state row
  isColumnsBlock?: boolean; // True if this cell is in a columns block row
}

// Helper function to get theme-specific cell properties with fallback to legacy props and theme defaults
function getCellThemeProps(cell: Cell, themeId: string, theme: any): ThemeSpecificCellProps {
  // Try to get theme-specific props (works for 'plain', 'neon', and any custom theme ID)
  const themeProps = cell.props?.themes?.[themeId];
  const defaultBackground = theme?.cellBackground || { backgroundColor: undefined, backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
  
  // If theme-specific props exist, merge with theme defaults for missing background properties
  if (themeProps) {
    return {
      ...themeProps,
      // Use theme defaults if background properties are not set in theme-specific props
      backgroundColor: themeProps.backgroundColor ?? defaultBackground.backgroundColor,
      backgroundColorOpacity: themeProps.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1,
      backgroundImage: themeProps.backgroundImage ?? defaultBackground.backgroundImage,
      backgroundImageOpacity: themeProps.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1,
    };
  }
  
  // Fallback to legacy props for backward compatibility
  const legacyProps = {
    verticalAlign: cell.props?.verticalAlign,
    padding: cell.props?.padding,
    backgroundColor: cell.props?.backgroundColor,
    backgroundColorOpacity: cell.props?.backgroundColorOpacity,
    backgroundImage: cell.props?.backgroundImage,
    backgroundImageOpacity: cell.props?.backgroundImageOpacity,
    border: cell.props?.border,
    borderRadius: cell.props?.borderRadius,
  };
  
  // If no custom background is set, use theme defaults
  if (!legacyProps.backgroundColor && !legacyProps.backgroundImage) {
    return {
      ...legacyProps,
      backgroundColor: defaultBackground.backgroundColor,
      backgroundColorOpacity: defaultBackground.backgroundColorOpacity,
      backgroundImage: defaultBackground.backgroundImage,
      backgroundImageOpacity: defaultBackground.backgroundImageOpacity,
    };
  }
  
  return legacyProps;
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
  onEditCell,
  renderResource,
  activeId,
  allBlocks,
  showStructureStrokes = false,
  isEmptyStateRow = false,
  rowId,
  isColumnsBlock = false,
}: CellViewProps) {
  const { themeId } = useThemeSwitcher();
  const theme = useTheme();
  // Get theme-specific properties with fallback to theme defaults
  const themeProps = getCellThemeProps(cell, themeId, theme);
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
        style={{
          position: 'relative',
        }}
      >
        {/* Background color layer - applies border radius to match cell-resources border radius */}
        {/* Don't show theme background for empty cells (columns blocks or regular cells) - they use UI-based #FCEBD0 background */}
        {themeProps.backgroundColor && !((isColumnsBlock && cell.resources.length === 0) || (!isColumnsBlock && !isEmptyStateRow && cell.resources.length === 0)) && (
          <div 
            className="cell-background-color-layer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: themeProps.backgroundColor,
              opacity: themeProps.backgroundColorOpacity !== undefined ? themeProps.backgroundColorOpacity : 1,
              zIndex: 0,
              pointerEvents: 'none',
              // Apply border radius to background color layer to create rounded rectangle effect
              borderRadius: themeProps.borderRadius?.mode === 'uniform' && themeProps.borderRadius.uniform !== undefined
                ? `${themeProps.borderRadius.uniform}px`
                : themeProps.borderRadius?.mode === 'individual'
                ? `${themeProps.borderRadius.topLeft || 0}px ${themeProps.borderRadius.topRight || 0}px ${themeProps.borderRadius.bottomRight || 0}px ${themeProps.borderRadius.bottomLeft || 0}px`
                : undefined,
            }}
          />
        )}
        {/* Background image layer - applies border radius to match cell-resources border radius */}
        {/* Don't show theme background for empty cells (columns blocks or regular cells) - they use UI-based #FCEBD0 background */}
        {themeProps.backgroundImage && !((isColumnsBlock && cell.resources.length === 0) || (!isColumnsBlock && !isEmptyStateRow && cell.resources.length === 0)) && (
          <div 
            className="cell-background-image-layer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${themeProps.backgroundImage})`,
              backgroundSize: themeProps.backgroundImageType === 'fit' ? 'contain' : themeProps.backgroundImageType === 'stretch' ? '100% 100%' : 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: themeProps.backgroundImageOpacity !== undefined ? themeProps.backgroundImageOpacity : 1,
              zIndex: 1,
              pointerEvents: 'none',
              // Apply border radius to background image layer to create rounded rectangle effect
              borderRadius: themeProps.borderRadius?.mode === 'uniform' && themeProps.borderRadius.uniform !== undefined
                ? `${themeProps.borderRadius.uniform}px`
                : themeProps.borderRadius?.mode === 'individual'
                ? `${themeProps.borderRadius.topLeft || 0}px ${themeProps.borderRadius.topRight || 0}px ${themeProps.borderRadius.bottomRight || 0}px ${themeProps.borderRadius.bottomLeft || 0}px`
                : undefined,
            }}
          />
        )}
        <div 
          ref={cellResourcesRef} 
          className="cell-resources"
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
            // For empty cells (columns blocks or regular cells), don't set transparent background - let CSS #FCEBD0 show through
            // For other cells, set transparent so theme backgrounds show through
            backgroundColor: ((isColumnsBlock && cell.resources.length === 0) || (!isColumnsBlock && !isEmptyStateRow && cell.resources.length === 0)) ? undefined : 'transparent',
          }}
        >
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
          onEdit={onEditCell}
        />
      )}
    </>
  );
}

