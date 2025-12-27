import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import type { ColumnsBlock, Block } from '../types';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';

interface ColumnsBlockViewProps {
  block: ColumnsBlock;
  isSelected: boolean;
  isPreview: boolean;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: Block) => void;
  onUpdateColumnsBlock: (updates: Partial<ColumnsBlock>) => void;
  activeId?: string | null;
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
  onUpdateBlock: (block: Block) => void;
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
  onUpdateBlock,
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
            isSelected={isSelected}
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
    onEdit();
  };

  const isTextBlock = block.type === 'text' || block.type === 'header';
  const cardDragListeners = (isSelected && !isEditing && !isPreview) ? {
    ...attributes,
    ...listeners,
  } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`column-block-item ${isSelected ? 'selected' : ''} ${
        isEditing ? 'editing' : ''
      } ${isDragging ? 'dragging' : ''}`}
      onClick={handleBlockClick}
      onDoubleClick={handleBlockDoubleClick}
      {...cardDragListeners}
    >
      {renderBlock()}
    </div>
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
            Drag blocks here
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
              onUpdateBlock={onUpdateBlock}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
}

export function ColumnsBlockView({
  block,
  isSelected,
  isPreview,
  selectedBlockId,
  editingBlockId,
  onSelectBlock,
  onEditBlock,
  onUpdateBlock,
  onUpdateColumnsBlock,
  activeId,
}: ColumnsBlockViewProps) {
  // Note: The columns container doesn't need to be a droppable because
  // it's already a sortable item in the canvas, so it can receive drag events
  // for reordering. We only need droppables for the columns inside.

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only select container if clicking directly on container or empty column areas, not on child blocks
    if (
      target.classList.contains('columns-container') ||
      target.classList.contains('columns-columns-wrapper') ||
      target.classList.contains('columns-column') ||
      target.classList.contains('column-empty-placeholder')
    ) {
      // Don't select if clicking on an actual block item
      if (!target.closest('.column-block-item')) {
        e.stopPropagation();
        onSelectBlock(block.id);
      }
    }
  };

  return (
    <div
      className={`columns-container ${isSelected ? 'selected' : ''}`}
      onClick={handleContainerClick}
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
          />
        ))}
      </div>
    </div>
  );
}

