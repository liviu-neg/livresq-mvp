import {
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import React from 'react';
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
  const isToolbarBlock = isTextBlock || isImageBlock; // Blocks that show the toolbar
  const isColumnsBlock = block.type === 'columns';
  const isImageOrQuizBlock = block.type === 'image' || block.type === 'quiz';
  const blockRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // Position toolbar above the block
  const updateToolbarPosition = React.useCallback(() => {
    if (isSelected && isToolbarBlock && !isPreview && !isEditing && !isDragging && toolbarRef.current && blockRef.current) {
      // Force a reflow to ensure block position is accurate after layout changes
      void blockRef.current.offsetHeight;
      
      const blockRect = blockRef.current.getBoundingClientRect();
      const toolbar = toolbarRef.current;
      const toolbarRect = toolbar.getBoundingClientRect();
      
      // Position toolbar above the block, aligned to the right, touching the selection stroke (3px lower)
      const top = blockRect.top - toolbarRect.height + 3;
      const left = blockRect.right - toolbarRect.width;
      
      // Ensure toolbar doesn't go off-screen on the right
      const viewportWidth = window.innerWidth;
      const maxLeft = viewportWidth - toolbarRect.width - 10; // 10px padding from edge
      const finalLeft = Math.min(left, maxLeft);
      
      toolbar.style.position = 'fixed';
      toolbar.style.top = `${top}px`;
      toolbar.style.left = `${finalLeft}px`;
      toolbar.style.zIndex = '1000';
    }
  }, [isSelected, isToolbarBlock, isPreview, isEditing, isDragging]);

  React.useEffect(() => {
    if (!isSelected || !isToolbarBlock || isPreview || isEditing || isDragging) {
      return;
    }

    updateToolbarPosition();
    
    // Throttle scroll and resize handlers for better performance
    let ticking = false;
    const handleUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateToolbarPosition();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    const handleResize = () => {
      handleUpdate();
    };
    
    const handleScroll = () => {
      handleUpdate();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
    
    // Also listen to scroll on the lesson canvas container
    const canvasContainer = blockRef.current?.closest('.lesson-canvas');
    if (canvasContainer) {
      canvasContainer.addEventListener('scroll', handleScroll);
    }
    
    // Wait for CSS transition to complete (300ms) plus a small buffer when sidebar state changes
    const timeoutId = setTimeout(() => {
      updateToolbarPosition();
    }, 350);
    
    // Also update after a longer delay to catch any layout shifts
    const timeoutId2 = setTimeout(() => {
      updateToolbarPosition();
    }, 500);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      if (canvasContainer) {
        canvasContainer.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [updateToolbarPosition, isPropertiesPanelVisible, isSelected, isToolbarBlock, isPreview, isEditing, isDragging]);

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

  return (
    <>
      {isSelected && isToolbarBlock && !isPreview && !isEditing && !isDragging && (
        <div ref={toolbarRef} className="text-block-toolbar-wrapper">
          <TextBlockToolbar
            block={block}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onMove={handleMove}
            onGenerateWithAI={handleGenerateWithAI}
            onMoreOptions={handleMoreOptions}
            blockType={block.type as 'text' | 'header' | 'image'}
          />
        </div>
      )}
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
        } ${isDragging ? 'dragging' : ''} ${(block.type === 'text' || block.type === 'header') ? 'text-block-no-header' : ''} ${isImageBlock ? 'image-block-toolbar' : ''} ${isImageOrQuizBlock ? 'no-header' : ''}`}
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
