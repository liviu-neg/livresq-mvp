import {
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import React, { useRef, useEffect } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Editor } from '@tiptap/react';
import type { Block, Section, Row, Resource } from '../types';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';
import { ColumnsBlockView } from './ColumnsBlockView';
import { BlockCardHeader } from './BlockCardHeader';
import { BlockToolbar } from './BlockToolbar';
import { SimpleSection } from './sections/SimpleSection';
import { TwoColumnSection } from './sections/TwoColumnSection';
import { findBlockInSections } from '../utils/sections';
import { RowView } from './RowView';
import { isBlock } from '../utils/sections';

interface LessonCanvasProps {
  sections: Section[]; // For backward compatibility
  rows?: Row[]; // New: Row/Cell/Resource model
  selectedBlockId: string | null;
  selectedCellId?: string | null;
  selectedRowId?: string | null;
  editingBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onSelectCell?: (cellId: string | null) => void;
  onSelectRow?: (rowId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onStopEditing: () => void;
  onUpdateBlock: (block: Block) => void;
  onDeleteBlock: () => void;
  onDuplicateBlock: () => void;
  onDeleteCell?: () => void;
  onDuplicateCell?: () => void;
  onDeleteRow?: () => void;
  onDuplicateRow?: () => void;
  onAddEmptyStateRow?: () => void;
  isPreview: boolean;
  activeId?: string | null;
  allBlocks?: Block[]; // All blocks including nested ones for finding blocks by ID
  showStructureStrokes?: boolean; // Toggle for showing structure strokes
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
  onDeleteBlock: () => void;
  onDuplicateBlock: () => void;
  activeId?: string | null;
  allBlocks?: Block[];
  showStructureStrokes?: boolean;
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
  activeId,
  allBlocks = [],
  showStructureStrokes = false,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  
  const blockContainerRef = useRef<HTMLDivElement>(null);
  const blockContentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const shouldOpenAiEditRef = useRef(false);

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
            editorRef={editorRef}
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
            editorRef={editorRef}
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
            isEditing={isEditing}
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

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (listeners && listeners.onMouseDown) {
      listeners.onMouseDown(e as any);
    }
  };

  const handleOpenAiEdit = () => {
    // If already editing, handle immediately
    if (isEditing && editorRef.current) {
      const editor = editorRef.current;
      const docSize = editor.state.doc.content.size;
      const from = 0;
      const to = docSize;
      const selectedText = docSize > 0 ? editor.state.doc.textBetween(from, to) : '';
      
      // Notify BubbleToolbar that we're about to open AI edit from toolbar
      window.dispatchEvent(new CustomEvent('preparing-ai-edit-from-toolbar'));
      
      // Select all text and highlight it
      if (docSize > 0) {
        editor
          .chain()
          .setTextSelection({ from, to })
          .setAiHighlight()
          .run();
      }
      
      // Trigger AI edit popover
      window.dispatchEvent(new CustomEvent('open-ai-edit', {
        detail: { from, to, text: selectedText }
      }));
    } else {
      // Enter edit mode first, then we'll handle selecting all text and opening AI popover
      shouldOpenAiEditRef.current = true;
      onEdit();
    }
  };

