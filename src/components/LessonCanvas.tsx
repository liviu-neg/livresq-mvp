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
import type { Block, Section } from '../types';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';
import { ColumnsBlockView } from './ColumnsBlockView';
import { BlockCardHeader } from './BlockCardHeader';
import { SimpleSection } from './sections/SimpleSection';
import { TwoColumnSection } from './sections/TwoColumnSection';
import { findBlockInSections } from '../utils/sections';

interface LessonCanvasProps {
  sections: Section[];
  selectedBlockId: string | null;
  editingBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onStopEditing: () => void;
  onUpdateBlock: (block: Block) => void;
  isPreview: boolean;
  activeId?: string | null;
  allBlocks?: Block[]; // All blocks including nested ones for finding blocks by ID
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
  onEditBlock: (blockId: string) => void;
  activeId?: string | null;
  allBlocks?: Block[];
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
  activeId,
  allBlocks = [],
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
    onUpdateBlock({ ...block, ...updates });
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
            isSelected={isSelected}
            isPreview={isPreview}
            selectedBlockId={selectedBlockId}
            editingBlockId={editingBlockId}
            onSelectBlock={onSelectBlock}
            onEditBlock={onEditBlock}
            onUpdateBlock={onUpdateBlock}
            onUpdateColumnsBlock={handleUpdate}
            activeId={activeId}
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
    onEdit();
  };

  const isTextBlock = block.type === 'text' || block.type === 'header';
  const isColumnsBlock = block.type === 'columns';
  const isImageOrQuizBlock = block.type === 'image' || block.type === 'quiz';

  // Enable drag on the entire card when selected (not editing) and not in preview
  // When editing, disable drag to allow text editing
  // For columns blocks, allow drag on the entire container when selected
  const cardDragListeners = (isSelected && !isEditing && !isPreview) ? {
    ...attributes,
    ...listeners,
  } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-block ${isSelected ? 'selected' : ''} ${
        isEditing ? 'editing' : ''
      } ${isDragging ? 'dragging' : ''} ${(block.type === 'text' || block.type === 'header') ? 'text-block-no-header' : ''} ${isImageOrQuizBlock ? 'no-header' : ''}`}
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
  selectedBlockId,
  editingBlockId,
  onSelectBlock,
  onEditBlock,
  onStopEditing,
  onUpdateBlock,
  isPreview,
  activeId,
  allBlocks,
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
  const allBlocksList = allBlocks || sections.flatMap(section => {
    if (section.type === 'simple') {
      return section.slots.main;
    } else {
      return [...section.slots.left, ...section.slots.right];
    }
  });

  const renderBlock = (block: Block) => (
    <SortableBlockItem
      key={block.id}
      block={block}
      isSelected={block.id === selectedBlockId}
      isEditing={block.id === editingBlockId}
      isPreview={isPreview}
      onSelect={() => onSelectBlock(block.id)}
      onEdit={() => onEditBlock(block.id)}
      onUpdateBlock={onUpdateBlock}
      selectedBlockId={selectedBlockId}
      editingBlockId={editingBlockId}
      onSelectBlock={onSelectBlock}
      onEditBlock={onEditBlock}
      activeId={activeId}
      allBlocks={allBlocksList}
    />
  );

  return (
    <>
      <div 
        className="lesson-canvas" 
        onClick={handleCanvasClick}
        style={{
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {sections.length === 0 ? (
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
                const block = findBlockInSections(sections, activeId as string);
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
