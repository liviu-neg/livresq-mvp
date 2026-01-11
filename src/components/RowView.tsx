import React, { useRef } from 'react';
import type { Row, Resource, Block, ThemeSpecificRowProps } from '../types';
import { isBlock, isConstructor } from '../utils/sections';
import { CellView } from './CellView';
import { RowToolbar } from './RowToolbar';
import { EmptyStateRow } from './EmptyStateRow';
import { useThemeSwitcher, useTheme } from '../theme/ThemeProvider';

// Helper function to convert hex color to rgba with opacity
function hexToRgba(hex: string, opacity: number = 1): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

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
  pageProps?: {
    themes?: {
      [key: string]: {
        maxRowWidth?: number;
      } | undefined;
    };
  };
}

// Helper function to get theme-specific row properties with fallback to legacy props and theme defaults
function getRowThemeProps(row: Row, themeId: string, theme: any): ThemeSpecificRowProps {
  // Try to get theme-specific props (works for 'plain', 'neon', and any custom theme ID)
  const themeProps = row.props?.themes?.[themeId];
  // Get theme defaults - use fallback only if rowBackground doesn't exist at all
  const defaultBackground = theme?.rowBackground ? {
    backgroundColor: theme.rowBackground.backgroundColor,
    backgroundColorOpacity: theme.rowBackground.backgroundColorOpacity ?? 1,
    backgroundImage: theme.rowBackground.backgroundImage,
    backgroundImageOpacity: theme.rowBackground.backgroundImageOpacity ?? 1,
  } : { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
  
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
    verticalAlign: row.props?.verticalAlign,
    padding: row.props?.padding,
    backgroundColor: row.props?.backgroundColor,
    backgroundColorOpacity: row.props?.backgroundColorOpacity,
    backgroundImage: row.props?.backgroundImage,
    backgroundImageOpacity: row.props?.backgroundImageOpacity,
    border: row.props?.border,
    borderRadius: row.props?.borderRadius,
  };
  
  // Always use theme defaults for background if not explicitly set in legacy props
  // This ensures new rows get the correct background from theme defaults
  return {
    ...legacyProps,
    backgroundColor: legacyProps.backgroundColor ?? defaultBackground.backgroundColor,
    backgroundColorOpacity: legacyProps.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1,
    backgroundImage: legacyProps.backgroundImage ?? defaultBackground.backgroundImage,
    backgroundImageOpacity: legacyProps.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1,
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
  pageProps = {},
}: RowViewProps) {
  const { themeId } = useThemeSwitcher();
  const theme = useTheme();
  // Get theme-specific properties with fallback to theme defaults
  const themeProps = getRowThemeProps(row, themeId, theme);
  
  // Extract shadow and bgBlur
  const shadow = themeProps.shadow;
  const bgBlur = themeProps.bgBlur ?? 0;
  
  // Helper to convert shadow object to CSS box-shadow string
  const getBoxShadow = (shadow: typeof themeProps.shadow): string => {
    if (!shadow) return '';
    const { x, y, blur, spread, color, opacity } = shadow;
    const rgbaColor = (() => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    })();
    const inset = shadow.position === 'inside' ? 'inset ' : '';
    return `${inset}${x}px ${y}px ${blur}px ${spread}px ${rgbaColor}`;
  };
  // Get max row width from page props (null = full width, 1024 = 1024px max width, undefined = default 1024)
  const maxRowWidth = pageProps?.themes?.[themeId]?.maxRowWidth;
  const isFullWidth = maxRowWidth === null;
  const effectiveMaxRowWidth = maxRowWidth ?? 1024; // Default 1024px if undefined
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
          style={{
            ...(shadow ? { boxShadow: getBoxShadow(shadow) } : {}),
            ...(bgBlur > 0 ? {
              backdropFilter: `blur(${bgBlur}px)`,
              WebkitBackdropFilter: `blur(${bgBlur}px)`,
            } : {}),
          }}
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
          ...(isFullWidth ? {
            width: '100%',
          } : {
            maxWidth: `${effectiveMaxRowWidth}px`,
            marginLeft: 'auto',
            marginRight: 'auto',
          }),
          ...(shadow ? { boxShadow: getBoxShadow(shadow) } : {}),
          ...(bgBlur > 0 ? {
            backdropFilter: `blur(${bgBlur}px)`,
            WebkitBackdropFilter: `blur(${bgBlur}px)`,
          } : {}),
        }}
      >
        {/* Row background layers - separate layers for color and image to allow independent opacity control */}
        {/* Background color layer (z-index: 0) */}
        {/* Always render background color layer if backgroundColor is defined (even if transparent) */}
        {/* If backgroundColor is undefined, don't render (transparent) */}
        {themeProps.backgroundColor && (
          <div 
            className="row-background-color-layer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: hexToRgba(themeProps.backgroundColor, themeProps.backgroundColorOpacity ?? 1),
              zIndex: 0, // Within row-view stacking context, above page background
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
              zIndex: 1, // Within row-view stacking context, above color layer
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

