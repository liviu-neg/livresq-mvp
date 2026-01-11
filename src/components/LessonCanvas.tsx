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
import { ButtonBlockView } from './ButtonBlockView';
import { BlockCardHeader } from './BlockCardHeader';
import { BlockToolbar } from './BlockToolbar';
import { SimpleSection } from './sections/SimpleSection';
import { TwoColumnSection } from './sections/TwoColumnSection';
import { findBlockInSections } from '../utils/sections';
import { RowView } from './RowView';
import { isBlock } from '../utils/sections';
import { useThemeSwitcher, useTheme } from '../theme/ThemeProvider';

interface LessonCanvasProps {
  sections: Section[]; // For backward compatibility
  rows?: Row[]; // New: Row/Cell/Resource model
  selectedBlockId: string | null;
  selectedCellId?: string | null;
  selectedRowId?: string | null;
  editingBlockId: string | null;
  pageProps?: {
    themes?: {
      plain?: {
        backgroundColor?: string;
        backgroundColorOpacity?: number;
        backgroundImage?: string;
        backgroundImageOpacity?: number;
      };
      neon?: {
        backgroundColor?: string;
        backgroundColorOpacity?: number;
        backgroundImage?: string;
        backgroundImageOpacity?: number;
      };
    };
  };
  onSelectBlock: (blockId: string | null) => void;
  onSelectCell?: (cellId: string | null) => void;
  onSelectRow?: (rowId: string | null) => void;
  onSelectPage?: (isSelected: boolean) => void;
  onEditBlock: (blockId: string) => void;
  onStopEditing: () => void;
  onUpdateBlock: (block: Block) => void;
  onDeleteBlock: () => void;
  onDuplicateBlock: () => void;
  onDeleteCell?: () => void;
  onDuplicateCell?: () => void;
  onEditCell?: () => void;
  onEditRow?: () => void;
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
      case 'button':
        return (
          <ButtonBlockView
            block={block}
            isSelected={isSelected}
            isEditing={isEditing}
            isPreview={isPreview}
            onUpdate={handleUpdate}
          />
        );
      default:
        return null;
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
    <ResourceBackgroundWrapper blockId={block.id}>
      <div
        ref={(node) => {
          setNodeRef(node);
          blockContainerRef.current = node;
        }}
        data-block-id={block.id}
        style={style}
        className={`canvas-block ${isSelected ? 'selected' : ''} ${
          isEditing ? 'editing' : ''
        } ${isDragging ? 'dragging' : ''} ${(block.type === 'text' || block.type === 'header') ? 'text-block-no-header' : ''} ${isImageOrQuizBlock ? 'no-header' : ''} ${showStructureStrokes ? 'show-strokes' : ''}`}
        onClick={handleBlockClick}
        onDoubleClick={handleBlockDoubleClick}
        {...cardDragListeners}
      >
      {(block.type === 'text' || block.type === 'header' || block.type === 'image' || block.type === 'quiz' || block.type === 'button') && isSelected && !isEditing && !isPreview && !isDragging && (
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
    </ResourceBackgroundWrapper>
  );
}

// Resource background component - applies theme-specific background to canvas-block elements
function ResourceBackgroundWrapper({ children, blockId }: { children: React.ReactNode; blockId: string }) {
  const theme = useTheme();
  const resourceBackground = theme.resourceBackground;
  
  if (!resourceBackground?.backgroundColor && !resourceBackground?.backgroundImage) {
    // No resource background set, return children as-is
    return <>{children}</>;
  }
  
  return (
    <div style={{ position: 'relative' }}>
      {/* Resource background color layer */}
      {resourceBackground.backgroundColor && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: resourceBackground.backgroundColor,
            opacity: resourceBackground.backgroundColorOpacity ?? 1,
            zIndex: 0,
            pointerEvents: 'none',
            borderRadius: '4px',
          }}
        />
      )}
      {/* Resource background image layer */}
      {resourceBackground.backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${resourceBackground.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: resourceBackground.backgroundImageOpacity ?? 1,
            zIndex: 1,
            pointerEvents: 'none',
            borderRadius: '4px',
          }}
        />
      )}
      {/* Content with z-index to appear above background */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}

