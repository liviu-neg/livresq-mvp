import {
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import React from 'react';
import { createPortal } from 'react-dom';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Block, Section, Row } from '../types';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';
import { ColumnsBlockView } from './ColumnsBlockView';
import { BlockCardHeader } from './BlockCardHeader';
import { SimpleSection } from './sections/SimpleSection';
import { TwoColumnSection } from './sections/TwoColumnSection';
import { findBlockInSections } from '../utils/sections';
import { Row as RowComponent } from './constructor/Row';
import { findBlockInRows } from '../utils/constructor';
import { TextBlockToolbar } from './TextBlockToolbar';

interface LessonCanvasProps {
  sections?: Section[];
  rows?: Row[];
  selectedBlockId: string | null;
  editingBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string, fromDoubleClick?: boolean) => void;
  onStopEditing: () => void;
  onUpdateBlock: (block: Block) => void;
  onUpdateRow?: (row: Row) => void;
  onDeleteBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onMoveBlock?: (blockId: string) => void;
  onGenerateWithAI?: (blockId: string) => void;
  isPreview: boolean;
  activeId?: string | null;
  allBlocks?: Block[]; // All blocks including nested ones for finding blocks by ID
  isPropertiesPanelVisible?: boolean;
  triggerSelectAllAndAI?: boolean;
  triggerSelectAll?: boolean;
  zoom?: number;
}

interface SortableBlockItemProps {
  block: Block;
  isSelected: boolean;
  isEditing: boolean;
  isPreview: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onUpdateBlock: (block: Block) => void;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string, fromDoubleClick?: boolean) => void;
  onDeleteBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onMoveBlock?: (blockId: string) => void;
  onGenerateWithAI?: (blockId: string) => void;
  activeId?: string | null;
  allBlocks?: Block[];
  isPropertiesPanelVisible?: boolean;
  triggerSelectAllAndAI?: boolean;
  triggerSelectAll?: boolean;
  zoom?: number;
}

