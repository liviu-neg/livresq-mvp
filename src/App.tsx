import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TopBar } from './components/TopBar';
import { BlocksPalette } from './components/BlocksPalette';
import { LessonCanvas } from './components/LessonCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { PreviewToolbar, deviceConfigs } from './components/PreviewToolbar';
import { PreviewStage } from './components/PreviewStage';
import { ImageFillModal } from './components/ImageFillModal';
import type { DeviceType } from './components/PreviewToolbar';
import type { Block, BlockType, ColumnsBlock, Section, ImageBlock } from './types';
import { createBlock } from './types';
import { migrateBlocksToSections, extractBlocksFromSections, findBlockInSections, findBlockLocation } from './utils/sections';
import './App.css';

// Helper to find a block by ID (including nested blocks in columns)
function findBlockById(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'columns') {
      const columnsBlock = block as ColumnsBlock;
      for (const column of columnsBlock.children) {
        for (const childBlock of column) {
          if (childBlock.id === id) return childBlock;
        }
      }
    }
  }
  return null;
}

// Helper to find which container a block is in
function findBlockContainer(blocks: Block[], blockId: string): { type: 'canvas' | 'column'; columnsBlockId?: string; columnIndex?: number } | null {
  // Check canvas blocks
  const canvasIndex = blocks.findIndex(b => b.id === blockId);
  if (canvasIndex !== -1) {
    return { type: 'canvas' };
  }

  // Check nested blocks in columns
  for (const block of blocks) {
    if (block.type === 'columns') {
      const columnsBlock = block as ColumnsBlock;
      for (let colIndex = 0; colIndex < columnsBlock.children.length; colIndex++) {
        const column = columnsBlock.children[colIndex];
        const blockIndex = column.findIndex(b => b.id === blockId);
        if (blockIndex !== -1) {
          return { type: 'column', columnsBlockId: columnsBlock.id, columnIndex: colIndex };
        }
      }
    }
  }
  return null;
}

// Helper to remove a block from its current container
function removeBlockFromContainer(blocks: Block[], blockId: string): { newBlocks: Block[]; removedBlock: Block | null } {
  const newBlocks = [...blocks];
  let removedBlock: Block | null = null;

  // Check canvas blocks
  const canvasIndex = newBlocks.findIndex(b => b.id === blockId);
  if (canvasIndex !== -1) {
    removedBlock = newBlocks[canvasIndex];
    newBlocks.splice(canvasIndex, 1);
    return { newBlocks, removedBlock };
  }

  // Check nested blocks in columns
  for (let i = 0; i < newBlocks.length; i++) {
    const block = newBlocks[i];
    if (block.type === 'columns') {
      const columnsBlock = { ...block } as ColumnsBlock;
      let found = false;
      const newChildren = columnsBlock.children.map((column, colIndex) => {
        const blockIndex = column.findIndex(b => b.id === blockId);
        if (blockIndex !== -1) {
          found = true;
          removedBlock = column[blockIndex];
          return column.filter(b => b.id !== blockId);
        }
        return column;
      });
      if (found) {
        columnsBlock.children = newChildren;
        newBlocks[i] = columnsBlock;
        return { newBlocks, removedBlock };
      }
    }
  }

  return { newBlocks, removedBlock };
}