// Page background component - applies theme-specific background to the lesson canvas
function PageBackground({ pageProps }: { 
  pageProps?: {
    themes?: {
      plain?: {
        backgroundColor?: string;
        backgroundColorOpacity?: number;
        backgroundImage?: string;
        backgroundImageOpacity?: number;
      };
      neon?: {
        backgroundColor?: string;
        backgroundColorOpacity?: number;
        backgroundImage?: string;
        backgroundImageOpacity?: number;
      };
    };
  };
}) {
  const { themeId } = useThemeSwitcher();
  const theme = useTheme();
  const defaultPageBackground = theme.pageBackground || { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
  const themePageProps = pageProps?.themes?.[themeId] || {};
  const backgroundColor = themePageProps.backgroundColor ?? defaultPageBackground.backgroundColor;
  const backgroundColorOpacity = themePageProps.backgroundColorOpacity ?? defaultPageBackground.backgroundColorOpacity ?? 1;
  const backgroundImage = themePageProps.backgroundImage ?? defaultPageBackground.backgroundImage;
  const backgroundImageOpacity = themePageProps.backgroundImageOpacity ?? defaultPageBackground.backgroundImageOpacity ?? 1;

  return (
    <>
      <div 
        className="page-background-color-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: backgroundColor || 'transparent',
          opacity: backgroundColorOpacity,
          zIndex: 0,
          pointerEvents: 'none',
          borderRadius: '8px',
        }}
      />
      {backgroundImage && (
        <div 
          className="page-background-image-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: backgroundImageOpacity,
            zIndex: 1,
            pointerEvents: 'none',
            borderRadius: '8px',
          }}
        />
      )}
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
  selectedCellId,
  selectedRowId,
  editingBlockId,
  pageProps = {},
  onSelectBlock,
  onSelectCell,
  onSelectRow,
  onSelectPage,
  onEditBlock,
  onStopEditing,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onDeleteCell,
  onDuplicateCell,
  onEditCell,
  onEditRow,
  onDeleteRow,
  onDuplicateRow,
  onAddEmptyStateRow,
  isPreview,
  activeId,
  allBlocks,
  showStructureStrokes = false,
}: LessonCanvasProps) {
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only select page if clicking directly on the canvas background
    const target = e.target as HTMLElement;
    if (target.classList.contains('lesson-canvas') || target.classList.contains('empty-state')) {
      onSelectBlock(null);
      if (onSelectCell) onSelectCell(null);
      if (onSelectRow) onSelectRow(null);
      if (onSelectPage) onSelectPage(true); // Select page when clicking outside rows
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
      <div 
        className="lesson-canvas" 
        onClick={handleCanvasClick}
        style={{
          position: 'relative',
        }}
      >
        <PageBackground pageProps={pageProps} />
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
              onEditCell={onEditCell}
              onEditRow={onEditRow}
              onDeleteRow={onDeleteRow}
              onDuplicateRow={onDuplicateRow}
              onAddEmptyStateRow={onAddEmptyStateRow}
              renderResource={renderResource}
              activeId={activeId}
              allBlocks={allBlocksList}
              showStructureStrokes={showStructureStrokes}
              pageProps={pageProps}
            />
          ))}
        </SortableContext>
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
                          case 'button':
                            return <ButtonBlockView block={block} isSelected={false} isEditing={false} isPreview={false} onUpdate={() => {}} />;
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
      </div>
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
    <div 
      className="lesson-canvas" 
      onClick={handleCanvasClick}
      style={{
        position: 'relative',
      }}
    >
      <PageBackground pageProps={pageProps} />
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
                          case 'button':
                            return <ButtonBlockView block={block} isSelected={false} isEditing={false} isPreview={false} onUpdate={() => {}} />;
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
    </div>
  );
}