function SortableBlockItem({
  block,
  isSelected,
  isEditing,
  isPreview,
  onSelect,
  onEdit,
  onUpdateBlock,
  selectedBlockId,
  editingBlockId,
  onSelectBlock,
  onEditBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onGenerateWithAI,
  activeId,
  allBlocks = [],
  isPropertiesPanelVisible = true,
  triggerSelectAllAndAI = false,
  triggerSelectAll = false,
  zoom = 100,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdate = (updates: Partial<Block>) => {
    onUpdateBlock({ ...block, ...updates } as Block);
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        return (
          <TextBlockView
            block={block}
            isSelected={isSelected}
            isEditing={isEditing}
            isPreview={isPreview}
            onUpdate={handleUpdate}
            triggerSelectAllAndAI={triggerSelectAllAndAI && block.id === selectedBlockId}
            triggerSelectAll={triggerSelectAll && block.id === selectedBlockId}
          />
        );
      case 'header':
        return (
          <TextBlockView
            block={block}
            isSelected={isSelected}
            isEditing={isEditing}
            isPreview={isPreview}
            onUpdate={handleUpdate}
            triggerSelectAllAndAI={triggerSelectAllAndAI && block.id === selectedBlockId}
            triggerSelectAll={triggerSelectAll && block.id === selectedBlockId}
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
            isSelected={isEditing}
            isPreview={isPreview}
            onUpdate={handleUpdate}
          />
        );
      case 'columns':
        return (
          <ColumnsBlockView
            block={block}
            isPreview={isPreview}
            selectedBlockId={selectedBlockId}
            editingBlockId={editingBlockId}
            onSelectBlock={onSelectBlock}
            onEditBlock={onEditBlock}
            onUpdateBlock={onUpdateBlock}
            onUpdateColumnsBlock={handleUpdate}
            activeId={activeId}
            onDeleteBlock={onDeleteBlock}
            onDuplicateBlock={onDuplicateBlock}
            onMoveBlock={onMoveBlock}
            onGenerateWithAI={onGenerateWithAI}
            isPropertiesPanelVisible={isPropertiesPanelVisible}
          />
        );
    }
  };

  const handleBlockClick = (e: React.MouseEvent) => {
    // Don't select if clicking on editor content or toolbar
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
    
    // If clicking on a different block while another is being edited, stop editing
    if (editingBlockId && editingBlockId !== block.id) {
      onSelectBlock(null); // This will trigger onStopEditing via App.tsx
    }
    
    onSelect();
  };

  const handleBlockDoubleClick = (e: React.MouseEvent) => {
    // Don't edit if clicking on editor content or toolbar
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
    
    // For text/header blocks, trigger select-all on double-click
    if (block.type === 'text' || block.type === 'header') {
      onEditBlock(block.id, true); // true indicates double-click
    } else if (block.type === 'image') {
      // For image blocks, open the image modal
      onEditBlock(block.id);
    } else {
      onEdit();
    }
  };

  const isTextBlock = block.type === 'text' || block.type === 'header';
  const isImageBlock = block.type === 'image';
  const isQuizBlock = block.type === 'quiz';
  const isToolbarBlock = isTextBlock || isImageBlock || isQuizBlock; // Blocks that show the toolbar
  const isColumnsBlock = block.type === 'columns';
  const isImageOrQuizBlock = block.type === 'image' || block.type === 'quiz';
  const blockRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const isToolbarPositionedRef = React.useRef<boolean>(false);

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
        // Block is out of view, hide toolbar completely
        toolbar.style.cssText = `
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
  }, [isSelected, isToolbarBlock, isPreview, isEditing, isDragging, isPropertiesPanelVisible, zoom]);

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
      // Use display: none to ensure it's not rendered at all
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
  }, [updateToolbarPosition, isPropertiesPanelVisible, isSelected, isToolbarBlock, isPreview, isEditing, isDragging, zoom]);

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
  }, [updateToolbarPosition, isPropertiesPanelVisible, isSelected, isToolbarBlock, isPreview, isEditing, isDragging, zoom]);

  // Enable drag on the entire card when selected (not editing) and not in preview
  // When editing, disable drag to allow text editing
  // For columns blocks, allow drag on the entire container when selected
  const cardDragListeners = (isSelected && !isEditing && !isPreview) ? {
    ...attributes,
    ...listeners,
  } : {};

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
        zIndex: 10000,
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
        className={`canvas-block ${isSelected ? 'selected' : ''} ${
          isEditing ? 'editing' : ''
        } ${isDragging ? 'dragging' : ''} ${(block.type === 'text' || block.type === 'header') ? 'text-block-no-header' : ''} ${isImageBlock ? 'image-block-toolbar' : ''} ${isQuizBlock ? 'quiz-block-toolbar' : ''} ${isImageOrQuizBlock ? 'no-header' : ''}`}
        onClick={handleBlockClick}
        onDoubleClick={handleBlockDoubleClick}
        {...cardDragListeners}
      >
        {(block.type === 'text' || block.type === 'header') && !isPreview && !isEditing && !isDragging && (
          <div className="text-block-drag-handle">
            <div className="text-block-drag-indicator"></div>
          </div>
        )}
        <div 
          className={`block-card-content ${(block.type === 'text' || block.type === 'header') ? 'text-block-content' : ''}`}
          onMouseDown={(e) => {
            // Prevent drag when clicking on editor content
            if (block.type === 'text' && isEditing) {
              const target = e.target as HTMLElement;
              if (target.closest('.ProseMirror') || target.closest('.bubble-toolbar')) {
                e.stopPropagation();
              }
            }
          }}
        >
          {renderBlock()}
        </div>
      </div>
    </>
  );
}

function EmptyStateDroppable() {
  const { setNodeRef } = useDroppable({
    id: 'empty-canvas',
  });

  return (
    <div ref={setNodeRef} className="empty-state">
      Drag blocks here to build your lesson
    </div>
  );
}

export function LessonCanvas({
  sections,
  rows,
  selectedBlockId,
  editingBlockId,
  onSelectBlock,
  onEditBlock,
  onStopEditing,
  onUpdateBlock,
  onUpdateRow,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onGenerateWithAI,
  isPreview,
  activeId,
  allBlocks,
  isPropertiesPanelVisible = true,
  triggerSelectAllAndAI = false,
  triggerSelectAll = false,
  zoom = 100,
}: LessonCanvasProps) {
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only clear selection if clicking directly on the canvas background
    const target = e.target as HTMLElement;
    if (target.classList.contains('lesson-canvas') || target.classList.contains('empty-state')) {
      onSelectBlock(null);
      onStopEditing();
    }
  };

  // Extract all blocks for drag overlay
  const allBlocksList = allBlocks || (rows 
    ? rows.flatMap(row => row.cells.flatMap(cell => cell.resource.blocks))
    : sections?.flatMap(section => {
        if (section.type === 'simple') {
          return section.slots.main;
        } else {
          return [...section.slots.left, ...section.slots.right];
        }
      }) || []
  );

  const renderBlock = (block: Block) => (
    <SortableBlockItem
      key={block.id}
      block={block}
      isSelected={block.id === selectedBlockId}
      isEditing={block.id === editingBlockId}
      isPreview={isPreview}
      onSelect={() => onSelectBlock(block.id)}
      onEdit={() => onEditBlock(block.id, false)}
      onUpdateBlock={onUpdateBlock}
      selectedBlockId={selectedBlockId}
      editingBlockId={editingBlockId}
      onSelectBlock={onSelectBlock}
      onEditBlock={onEditBlock}
      onDeleteBlock={onDeleteBlock}
      onDuplicateBlock={onDuplicateBlock}
      onMoveBlock={onMoveBlock}
      onGenerateWithAI={onGenerateWithAI}
      activeId={activeId}
      allBlocks={allBlocksList}
      isPropertiesPanelVisible={isPropertiesPanelVisible}
      triggerSelectAllAndAI={triggerSelectAllAndAI}
      triggerSelectAll={triggerSelectAll}
      zoom={zoom}
    />
  );

  // Use rows if provided, otherwise fall back to sections
  const useRows = rows !== undefined;

  return (
    <>
      <div 
        className={`lesson-canvas ${!isPropertiesPanelVisible ? 'panel-hidden' : ''}`}
        onClick={handleCanvasClick}
        style={{
          backgroundColor: 'var(--color-surface)',
          ...(zoom !== 100 ? {
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          } : {}),
        }}
      >
        {useRows ? (
          // Render rows (Row/Cell/Resource model)
          rows.length === 0 ? (
            <EmptyStateDroppable />
          ) : (
            <SortableContext
              items={rows.map(r => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {rows.map((row) => (
                <RowComponent
                  key={row.id}
                  row={row}
                  selectedBlockId={selectedBlockId}
                  editingBlockId={editingBlockId}
                  isPreview={isPreview}
                  onSelectBlock={onSelectBlock}
                  onEditBlock={onEditBlock}
                  onUpdateBlock={onUpdateBlock}
                  renderBlock={renderBlock}
                  activeId={activeId}
                  allBlocks={allBlocksList}
                  onUpdateRow={onUpdateRow || (() => {})}
                />
              ))}
            </SortableContext>
          )
        ) : (
          // Render sections (legacy)
          (sections?.length === 0 || !sections) ? (
            <EmptyStateDroppable />
          ) : (
            sections.map((section) => {
              // Get all block IDs in this section for SortableContext
              const blockIds: string[] = [];
              if (section.type === 'simple') {
                blockIds.push(...section.slots.main.map(b => b.id));
              } else {
                blockIds.push(...section.slots.left.map(b => b.id), ...section.slots.right.map(b => b.id));
              }

              return (
                <SortableContext
                  key={section.id}
                  items={blockIds}
                  strategy={verticalListSortingStrategy}
                >
                  {section.type === 'simple' ? (
                    <SimpleSection
                      section={section}
                      blocks={section.slots.main}
                      selectedBlockId={selectedBlockId}
                      editingBlockId={editingBlockId}
                      isPreview={isPreview}
                      onSelectBlock={onSelectBlock}
                      onEditBlock={onEditBlock}
                      onUpdateBlock={onUpdateBlock}
                      renderBlock={renderBlock}
                      activeId={activeId}
                      allBlocks={allBlocksList}
                    />
                  ) : (
                    <TwoColumnSection
                      section={section}
                      leftBlocks={section.slots.left}
                      rightBlocks={section.slots.right}
                      selectedBlockId={selectedBlockId}
                      editingBlockId={editingBlockId}
                      isPreview={isPreview}
                      onSelectBlock={onSelectBlock}
                      onEditBlock={onEditBlock}
                      onUpdateBlock={onUpdateBlock}
                      renderBlock={renderBlock}
                      activeId={activeId}
                      allBlocks={allBlocksList}
                    />
                  )}
                </SortableContext>
              );
            })
          )
        )}
      </div>
      {activeId && (
        <DragOverlay>
          <div className="drag-overlay">
            {activeId.startsWith('palette-') ? (
              <div className="palette-block dragging">
                {activeId === 'palette-text' && '📝 Text'}
                {activeId === 'palette-header' && '📝 Header'}
                {activeId === 'palette-image' && '🖼️ Image'}
                {activeId === 'palette-quiz' && '❓ Quiz'}
                {activeId === 'palette-columns' && '📊 Columns'}
              </div>
            ) : (
              (() => {
                const block = useRows 
                  ? findBlockInRows(rows || [], activeId as string)
                  : findBlockInSections(sections || [], activeId as string);
                if (!block) return null;
                const isImageOrQuiz = block.type === 'image' || block.type === 'quiz';
                return (
                  <div className="canvas-block dragging">
                    {!isImageOrQuiz && (
                      <BlockCardHeader type={block.type} isPreview={false} />
                    )}
                    <div className="block-card-content">
                      {(() => {
                        switch (block.type) {
                          case 'text':
                            return <TextBlockView block={block} isSelected={false} isEditing={false} isPreview={false} onUpdate={() => {}} />;
                          case 'header':
                            return <TextBlockView block={block} isSelected={false} isEditing={false} isPreview={false} onUpdate={() => {}} />;
                          case 'image':
                            return <ImageBlockView block={block} isSelected={false} isPreview={false} onUpdate={() => {}} />;
                          case 'quiz':
                            return <QuizBlockView block={block} isSelected={false} isPreview={false} onUpdate={() => {}} />;
                          case 'columns':
                            return <div className="canvas-block dragging columns-drag-preview"></div>;
                        }
                      })()}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </DragOverlay>
      )}
    </>
  );
}