function App() {
  // Use sections as primary state
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
  const [imageModalBlockId, setImageModalBlockId] = useState<string | null>(null);

  // Derive blocks from sections for backward compatibility (PreviewStage, etc.)
  const blocks = extractBlocksFromSections(sections);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedBlock =
    selectedBlockId ? findBlockInSections(sections, selectedBlockId) : null;

  const handleUpdateBlock = (updatedBlock: Block) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.type === 'simple') {
          const blockIndex = section.slots.main.findIndex(b => b.id === updatedBlock.id);
          if (blockIndex !== -1) {
            const newSlots = { ...section.slots };
            newSlots.main = [...newSlots.main];
            newSlots.main[blockIndex] = updatedBlock;
            return { ...section, slots: newSlots };
          }
        } else if (section.type === 'two-column') {
          const leftIndex = section.slots.left.findIndex(b => b.id === updatedBlock.id);
          const rightIndex = section.slots.right.findIndex(b => b.id === updatedBlock.id);
          if (leftIndex !== -1) {
            const newSlots = { ...section.slots };
            newSlots.left = [...newSlots.left];
            newSlots.left[leftIndex] = updatedBlock;
            return { ...section, slots: newSlots };
          } else if (rightIndex !== -1) {
            const newSlots = { ...section.slots };
            newSlots.right = [...newSlots.right];
            newSlots.right[rightIndex] = updatedBlock;
            return { ...section, slots: newSlots };
          }
        }
        return section;
      })
    );
  };

  const handleDeleteBlock = () => {
    if (!selectedBlockId) return;
    
    const location = findBlockLocation(sections, selectedBlockId);
    if (!location) return;

    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== location.sectionId) return section;
        
        if (section.type === 'simple') {
          const newSlots = {
            main: section.slots.main.filter(b => b.id !== selectedBlockId),
          };
          return { ...section, slots: newSlots };
        } else if (section.type === 'two-column') {
          const newSlots = { ...section.slots };
          if (location.slot === 'left') {
            newSlots.left = section.slots.left.filter(b => b.id !== selectedBlockId);
          } else {
            newSlots.right = section.slots.right.filter(b => b.id !== selectedBlockId);
          }
          return { ...section, slots: newSlots };
        }
        return section;
      })
    );
    
    setSelectedBlockId(null);
    setEditingBlockId(null);
  };

  const handleInsertBlock = (blockType: BlockType) => {
    const newBlock = createBlock(blockType);

    // If no sections exist, create one
    if (sections.length === 0) {
      const newSection = migrateBlocksToSections([newBlock])[0];
      setSections([newSection]);
      setSelectedBlockId(newBlock.id);
      setEditingBlockId(null);
      return;
    }

    // Find the section and slot containing the selected block
    if (selectedBlockId) {
      const location = findBlockLocation(sections, selectedBlockId);
      if (location) {
        setSections((prev) =>
          prev.map((section) => {
            if (section.id !== location.sectionId) return section;
            
            if (section.type === 'simple') {
              const newSlots = { ...section.slots };
              newSlots.main = [...newSlots.main];
              newSlots.main.splice(location.index + 1, 0, newBlock);
              return { ...section, slots: newSlots };
            } else if (section.type === 'two-column') {
              const newSlots = { ...section.slots };
              if (location.slot === 'left') {
                newSlots.left = [...newSlots.left];
                newSlots.left.splice(location.index + 1, 0, newBlock);
              } else {
                newSlots.right = [...newSlots.right];
                newSlots.right.splice(location.index + 1, 0, newBlock);
              }
              return { ...section, slots: newSlots };
            }
            return section;
          })
        );
        setSelectedBlockId(newBlock.id);
        setEditingBlockId(null);
        return;
      }
    }

    // No selection or section not found - append to last section's main slot
    const lastSection = sections[sections.length - 1];
    if (lastSection && lastSection.type === 'simple') {
      setSections((prev) =>
        prev.map((section, index) => {
          if (index === prev.length - 1 && section.type === 'simple') {
            return {
              ...section,
              slots: {
                main: [...section.slots.main, newBlock],
              },
            };
          }
          return section;
        })
      );
    } else {
      // Create a new simple section
      const newSection = migrateBlocksToSections([newBlock])[0];
      setSections((prev) => [...prev, newSection]);
    }

    setSelectedBlockId(newBlock.id);
    setEditingBlockId(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only reorder existing blocks within the same section slot (not from palette, not in columns)
    if (activeData?.source !== 'palette' && !activeData?.containerId?.startsWith('columns:')) {
      const activeLocation = findBlockLocation(sections, active.id as string);
      const overLocation = findBlockLocation(sections, over.id as string);
      
      // Only reorder if both blocks are in the same section and slot
      if (activeLocation && overLocation && 
          activeLocation.sectionId === overLocation.sectionId &&
          activeLocation.slot === overLocation.slot) {
        setSections((prev) =>
          prev.map((section) => {
            if (section.id !== activeLocation.sectionId) return section;
            
            if (section.type === 'simple' && activeLocation.slot === 'main') {
              const newSlots = { ...section.slots };
              newSlots.main = arrayMove(newSlots.main, activeLocation.index, overLocation.index);
              return { ...section, slots: newSlots };
            } else if (section.type === 'two-column') {
              const newSlots = { ...section.slots };
              if (activeLocation.slot === 'left' && overLocation.slot === 'left') {
                newSlots.left = arrayMove(newSlots.left, activeLocation.index, overLocation.index);
              } else if (activeLocation.slot === 'right' && overLocation.slot === 'right') {
                newSlots.right = arrayMove(newSlots.right, activeLocation.index, overLocation.index);
              }
              return { ...section, slots: newSlots };
            }
            return section;
          })
        );
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle dropping from palette
    if (activeData?.source === 'palette') {
      const blockType = activeData.type as BlockType;
      const newBlock = createBlock(blockType);

      if (over.id === 'empty-canvas') {
        // Dropped on empty canvas - create a new SimpleSection
        const newSection = migrateBlocksToSections([newBlock])[0];
        setSections([newSection]);
        setSelectedBlockId(newBlock.id);
        return;
      }

      // Check if dropped into a column (columns block within a section)
      if (overData?.containerId?.startsWith('columns:')) {
        const columnsBlockId = overData.columnsBlockId as string;
        const columnIndex = overData.columnIndex as number;
        
        setSections((prev) =>
          prev.map((section) => {
            // Find the columns block in this section
            const findAndUpdateColumns = (blocks: Block[]): Block[] => {
              return blocks.map(block => {
                if (block.id === columnsBlockId && block.type === 'columns') {
                  const columnsBlock = { ...block } as ColumnsBlock;
                  const newChildren = [...columnsBlock.children];
                  newChildren[columnIndex] = [...newChildren[columnIndex], newBlock];
                  return { ...columnsBlock, children: newChildren };
                }
                return block;
              });
            };

            if (section.type === 'simple') {
              const updatedMain = findAndUpdateColumns(section.slots.main);
              return { ...section, slots: { main: updatedMain } };
            } else if (section.type === 'two-column') {
              const updatedLeft = findAndUpdateColumns(section.slots.left);
              const updatedRight = findAndUpdateColumns(section.slots.right);
              return { ...section, slots: { left: updatedLeft, right: updatedRight } };
            }
            return section;
          })
        );
        setSelectedBlockId(newBlock.id);
        return;
      }

      // Dropped on a block - insert into the same section slot
      const overLocation = findBlockLocation(sections, over.id as string);
      if (overLocation) {
        setSections((prev) =>
          prev.map((section) => {
            if (section.id !== overLocation.sectionId) return section;
            
            if (section.type === 'simple' && overLocation.slot === 'main') {
              const newSlots = { ...section.slots };
              newSlots.main = [...newSlots.main];
              newSlots.main.splice(overLocation.index, 0, newBlock);
              return { ...section, slots: newSlots };
            } else if (section.type === 'two-column') {
              const newSlots = { ...section.slots };
              if (overLocation.slot === 'left') {
                newSlots.left = [...newSlots.left];
                newSlots.left.splice(overLocation.index, 0, newBlock);
              } else {
                newSlots.right = [...newSlots.right];
                newSlots.right.splice(overLocation.index, 0, newBlock);
              }
              return { ...section, slots: newSlots };
            }
            return section;
          })
        );
        setSelectedBlockId(newBlock.id);
        return;
      }

      // Fallback: append to last section or create new one
      if (sections.length > 0) {
        const lastSection = sections[sections.length - 1];
        if (lastSection.type === 'simple') {
          setSections((prev) =>
            prev.map((section, index) => {
              if (index === prev.length - 1 && section.type === 'simple') {
                return {
                  ...section,
                  slots: {
                    main: [...section.slots.main, newBlock],
                  },
                };
              }
              return section;
            })
          );
        } else {
          const newSection = migrateBlocksToSections([newBlock])[0];
          setSections((prev) => [...prev, newSection]);
        }
      } else {
        const newSection = migrateBlocksToSections([newBlock])[0];
        setSections([newSection]);
      }
      setSelectedBlockId(newBlock.id);
      return;
    }

    // Handle moving existing blocks within sections
    const activeId = active.id as string;
    const activeLocation = findBlockLocation(sections, activeId);
    const overLocation = findBlockLocation(sections, over.id as string);
    
    // Handle reordering within the same section slot (handled by handleDragOver, but ensure it's set)
    if (activeLocation && overLocation && 
        activeLocation.sectionId === overLocation.sectionId &&
        activeLocation.slot === overLocation.slot) {
      // Already handled by handleDragOver
      setSelectedBlockId(activeId);
      return;
    }

    // Handle moving blocks between sections or slots
    const blockToMove = findBlockInSections(sections, activeId);
    if (!blockToMove || !activeLocation) return;

    // Check if dropping into a columns block
    if (overData?.containerId?.startsWith('columns:')) {
      const columnsBlockId = overData.columnsBlockId as string;
      const columnIndex = overData.columnIndex as number;
      
      // Remove from source
      const sectionsAfterRemove = sections.map((section) => {
        if (section.id !== activeLocation.sectionId) return section;
        
        if (section.type === 'simple') {
          return {
            ...section,
            slots: {
              main: section.slots.main.filter(b => b.id !== activeId),
            },
          };
        } else if (section.type === 'two-column') {
          const newSlots = { ...section.slots };
          if (activeLocation.slot === 'left') {
            newSlots.left = section.slots.left.filter(b => b.id !== activeId);
          } else {
            newSlots.right = section.slots.right.filter(b => b.id !== activeId);
          }
          return { ...section, slots: newSlots };
        }
        return section;
      });

      // Add to columns block
      setSections(sectionsAfterRemove.map((section) => {
        const findAndUpdateColumns = (blocks: Block[]): Block[] => {
          return blocks.map(block => {
            if (block.id === columnsBlockId && block.type === 'columns') {
              const columnsBlock = { ...block } as ColumnsBlock;
              const newChildren = [...columnsBlock.children];
              newChildren[columnIndex] = [...newChildren[columnIndex], blockToMove];
              return { ...columnsBlock, children: newChildren };
            }
            return block;
          });
        };

        if (section.type === 'simple') {
          const updatedMain = findAndUpdateColumns(section.slots.main);
          return { ...section, slots: { main: updatedMain } };
        } else if (section.type === 'two-column') {
          const updatedLeft = findAndUpdateColumns(section.slots.left);
          const updatedRight = findAndUpdateColumns(section.slots.right);
          return { ...section, slots: { left: updatedLeft, right: updatedRight } };
        }
        return section;
      }));
      
      setSelectedBlockId(activeId);
      return;
    }

    // Handle moving to a different section slot
    if (overLocation) {
      // Remove from source
      const sectionsAfterRemove = sections.map((section) => {
        if (section.id !== activeLocation.sectionId) return section;
        
        if (section.type === 'simple') {
          return {
            ...section,
            slots: {
              main: section.slots.main.filter(b => b.id !== activeId),
            },
          };
        } else if (section.type === 'two-column') {
          const newSlots = { ...section.slots };
          if (activeLocation.slot === 'left') {
            newSlots.left = section.slots.left.filter(b => b.id !== activeId);
          } else {
            newSlots.right = section.slots.right.filter(b => b.id !== activeId);
          }
          return { ...section, slots: newSlots };
        }
        return section;
      });

      // Add to destination
      setSections(sectionsAfterRemove.map((section) => {
        if (section.id !== overLocation.sectionId) return section;
        
        if (section.type === 'simple' && overLocation.slot === 'main') {
          const newSlots = { ...section.slots };
          newSlots.main = [...newSlots.main];
          newSlots.main.splice(overLocation.index, 0, blockToMove);
          return { ...section, slots: newSlots };
        } else if (section.type === 'two-column') {
          const newSlots = { ...section.slots };
          if (overLocation.slot === 'left') {
            newSlots.left = [...newSlots.left];
            newSlots.left.splice(overLocation.index, 0, blockToMove);
          } else {
            newSlots.right = [...newSlots.right];
            newSlots.right.splice(overLocation.index, 0, blockToMove);
          }
          return { ...section, slots: newSlots };
        }
        return section;
      }));
      
      setSelectedBlockId(activeId);
      return;
    }

    // Fallback: if dropped on empty canvas, move to last section
    if (over.id === 'empty-canvas' && sections.length > 0) {
      const lastSection = sections[sections.length - 1];
      if (lastSection.type === 'simple') {
        // Remove from source
        const sectionsAfterRemove = sections.map((section) => {
          if (section.id !== activeLocation.sectionId) return section;
          if (section.type === 'simple') {
            return {
              ...section,
              slots: {
                main: section.slots.main.filter(b => b.id !== activeId),
              },
            };
          } else if (section.type === 'two-column') {
            const newSlots = { ...section.slots };
            if (activeLocation.slot === 'left') {
              newSlots.left = section.slots.left.filter(b => b.id !== activeId);
            } else {
              newSlots.right = section.slots.right.filter(b => b.id !== activeId);
            }
            return { ...section, slots: newSlots };
          }
          return section;
        });

        // Add to last section
        setSections(sectionsAfterRemove.map((section, index) => {
          if (index === sectionsAfterRemove.length - 1 && section.type === 'simple') {
            return {
              ...section,
              slots: {
                main: [...section.slots.main, blockToMove],
              },
            };
          }
          return section;
        }));
        setSelectedBlockId(activeId);
      }
    }
  };

  // Keyboard support: Delete key removes selected block, Escape exits edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key exits edit mode
      if (e.key === 'Escape' && editingBlockId) {
        setEditingBlockId(null);
        return;
      }

      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedBlockId &&
        !isPreview &&
        !editingBlockId &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !document.activeElement?.closest('.ProseMirror')
      ) {
        e.preventDefault();
        handleDeleteBlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, editingBlockId, isPreview]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="app">
        {isPreview ? (
          <>
            <PreviewToolbar
              onBack={() => setIsPreview(false)}
              selectedDevice={selectedDevice}
              onDeviceChange={setSelectedDevice}
            />
            <div className="preview-container">
              <PreviewStage
                blocks={blocks}
                deviceType={selectedDevice}
                deviceConfig={deviceConfigs[selectedDevice]}
              />
            </div>
          </>
        ) : (
          <>
            <TopBar
              isPreview={isPreview}
              onTogglePreview={() => setIsPreview(!isPreview)}
            />
            <div className="app-content">
              <aside className="sidebar sidebar-left">
                <BlocksPalette onInsertBlock={handleInsertBlock} />
              </aside>
              <main className="main-content">
                <LessonCanvas
                  sections={sections}
                  selectedBlockId={selectedBlockId}
                  editingBlockId={editingBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onEditBlock={(blockId) => {
                    const block = findBlockInSections(sections, blockId);
                    if (block?.type === 'image') {
                      setImageModalBlockId(blockId);
                    } else {
                      setEditingBlockId(blockId);
                    }
                  }}
                  onStopEditing={() => setEditingBlockId(null)}
                  onUpdateBlock={handleUpdateBlock}
                  isPreview={isPreview}
                  activeId={activeId}
                  allBlocks={blocks}
                />
              </main>
              <aside className="sidebar sidebar-right">
                <PropertiesPanel
                  selectedBlock={selectedBlock}
                  onUpdateBlock={handleUpdateBlock}
                  onDeleteBlock={handleDeleteBlock}
                />
              </aside>
      </div>
          </>
        )}
      </div>

      {/* Image Fill Modal */}
      {imageModalBlockId && (() => {
        const imageBlock = findBlockInSections(sections, imageModalBlockId);
        if (imageBlock && imageBlock.type === 'image') {
          return (
            <ImageFillModal
              block={imageBlock}
              onUpdate={(updates) => handleUpdateBlock({ ...imageBlock, ...updates })}
              onClose={() => setImageModalBlockId(null)}
            />
          );
        }
        return null;
      })()}
    </DndContext>
  );
}

export default App;
