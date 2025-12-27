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
import type { Block, BlockType, ColumnsBlock, Section, ImageBlock, Row } from './types';
import { createBlock, createRow, createCell, createResource } from './types';
import { nanoid } from 'nanoid';
import { migrateBlocksToSections, extractBlocksFromSections, findBlockInSections, findBlockLocation } from './utils/sections';
import { findBlockInRows, findBlockLocationInRows, findCellInRows, extractBlocksFromRows, migrateSectionsToRows } from './utils/constructor';
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
  // Use rows as primary state (Row/Cell/Resource model)
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
  const [imageModalBlockId, setImageModalBlockId] = useState<string | null>(null);
  const [isPropertiesPanelVisible, setIsPropertiesPanelVisible] = useState(false);
  const [triggerSelectAllAndAI, setTriggerSelectAllAndAI] = useState(false);
  const [triggerSelectAll, setTriggerSelectAll] = useState(false);

  // Derive blocks from rows for backward compatibility (PreviewStage, etc.)
  const blocks = extractBlocksFromRows(rows);

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
    selectedBlockId ? findBlockInRows(rows, selectedBlockId) : null;

  const handleUpdateBlock = (updatedBlock: Block) => {
    setRows((prev) =>
      prev.map((row) => {
        const updatedCells = row.cells.map((cell) => {
          // First, check if the block is directly in the resource
          const blockIndex = cell.resource.blocks.findIndex(b => b.id === updatedBlock.id);
          if (blockIndex !== -1) {
            const updatedBlocks = [...cell.resource.blocks];
            updatedBlocks[blockIndex] = updatedBlock;
            return {
              ...cell,
              resource: {
                ...cell.resource,
                blocks: updatedBlocks,
              },
            };
          }
          
          // If not found, check if it's nested inside a columns block
          const findAndUpdateInColumns = (blocks: Block[]): Block[] => {
            return blocks.map(block => {
              if (block.type === 'columns') {
                const columnsBlock = { ...block } as ColumnsBlock;
                let found = false;
                const newChildren = columnsBlock.children.map((column) => {
                  const childIndex = column.findIndex(b => b.id === updatedBlock.id);
                  if (childIndex !== -1) {
                    found = true;
                    const updatedColumn = [...column];
                    updatedColumn[childIndex] = updatedBlock;
                    return updatedColumn;
                  }
                  return column;
                });
                if (found) {
                  return { ...columnsBlock, children: newChildren };
                }
              }
              return block;
            });
          };
          
          const updatedBlocks = findAndUpdateInColumns(cell.resource.blocks);
          if (updatedBlocks !== cell.resource.blocks) {
            return {
              ...cell,
              resource: {
                ...cell.resource,
                blocks: updatedBlocks,
              },
            };
          }
          
          return cell;
        });
        return { ...row, cells: updatedCells };
      })
    );
  };

  const handleUpdateRow = (updatedRow: Row) => {
    setRows((prev) =>
      prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
  };

  const handleDeleteBlock = (blockId?: string) => {
    const idToDelete = blockId || selectedBlockId;
    if (!idToDelete) return;
    
    const location = findBlockLocationInRows(rows, idToDelete);
    if (!location) return;

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== location.rowId) return row;
        
        const updatedCells = row.cells.map((cell) => {
          if (cell.id === location.cellId) {
            return {
              ...cell,
              resource: {
                ...cell.resource,
                blocks: cell.resource.blocks.filter(b => b.id !== idToDelete),
              },
            };
          }
          return cell;
        });
        
        return { ...row, cells: updatedCells };
      })
    );
    
    if (idToDelete === selectedBlockId) {
      setSelectedBlockId(null);
      setEditingBlockId(null);
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const blockToDuplicate = findBlockInRows(rows, blockId);
    if (!blockToDuplicate) return;

    const location = findBlockLocationInRows(rows, blockId);
    if (!location) return;

    const newBlock = { ...blockToDuplicate, id: nanoid() };
    
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== location.rowId) return row;
        
        const updatedCells = row.cells.map((cell) => {
          if (cell.id === location.cellId) {
            const blockIndex = cell.resource.blocks.findIndex(b => b.id === blockId);
            if (blockIndex !== -1) {
              const updatedBlocks = [...cell.resource.blocks];
              updatedBlocks.splice(blockIndex + 1, 0, newBlock);
              return {
                ...cell,
                resource: {
                  ...cell.resource,
                  blocks: updatedBlocks,
                },
              };
            }
          }
          return cell;
        });
        
        return { ...row, cells: updatedCells };
      })
    );
    
    setSelectedBlockId(newBlock.id);
  };

  const handleMoveBlock = (blockId: string) => {
    // For now, move just enables drag mode - the actual move is handled by drag and drop
    setSelectedBlockId(blockId);
  };

  const handleGenerateWithAI = (blockId: string) => {
    const block = findBlockInRows(rows, blockId);
    if (!block || (block.type !== 'text' && block.type !== 'header')) return;

    // Enter edit mode first
    setEditingBlockId(blockId);
    
    // Use a longer delay to ensure editor and BubbleToolbar are fully ready
    setTimeout(() => {
      setTriggerSelectAllAndAI(true);
      
      // Reset the trigger after it's been processed (longer delay to ensure event is caught)
      setTimeout(() => {
        setTriggerSelectAllAndAI(false);
      }, 1000);
    }, 300);
  };

  const handleInsertBlock = (blockType: BlockType) => {
    const newBlock = createBlock(blockType);

    // If no rows exist, create a new row with cell and resource
    if (rows.length === 0) {
      const resource = createResource([newBlock]);
      const cell = createCell(resource);
      const row = createRow([cell]);
      setRows([row]);
      setSelectedBlockId(newBlock.id);
      setEditingBlockId(null);
      return;
    }

    // Find the row containing the selected block
    if (selectedBlockId) {
      const location = findBlockLocationInRows(rows, selectedBlockId);
      if (location) {
        // Find the row and insert below it (create new row with cell/resource)
        const rowIndex = rows.findIndex(r => r.id === location.rowId);
        if (rowIndex !== -1) {
          // Create new row below the selected row
          const resource = createResource([newBlock]);
          const cell = createCell(resource);
          const newRow = createRow([cell]);
          
          setRows((prev) => {
            const newRows = [...prev];
            newRows.splice(rowIndex + 1, 0, newRow);
            return newRows;
          });
          setSelectedBlockId(newBlock.id);
          setEditingBlockId(null);
          return;
        }
      }
    }

    // No selection or row not found - append to last row's first cell
    const lastRow = rows[rows.length - 1];
    if (lastRow && lastRow.cells.length > 0) {
      setRows((prev) =>
        prev.map((row, index) => {
          if (index === prev.length - 1) {
            const firstCell = row.cells[0];
            const updatedResource = {
              ...firstCell.resource,
              blocks: [...firstCell.resource.blocks, newBlock],
            };
            const updatedFirstCell = {
              ...firstCell,
              resource: updatedResource,
            };
            return {
              ...row,
              cells: [updatedFirstCell, ...row.cells.slice(1)],
            };
          }
          return row;
        })
      );
    } else {
      // Create a new row
      const resource = createResource([newBlock]);
      const cell = createCell(resource);
      const newRow = createRow([cell]);
      setRows((prev) => [...prev, newRow]);
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

    // Only reorder existing blocks within the same cell's resource (not from palette)
    if (activeData?.source !== 'palette') {
      const activeLocation = findBlockLocationInRows(rows, active.id as string);
      const overLocation = findBlockLocationInRows(rows, over.id as string);
      
      // Only reorder if both blocks are in the same cell's resource
      if (activeLocation && overLocation && 
          activeLocation.rowId === overLocation.rowId &&
          activeLocation.cellId === overLocation.cellId) {
        setRows((prev) =>
          prev.map((row) => {
            if (row.id !== activeLocation.rowId) return row;
            const updatedCells = row.cells.map((cell) => {
              if (cell.id === activeLocation.cellId) {
                const updatedBlocks = arrayMove(
                  cell.resource.blocks,
                  activeLocation.index,
                  overLocation.index
                );
                return {
                  ...cell,
                  resource: {
                    ...cell.resource,
                    blocks: updatedBlocks,
                  },
                };
              }
              return cell;
            });
            return { ...row, cells: updatedCells };
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
        // Dropped on empty canvas - create a new Row/Cell/Resource
        const resource = createResource([newBlock]);
        const cell = createCell(resource);
        const row = createRow([cell]);
        setRows([row]);
        setSelectedBlockId(newBlock.id);
        return;
      }

      // Check if dropped into a columns block column
      if (overData?.containerId?.startsWith('columns:')) {
        const columnsBlockId = overData.columnsBlockId as string;
        const columnIndex = overData.columnIndex as number;
        
        // Find the columns block in any row/cell/resource and add the new block to it
        setRows((prev) =>
          prev.map((row) => {
            const updatedCells = row.cells.map((cell) => {
              const findAndUpdateColumns = (blocks: Block[]): Block[] => {
                return blocks.map(block => {
                  if (block.id === columnsBlockId && block.type === 'columns') {
                    const columnsBlock = { ...block } as ColumnsBlock;
                    const newChildren = [...columnsBlock.children];
                    if (!newChildren[columnIndex]) {
                      newChildren[columnIndex] = [];
                    }
                    newChildren[columnIndex] = [...newChildren[columnIndex], newBlock];
                    return { ...columnsBlock, children: newChildren };
                  }
                  return block;
                });
              };
              
              const updatedBlocks = findAndUpdateColumns(cell.resource.blocks);
              if (updatedBlocks !== cell.resource.blocks) {
                return {
                  ...cell,
                  resource: {
                    ...cell.resource,
                    blocks: updatedBlocks,
                  },
                };
              }
              return cell;
            });
            return { ...row, cells: updatedCells };
          })
        );
        
        setSelectedBlockId(newBlock.id);
        return;
      }

      // Check if dropped into a cell
      if (overData?.type === 'cell' && overData?.cellId) {
        const cellId = overData.cellId as string;
        const cellInfo = findCellInRows(rows, cellId);
        if (cellInfo) {
          setRows((prev) =>
            prev.map((row) => {
              if (row.id !== cellInfo.row.id) return row;
              const updatedCells = row.cells.map((cell) => {
                if (cell.id === cellId) {
                  return {
                    ...cell,
                    resource: {
                      ...cell.resource,
                      blocks: [...cell.resource.blocks, newBlock],
                    },
                  };
                }
                return cell;
              });
              return { ...row, cells: updatedCells };
            })
          );
          setSelectedBlockId(newBlock.id);
          return;
        }
      }

      // Dropped on a block - insert into the same cell's resource
      const overLocation = findBlockLocationInRows(rows, over.id as string);
      if (overLocation) {
        setRows((prev) =>
          prev.map((row) => {
            if (row.id !== overLocation.rowId) return row;
            const updatedCells = row.cells.map((cell) => {
              if (cell.id === overLocation.cellId) {
                const updatedBlocks = [...cell.resource.blocks];
                updatedBlocks.splice(overLocation.index, 0, newBlock);
                return {
                  ...cell,
                  resource: {
                    ...cell.resource,
                    blocks: updatedBlocks,
                  },
                };
              }
              return cell;
            });
            return { ...row, cells: updatedCells };
          })
        );
        setSelectedBlockId(newBlock.id);
        return;
      }

      // Fallback: append to last row's first cell or create new row
      if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        if (lastRow.cells.length > 0) {
          setRows((prev) =>
            prev.map((row, index) => {
              if (index === prev.length - 1) {
                const firstCell = row.cells[0];
                const updatedResource = {
                  ...firstCell.resource,
                  blocks: [...firstCell.resource.blocks, newBlock],
                };
                const updatedFirstCell = {
                  ...firstCell,
                  resource: updatedResource,
                };
                return {
                  ...row,
                  cells: [updatedFirstCell, ...row.cells.slice(1)],
                };
              }
              return row;
            })
          );
        } else {
          // Create a new row
          const resource = createResource([newBlock]);
          const cell = createCell(resource);
          const newRow = createRow([cell]);
          setRows((prev) => [...prev, newRow]);
        }
      } else {
        // Create a new row
        const resource = createResource([newBlock]);
        const cell = createCell(resource);
        const newRow = createRow([cell]);
        setRows([newRow]);
      }
      setSelectedBlockId(newBlock.id);
      return;
    }

    // Handle moving existing blocks between rows/cells
    const activeId = active.id as string;
    const activeLocation = findBlockLocationInRows(rows, activeId);
    const blockToMove = findBlockInRows(rows, activeId);
    
    if (!blockToMove || !activeLocation) return;

    // Check if dropping into a cell
    if (overData?.type === 'cell' && overData?.cellId) {
      const targetCellId = overData.cellId as string;
      const targetCellInfo = findCellInRows(rows, targetCellId);
      
      if (targetCellInfo) {
        // Remove from source
        const rowsAfterRemove = rows.map((row) => {
          if (row.id !== activeLocation.rowId) return row;
          const updatedCells = row.cells.map((cell) => {
            if (cell.id === activeLocation.cellId) {
              return {
                ...cell,
                resource: {
                  ...cell.resource,
                  blocks: cell.resource.blocks.filter(b => b.id !== activeId),
                },
              };
            }
            return cell;
          });
          return { ...row, cells: updatedCells };
        });

        // Add to target cell
        setRows(rowsAfterRemove.map((row) => {
          if (row.id !== targetCellInfo.row.id) return row;
          const updatedCells = row.cells.map((cell) => {
            if (cell.id === targetCellId) {
              return {
                ...cell,
                resource: {
                  ...cell.resource,
                  blocks: [...cell.resource.blocks, blockToMove],
                },
              };
            }
            return cell;
          });
          return { ...row, cells: updatedCells };
        }));
        
        setSelectedBlockId(activeId);
        return;
      }
    }

    // Check if dropping on another block (insert at that position)
    const overLocation = findBlockLocationInRows(rows, over.id as string);
    
    // Handle reordering within the same cell (already handled by handleDragOver)
    if (activeLocation && overLocation && 
        activeLocation.rowId === overLocation.rowId &&
        activeLocation.cellId === overLocation.cellId) {
      // Already handled by handleDragOver
      setSelectedBlockId(activeId);
      return;
    }

    // Check if dropping into a columns block (nested within a resource)
    if (overData?.containerId?.startsWith('columns:')) {
      const columnsBlockId = overData.columnsBlockId as string;
      const columnIndex = overData.columnIndex as number;
      
      // Remove from source
      const rowsAfterRemove = rows.map((row) => {
        if (row.id !== activeLocation.rowId) return row;
        const updatedCells = row.cells.map((cell) => {
          if (cell.id === activeLocation.cellId) {
            return {
              ...cell,
              resource: {
                ...cell.resource,
                blocks: cell.resource.blocks.filter(b => b.id !== activeId),
              },
            };
          }
          return cell;
        });
        return { ...row, cells: updatedCells };
      });

      // Add to columns block (find it in any row/cell/resource)
      setRows(rowsAfterRemove.map((row) => {
        const updatedCells = row.cells.map((cell) => {
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
          
          const updatedBlocks = findAndUpdateColumns(cell.resource.blocks);
          if (updatedBlocks !== cell.resource.blocks) {
            return {
              ...cell,
              resource: {
                ...cell.resource,
                blocks: updatedBlocks,
              },
            };
          }
          return cell;
        });
        return { ...row, cells: updatedCells };
      }));
      
      setSelectedBlockId(activeId);
      return;
    }

    // Handle moving to a different cell or row
    if (overLocation) {
      // Remove from source
      const rowsAfterRemove = rows.map((row) => {
        if (row.id !== activeLocation.rowId) return row;
        const updatedCells = row.cells.map((cell) => {
          if (cell.id === activeLocation.cellId) {
            return {
              ...cell,
              resource: {
                ...cell.resource,
                blocks: cell.resource.blocks.filter(b => b.id !== activeId),
              },
            };
          }
          return cell;
        });
        return { ...row, cells: updatedCells };
      });

      // Add to destination
      setRows(rowsAfterRemove.map((row) => {
        if (row.id !== overLocation.rowId) return row;
        const updatedCells = row.cells.map((cell) => {
          if (cell.id === overLocation.cellId) {
            const updatedBlocks = [...cell.resource.blocks];
            updatedBlocks.splice(overLocation.index, 0, blockToMove);
            return {
              ...cell,
              resource: {
                ...cell.resource,
                blocks: updatedBlocks,
              },
            };
          }
          return cell;
        });
        return { ...row, cells: updatedCells };
      }));
      
      setSelectedBlockId(activeId);
      return;
    }

    // Fallback: if dropped on empty canvas, move to last row's first cell
    if (over.id === 'empty-canvas' && rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      if (lastRow.cells.length > 0) {
        // Remove from source
        const rowsAfterRemove = rows.map((row) => {
          if (row.id !== activeLocation.rowId) return row;
          const updatedCells = row.cells.map((cell) => {
            if (cell.id === activeLocation.cellId) {
              return {
                ...cell,
                resource: {
                  ...cell.resource,
                  blocks: cell.resource.blocks.filter(b => b.id !== activeId),
                },
              };
            }
            return cell;
          });
          return { ...row, cells: updatedCells };
        });

        // Add to last row's first cell
        setRows(rowsAfterRemove.map((row, index) => {
          if (index === rowsAfterRemove.length - 1) {
            const firstCell = row.cells[0];
            const updatedResource = {
              ...firstCell.resource,
              blocks: [...firstCell.resource.blocks, blockToMove],
            };
            const updatedFirstCell = {
              ...firstCell,
              resource: updatedResource,
            };
            return {
              ...row,
              cells: [updatedFirstCell, ...row.cells.slice(1)],
            };
          }
          return row;
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
              isPropertiesPanelVisible={isPropertiesPanelVisible}
              onTogglePropertiesPanel={() => setIsPropertiesPanelVisible(!isPropertiesPanelVisible)}
            />
            <div className="app-content">
              <aside className="sidebar sidebar-left">
                <BlocksPalette onInsertBlock={handleInsertBlock} />
              </aside>
              <main className="main-content">
                <LessonCanvas
                  rows={rows}
                  selectedBlockId={selectedBlockId}
                  editingBlockId={editingBlockId}
                  onSelectBlock={(blockId) => {
                    setSelectedBlockId(blockId);
                    // Always stop editing when selecting a block (even if it's the same block)
                    // This ensures that after AI editing, clicking the block again will show the toolbar
                    if (editingBlockId) {
                      setEditingBlockId(null);
                    }
                  }}
                  onEditBlock={(blockId, fromDoubleClick = false) => {
                    const block = findBlockInRows(rows, blockId);
                    if (block?.type === 'image') {
                      setImageModalBlockId(blockId);
                    } else {
                      setEditingBlockId(blockId);
                      // For text/header blocks, trigger select-all only on double-click
                      if ((block?.type === 'text' || block?.type === 'header') && fromDoubleClick) {
                        setTriggerSelectAll(true);
                        // Reset after a delay to allow the selection to happen
                        setTimeout(() => {
                          setTriggerSelectAll(false);
                        }, 500);
                      }
                    }
                  }}
                  onStopEditing={() => setEditingBlockId(null)}
                  onUpdateBlock={handleUpdateBlock}
                  onUpdateRow={handleUpdateRow}
                  onDeleteBlock={handleDeleteBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  onMoveBlock={handleMoveBlock}
                  onGenerateWithAI={handleGenerateWithAI}
                  isPreview={isPreview}
                  activeId={activeId}
                  allBlocks={blocks}
                  isPropertiesPanelVisible={isPropertiesPanelVisible}
                  triggerSelectAllAndAI={triggerSelectAllAndAI}
                />
              </main>
              {isPropertiesPanelVisible && (
                <aside className="sidebar sidebar-right">
                  <PropertiesPanel
                    selectedBlock={selectedBlock}
                    onUpdateBlock={handleUpdateBlock}
                    onDeleteBlock={handleDeleteBlock}
                  />
                </aside>
              )}
      </div>
          </>
        )}
      </div>

      {/* Image Fill Modal */}
      {imageModalBlockId && (() => {
        const imageBlock = findBlockInRows(rows, imageModalBlockId);
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
