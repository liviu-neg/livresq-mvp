import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
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
  const isToolbarBlock = isTextBlock || isImageBlock; // Blocks that show the toolbar
  const cardDragListeners = (isSelected && !isEditing && !isPreview) ? {
    ...attributes,
    ...listeners,
  } : {};

  const blockRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // Position toolbar above the block (same logic as in SortableBlockItem)
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
    window.addEventListener('scroll', handleScroll, true);
    
    // Also listen to scroll on the lesson canvas container
    const canvasContainer = blockRef.current?.closest('.lesson-canvas');
    if (canvasContainer) {
      canvasContainer.addEventListener('scroll', handleScroll);
    }
    
    // Wait for CSS transition to complete when sidebar state changes
    const timeoutId = setTimeout(() => {
      updateToolbarPosition();
    }, 350);
    
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
        className={`column-block-item ${isSelected ? 'selected' : ''} ${
          isEditing ? 'editing' : ''
        } ${isDragging ? 'dragging' : ''} ${isImageBlock ? 'image-block-toolbar' : ''}`}
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