  // Handle AI edit after entering edit mode - dispatch event for BubbleToolbar to open popover
  useEffect(() => {
    if (isEditing && shouldOpenAiEditRef.current) {
      // Poll for editor to be ready and fully initialized
      const checkEditor = setInterval(() => {
        const editor = editorRef.current;
        // Check if editor exists and has a view (fully initialized)
        if (editor && editor.view && editor.state) {
          clearInterval(checkEditor);
          shouldOpenAiEditRef.current = false;
          
          // Wait a bit more for editor to be fully ready
          setTimeout(() => {
            try {
              const docSize = editor.state.doc.content.size;
              const from = 0;
              const to = docSize;
              const selectedText = docSize > 0 ? editor.state.doc.textBetween(from, to) : '';
              
              // Notify BubbleToolbar that we're about to open AI edit from toolbar
              // This prevents the bubble menu from showing
              window.dispatchEvent(new CustomEvent('preparing-ai-edit-from-toolbar'));
              
              // Select all text and highlight it
              if (docSize > 0) {
                editor
                  .chain()
                  .setTextSelection({ from, to })
                  .setAiHighlight()
                  .run();
              }
              
              // Trigger AI edit popover via custom event that BubbleToolbar listens to
              window.dispatchEvent(new CustomEvent('open-ai-edit', {
                detail: { from, to, text: selectedText }
              }));
            } catch (error) {
              console.error('Error opening AI edit:', error);
            }
          }, 150);
        }
      }, 50);
      
      // Stop polling after 3 seconds
      const timeoutId = setTimeout(() => {
        clearInterval(checkEditor);
        shouldOpenAiEditRef.current = false;
      }, 3000);
      
      return () => {
        clearInterval(checkEditor);
        clearTimeout(timeoutId);
      };
    }
  }, [isEditing]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        blockContainerRef.current = node;
      }}
      style={style}
      className={`canvas-block ${isSelected ? 'selected' : ''} ${
        isEditing ? 'editing' : ''
      } ${isDragging ? 'dragging' : ''} ${(block.type === 'text' || block.type === 'header') ? 'text-block-no-header' : ''} ${isImageOrQuizBlock ? 'no-header' : ''} ${showStructureStrokes ? 'show-strokes' : ''}`}
      onClick={handleBlockClick}
      onDoubleClick={handleBlockDoubleClick}
      {...cardDragListeners}
    >
      {(block.type === 'text' || block.type === 'header' || block.type === 'image' || block.type === 'quiz') && isSelected && !isEditing && !isPreview && !isDragging && (
        <BlockToolbar
          blockContainerRef={blockContentRef}
          blockType={block.type}
          onDelete={onDeleteBlock}
          onDuplicate={onDuplicateBlock}
          onDragStart={handleDragStart}
          editorRef={block.type === 'text' || block.type === 'header' ? editorRef : undefined}
          onOpenAiEdit={block.type === 'text' || block.type === 'header' ? handleOpenAiEdit : undefined}
        />
      )}
      <div 
        ref={blockContentRef}
        className={`block-card-content ${(block.type === 'text' || block.type === 'header') ? 'text-block-content' : ''}`}
        onMouseDown={(e) => {
          // Prevent drag when clicking on editor content or toolbar
          if (block.type === 'text' && isEditing) {
            const target = e.target as HTMLElement;
            if (target.closest('.ProseMirror') || target.closest('.bubble-toolbar') || target.closest('.block-toolbar')) {
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
  rows,
  selectedBlockId,
  selectedCellId,
  selectedRowId,
  editingBlockId,
  onSelectBlock,
  onSelectCell,
  onSelectRow,
  onEditBlock,
  onStopEditing,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onDeleteCell,
  onDuplicateCell,
  onDeleteRow,
  onDuplicateRow,
  onAddEmptyStateRow,
  isPreview,
  activeId,
  allBlocks,
  showStructureStrokes = false,
}: LessonCanvasProps) {
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only clear selection if clicking directly on the canvas background
    const target = e.target as HTMLElement;
    if (target.classList.contains('lesson-canvas') || target.classList.contains('empty-state')) {
      onSelectBlock(null);
      if (onSelectCell) onSelectCell(null);
      if (onSelectRow) onSelectRow(null);
      onStopEditing();
    }
  };

  // Extract all blocks for drag overlay
  const allBlocksList = allBlocks || (rows && rows.length > 0
    ? rows.flatMap(row => row.cells.flatMap(cell => cell.resources.filter(isBlock) as Block[]))
    : sections.flatMap(section => {
        if (section.type === 'simple') {
          return section.slots.main;
        } else {
          return [...section.slots.left, ...section.slots.right];
        }
      }));

  const handleBlockSelect = (blockId: string) => {
    onSelectBlock(blockId);
    if (onSelectCell) onSelectCell(null); // Clear cell selection when selecting block
    if (onSelectRow) onSelectRow(null); // Clear row selection when selecting block
  };

  const renderResource = (resource: Resource) => {
    if (isBlock(resource)) {
      return (
        <SortableBlockItem
          key={resource.id}
          block={resource}
          isSelected={resource.id === selectedBlockId}
          isEditing={resource.id === editingBlockId}
          isPreview={isPreview}
          onSelect={() => handleBlockSelect(resource.id)}
          onEdit={() => onEditBlock(resource.id)}
          onUpdateBlock={onUpdateBlock}
          selectedBlockId={selectedBlockId}
          editingBlockId={editingBlockId}
          onSelectBlock={handleBlockSelect}
          onEditBlock={onEditBlock}
          onDeleteBlock={onDeleteBlock}
          onDuplicateBlock={onDuplicateBlock}
          activeId={activeId}
          allBlocks={allBlocksList}
          showStructureStrokes={showStructureStrokes}
        />
      );
    }
    return null;
  };

  // If rows are provided, render using Row/Cell/Resource model
  if (rows && rows.length > 0) {
    // Get all block IDs for SortableContext
    const allBlockIds = rows.flatMap(row => 
      row.cells.flatMap(cell => 
        cell.resources.filter(isBlock).map(r => (r as Block).id)
      )
    );

    return (
      <>
        <div 
          className="lesson-canvas" 
          onClick={handleCanvasClick}
          style={{
            backgroundColor: 'var(--lesson-canvas-bg)',
          }}
        >
          <SortableContext
            items={allBlockIds}
            strategy={verticalListSortingStrategy}
          >
                    {rows.map((row) => (
                      <RowView
                        key={row.id}
                        row={row}
                        selectedBlockId={selectedBlockId}
                        selectedCellId={selectedCellId}
                        selectedRowId={selectedRowId}
                        editingBlockId={editingBlockId}
                        isPreview={isPreview}
                        onSelectBlock={onSelectBlock}
                        onSelectCell={onSelectCell}
                        onSelectRow={onSelectRow}
                        onEditBlock={onEditBlock}
                        onUpdateBlock={onUpdateBlock}
                        onDeleteCell={onDeleteCell}
                        onDuplicateCell={onDuplicateCell}
                        onDeleteRow={onDeleteRow}
                        onDuplicateRow={onDuplicateRow}
                        onAddEmptyStateRow={onAddEmptyStateRow}
                        renderResource={renderResource}
                        activeId={activeId}
                        allBlocks={allBlocksList}
                        showStructureStrokes={showStructureStrokes}
                      />
                    ))}
          </SortableContext>
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
                return (
                  <div className="canvas-block dragging">
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

  // Fallback to sections rendering (backward compatibility)
  const renderBlock = (block: Block) => (
    <SortableBlockItem
      key={block.id}
      block={block}
      isSelected={block.id === selectedBlockId}
      isEditing={block.id === editingBlockId}
      isPreview={isPreview}
      onSelect={() => handleBlockSelect(block.id)}
      onEdit={() => onEditBlock(block.id)}
      onUpdateBlock={onUpdateBlock}
      selectedBlockId={selectedBlockId}
      editingBlockId={editingBlockId}
      onSelectBlock={handleBlockSelect}
      onEditBlock={onEditBlock}
      onDeleteBlock={onDeleteBlock}
      onDuplicateBlock={onDuplicateBlock}
      activeId={activeId}
      allBlocks={allBlocksList}
      showStructureStrokes={showStructureStrokes}
    />
  );

  return (
    <>
      <div 
        className="lesson-canvas" 
        onClick={handleCanvasClick}
        style={{
          backgroundColor: 'var(--lesson-canvas-bg)',
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
                return (
                  <div className="canvas-block dragging">
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
