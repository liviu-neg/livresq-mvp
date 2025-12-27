import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { createPortal } from 'react-dom';
import type { ColumnsBlock, Block } from '../types';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';
import { TextBlockToolbar } from './TextBlockToolbar';

interface ColumnsBlockViewProps {
  block: ColumnsBlock;
  isPreview: boolean;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: Block) => void;
  onUpdateColumnsBlock: (updates: Partial<ColumnsBlock>) => void;
  activeId?: string | null;
  onDeleteBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onMoveBlock?: (blockId: string) => void;
  onGenerateWithAI?: (blockId: string) => void;
  isPropertiesPanelVisible?: boolean;
}

interface ColumnBlockItemProps {
  block: Block;
  columnIndex: number;
  columnsBlockId: string;
  isSelected: boolean;
  isEditing: boolean;
  isPreview: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onEditBlock?: (blockId: string) => void;
  onUpdateBlock: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onMoveBlock?: (blockId: string) => void;
  onGenerateWithAI?: (blockId: string) => void;
  isPropertiesPanelVisible?: boolean;
}

function ColumnBlockItem({
  block,
  columnIndex,
  columnsBlockId,
  isSelected,
  isEditing,
  isPreview,
  onSelect,
  onEdit,
  onEditBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onGenerateWithAI,
  isPropertiesPanelVisible = true,
}: ColumnBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: block.id,
    data: {
      containerId: `columns:${columnsBlockId}:col:${columnIndex}`,
      block,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdate = (updates: Partial<Block>) => {
    onUpdateBlock({ ...block, ...updates });
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'text':
      case 'header':
        return (
          <TextBlockView
            block={block}
            isSelected={isSelected}
            isEditing={isEditing}
            isPreview={isPreview}
            onUpdate={handleUpdate}
          />
        );
      case 'image':
        return (
          <ImageBlockView
            block={block}
            isSelected={isEditing}
            isPreview={isPreview}
            onUpdate={handleUpdate}
          />
        );
      case 'quiz':
        return (
          <QuizBlockView
            block={block}
            isSelected={isSelected}
            isPreview={isPreview}
            onUpdate={handleUpdate}
          />
        );
      default:
        return null;
    }
  };

  const handleBlockClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.closest('.block-edit-field') ||
      target.closest('.ProseMirror') ||
      target.closest('.bubble-toolbar')
    ) {
      return;
    }
    e.stopPropagation();
    onSelect();
  };

  const handleBlockDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.closest('.block-edit-field') ||
      target.closest('.ProseMirror') ||
      target.closest('.bubble-toolbar')
    ) {
      return;
    }
    e.stopPropagation();
    
    // For image blocks, use onEditBlock to open the image modal
    if (block.type === 'image' && onEditBlock) {
      onEditBlock(block.id);
    } else {
      onEdit();
    }
  };

  const isTextBlock = block.type === 'text' || block.type === 'header';
  const isImageBlock = block.type === 'image';
  const isQuizBlock = block.type === 'quiz';
  const isToolbarBlock = isTextBlock || isImageBlock || isQuizBlock; // Blocks that show the toolbar
  const cardDragListeners = (isSelected && !isEditing && !isPreview) ? {
    ...attributes,
    ...listeners,
  } : {};

  const blockRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // Position toolbar above the block - stable positioning with transform
  // Returns true if position was successfully applied, false otherwise
  const updateToolbarPosition = React.useCallback(() => {
    if (isSelected && isToolbarBlock && !isPreview && !isEditing && !isDragging && toolbarRef.current && blockRef.current) {
      const blockRect = blockRef.current.getBoundingClientRect();
      const toolbar = toolbarRef.current;
      
      // Check if block is visible in viewport
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Hide toolbar if block is completely out of viewport
      const isBlockVisible = (
        blockRect.bottom >= 0 &&
        blockRect.top <= viewportHeight &&
        blockRect.right >= 0 &&
        blockRect.left <= viewportWidth
      );
      
      if (!isBlockVisible) {
        // Block is out of view, hide toolbar
        toolbar.style.cssText = `
          position: fixed !important;
          top: -9999px !important;
          left: -9999px !important;
          transform: translate(-9999px, -9999px) !important;
          visibility: hidden !important;
          opacity: 0 !important;
          display: block !important;
          transition: none !important;
          animation: none !important;
        `;
        isToolbarPositionedRef.current = false;
        return false;
      }
      
      // CRITICAL: Keep toolbar completely hidden and off-screen during measurement
      toolbar.style.cssText = `
        position: fixed !important;
        top: -9999px !important;
        left: -9999px !important;
        transform: translate(-9999px, -9999px) !important;
        visibility: hidden !important;
        opacity: 0 !important;
        display: block !important;
        pointer-events: none !important;
        transition: none !important;
        animation: none !important;
      `;
      
      // Force reflow to ensure hidden state is applied
      void toolbar.offsetWidth;
      void toolbar.offsetHeight;
      
      // Now measure dimensions while hidden
      const toolbarWidth = toolbar.offsetWidth || toolbar.getBoundingClientRect().width || 300;
      const toolbarHeight = toolbar.offsetHeight || toolbar.getBoundingClientRect().height || 50;
      
      // Calculate target position in viewport coordinates
      // Block has 3px border, so content right edge is blockRect.right - 3
      // Align toolbar's right edge to block's content right edge, then move 3px to the right
      let targetLeft = (blockRect.right - 3) - toolbarWidth + 3;
      let targetTop = blockRect.top - toolbarHeight + 2; // 5px down from previous position (-3 + 5 = +2)
      
      // Account for properties panel and sidebar
      const propertiesPanelWidth = isPropertiesPanelVisible ? 280 : 0;
      const sidebarWidth = 280;
      const canvasRight = viewportWidth - propertiesPanelWidth;
      
      // Clamp to block boundaries first (accounting for 3px right offset)
      const blockContentLeft = blockRect.left + 3;
      const blockContentRight = blockRect.right - 3 + 3; // Add 3px to allow toolbar to extend 3px to the right
      
      if (targetLeft < blockContentLeft) {
        targetLeft = blockContentLeft;
      }
      if (targetLeft + toolbarWidth > blockContentRight) {
        targetLeft = blockContentRight - toolbarWidth;
      }
      
      // Clamp to viewport boundaries
      if (targetLeft + toolbarWidth > canvasRight - 10) {
        targetLeft = canvasRight - toolbarWidth - 10;
      }
      if (targetLeft < sidebarWidth + 10) {
        targetLeft = sidebarWidth + 10;
      }
      targetLeft = Math.max(10, Math.min(targetLeft, viewportWidth - toolbarWidth - 10));
      targetTop = Math.max(10, Math.min(targetTop, viewportHeight - toolbarHeight - 10));
      
      // Snap to device pixels to avoid sub-pixel jitter
      const devicePixelRatio = window.devicePixelRatio || 1;
      targetLeft = Math.round(targetLeft * devicePixelRatio) / devicePixelRatio;
      targetTop = Math.round(targetTop * devicePixelRatio) / devicePixelRatio;
      
      // CRITICAL: Apply position AND visibility in a SINGLE atomic style update
      // This prevents any flash or intermediate state
      toolbar.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        transform: translate(${targetLeft}px, ${targetTop}px) !important;
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
        pointer-events: auto !important;
        will-change: transform !important;
        transition: none !important;
        animation: none !important;
        transform-origin: 0 0 !important;
      `;
      
      // Mark as positioned
      isToolbarPositionedRef.current = true;
      
      return true;
    }
    isToolbarPositionedRef.current = false;
    return false;
  }, [isSelected, isToolbarBlock, isPreview, isEditing, isDragging, isPropertiesPanelVisible]);

  // Use useLayoutEffect to position toolbar before paint (prevents flash)
  React.useLayoutEffect(() => {
    if (!isSelected || !isToolbarBlock || isPreview || isEditing || isDragging) {
      // Hide toolbar when not needed - completely off-screen and invisible
      isToolbarPositionedRef.current = false;
      if (toolbarRef.current) {
        toolbarRef.current.style.cssText = `
          position: fixed !important;
          top: -9999px !important;
          left: -9999px !important;
          transform: translate(-9999px, -9999px) !important;
          visibility: hidden !important;
          opacity: 0 !important;
          display: none !important;
          pointer-events: none !important;
          transition: none !important;
          animation: none !important;
        `;
      }
      return;
    }

    // CRITICAL: Position toolbar immediately before paint
    // Ensure toolbar is NEVER visible until positioned correctly
    if (toolbarRef.current && blockRef.current) {
      // Reset positioning flag
      isToolbarPositionedRef.current = false;
      
      // First, ensure toolbar is completely hidden and off-screen
      // Use display: block but keep it off-screen
      toolbarRef.current.style.cssText = `
        position: fixed !important;
        top: -9999px !important;
        left: -9999px !important;
        transform: translate(-9999px, -9999px) !important;
        visibility: hidden !important;
        opacity: 0 !important;
        display: block !important;
        pointer-events: none !important;
        transition: none !important;
        animation: none !important;
      `;
      
      // Force multiple reflows to ensure the hidden state is fully applied
      void toolbarRef.current.offsetWidth;
      void toolbarRef.current.offsetHeight;
      void toolbarRef.current.offsetWidth;
      
      // Compute and apply position synchronously
      // This will set display: block and visibility: visible ONLY after position is set
      updateToolbarPosition();
    }
  }, [updateToolbarPosition, isPropertiesPanelVisible, isSelected, isToolbarBlock, isPreview, isEditing, isDragging]);

  // Use useEffect for event listeners (after layout)
  React.useEffect(() => {
    if (!isSelected || !isToolbarBlock || isPreview || isEditing || isDragging) {
      return;
    }

    // Single throttled update function using requestAnimationFrame
    let rafId: number | null = null;
    const scheduleUpdate = () => {
      if (rafId !== null) return; // Already scheduled
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateToolbarPosition();
      });
    };
    
    // Listen to all events that require repositioning
    const handleResize = scheduleUpdate;
    const handleScroll = scheduleUpdate;
    
    // Window events
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    
    // Canvas container scroll
    const canvasContainer = blockRef.current?.closest('.lesson-canvas');
    if (canvasContainer) {
      canvasContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Main content scroll (if it exists)
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Update after toolbar content renders (measure toolbar size)
    const measureTimeout = setTimeout(() => {
      updateToolbarPosition();
    }, 100);
    
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      if (canvasContainer) {
        canvasContainer.removeEventListener('scroll', handleScroll);
      }
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(measureTimeout);
    };
  }, [updateToolbarPosition, isPropertiesPanelVisible, isSelected, isToolbarBlock, isPreview, isEditing, isDragging]);

  const handleDelete = () => {
    if (onDeleteBlock) {
      onDeleteBlock(block.id);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicateBlock) {
      onDuplicateBlock(block.id);
    }
  };

  const handleMove = () => {
    if (onMoveBlock) {
      onMoveBlock(block.id);
    }
  };

  const handleGenerateWithAI = () => {
    // Only do something for text/header blocks, do nothing for image blocks
    if (onGenerateWithAI && (block.type === 'text' || block.type === 'header')) {
      onGenerateWithAI(block.id);
    }
    // For image blocks, do nothing (as requested)
  };

  const handleMoreOptions = () => {
    // TODO: Implement more options menu
    console.log('More options clicked');
  };

  // Render toolbar in a portal at document body level to avoid transform issues
  // Keep toolbar always mounted but COMPLETELY hidden until positioned
  const shouldShowToolbar = isSelected && isToolbarBlock && !isPreview && !isEditing && !isDragging;
  
  const toolbarContent = (
    <div 
      ref={toolbarRef} 
      className="text-block-toolbar-wrapper"
      style={{
        // CRITICAL: Start completely off-screen and invisible
        // useLayoutEffect will position it before paint
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        transform: 'translate(-9999px, -9999px)',
        visibility: 'hidden',
        opacity: 0,
        display: shouldShowToolbar ? 'block' : 'none',
        transition: 'none',
        animation: 'none',
        pointerEvents: 'none',
      }}
    >
      {shouldShowToolbar && (
        <TextBlockToolbar
          block={block}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onMove={handleMove}
          onGenerateWithAI={handleGenerateWithAI}
          onMoreOptions={handleMoreOptions}
          blockType={block.type as 'text' | 'header' | 'image' | 'quiz'}
        />
      )}
    </div>
  );

  return (
    <>
      {createPortal(toolbarContent, document.body)}
      <div
        ref={(node) => {
          blockRef.current = node;
          if (typeof setNodeRef === 'function') {
            setNodeRef(node);
          }
        }}
        style={style}
        className={`column-block-item ${isSelected ? 'selected' : ''} ${
          isEditing ? 'editing' : ''
        } ${isDragging ? 'dragging' : ''} ${isImageBlock ? 'image-block-toolbar' : ''} ${isQuizBlock ? 'quiz-block-toolbar' : ''}`}
        onClick={handleBlockClick}
        onDoubleClick={handleBlockDoubleClick}
        {...cardDragListeners}
      >
        {/* For image blocks, wrap in block-card-content like main canvas */}
        {isImageBlock ? (
          <div className="block-card-content">
            {renderBlock()}
          </div>
        ) : (
          renderBlock()
        )}
      </div>
    </>
  );
}

interface ColumnDroppableProps {
  columnIndex: number;
  columnsBlockId: string;
  blocks: Block[];
  isPreview: boolean;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: Block) => void;
  activeId?: string | null;
  onDeleteBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onMoveBlock?: (blockId: string) => void;
  onGenerateWithAI?: (blockId: string) => void;
  isPropertiesPanelVisible?: boolean;
}

function ColumnDroppable({
  columnIndex,
  columnsBlockId,
  blocks,
  isPreview,
  selectedBlockId,
  editingBlockId,
  onSelectBlock,
  onEditBlock,
  onUpdateBlock,
  activeId,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onGenerateWithAI,
  isPropertiesPanelVisible,
}: ColumnDroppableProps) {
  const containerId = `columns:${columnsBlockId}:col:${columnIndex}`;
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: {
      containerId,
      type: 'column',
      columnsBlockId,
      columnIndex,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`columns-column ${isOver ? 'drag-over' : ''} ${blocks.length === 0 ? 'empty' : ''}`}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        {blocks.length === 0 ? (
          <div className="column-empty-placeholder">
            Drag and drop content here
          </div>
        ) : (
          blocks.map((block) => (
            <ColumnBlockItem
              key={block.id}
              block={block}
              columnIndex={columnIndex}
              columnsBlockId={columnsBlockId}
              isSelected={block.id === selectedBlockId}
              isEditing={block.id === editingBlockId}
              isPreview={isPreview}
              onSelect={() => onSelectBlock(block.id)}
              onEdit={() => onEditBlock(block.id)}
              onEditBlock={onEditBlock}
              onUpdateBlock={onUpdateBlock}
              onDeleteBlock={onDeleteBlock}
              onDuplicateBlock={onDuplicateBlock}
              onMoveBlock={onMoveBlock}
              onGenerateWithAI={onGenerateWithAI}
              isPropertiesPanelVisible={isPropertiesPanelVisible}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
}

export function ColumnsBlockView({
  block,
  isPreview,
  selectedBlockId,
  editingBlockId,
  onSelectBlock,
  onEditBlock,
  onUpdateBlock,
  onUpdateColumnsBlock,
  activeId,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onGenerateWithAI,
  isPropertiesPanelVisible,
}: ColumnsBlockViewProps) {
  // Note: The columns container doesn't need to be a droppable because
  // it's already a sortable item in the canvas, so it can receive drag events
  // for reordering. We only need droppables for the columns inside.

  return (
    <div
      className="block-view columns-block-view"
      style={{
        '--column-gap': `${block.columnGap}px`,
        '--column-count': block.columns,
      } as React.CSSProperties}
    >
      <div className="columns-columns-wrapper">
        {Array.from({ length: block.columns }).map((_, index) => (
          <ColumnDroppable
            key={index}
            columnIndex={index}
            columnsBlockId={block.id}
            blocks={block.children[index] || []}
            isPreview={isPreview}
            selectedBlockId={selectedBlockId}
            editingBlockId={editingBlockId}
            onSelectBlock={onSelectBlock}
            onEditBlock={onEditBlock}
            onUpdateBlock={onUpdateBlock}
            activeId={activeId}
            onDeleteBlock={onDeleteBlock}
            onDuplicateBlock={onDuplicateBlock}
            onMoveBlock={onMoveBlock}
            onGenerateWithAI={onGenerateWithAI}
            isPropertiesPanelVisible={isPropertiesPanelVisible}
          />
        ))}
      </div>
    </div>
  );
}

