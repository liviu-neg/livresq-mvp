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
import type { Block, BlockType, ColumnsBlock, Row, Resource } from './types';
import { createBlock } from './types';
import { 
  extractBlocksFromSections, 
  findBlockInSections, 
  migrateRowsToSections,
  findBlockInRows,
  findBlockLocationInRows,
  findResourceLocation,
  createNewRow,
  createNewConstructor,
  isBlock,
  isConstructor,
} from './utils/sections';
import './App.css';


function App() {
  // Use rows as primary state (Row/Cell/Resource model)
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null); // Track selected row for insertion
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
  const [imageModalBlockId, setImageModalBlockId] = useState<string | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [showStructureStrokes, setShowStructureStrokes] = useState(false);

  // Derive sections from rows for backward compatibility (rendering, PreviewStage, etc.)
  const sections = migrateRowsToSections(rows);
  const blocks = extractBlocksFromSections(sections);
  
  // When a block is selected, also track which row it's in (for insertion rule C)
  useEffect(() => {
    if (selectedBlockId) {
      const location = findBlockLocationInRows(rows, selectedBlockId);
      if (location) {
        setSelectedRowId(location.rowId);
      } else {
        setSelectedRowId(null);
      }
    } else {
      setSelectedRowId(null);
    }
  }, [selectedBlockId, rows]);

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
    const updateBlockInRows = (rowsToUpdate: Row[]): Row[] => {
      return rowsToUpdate.map((row) => {
        const updatedCells = row.cells.map((cell) => {
          const updatedResources = cell.resources.map((resource) => {
            if (isBlock(resource) && resource.id === updatedBlock.id) {
              return updatedBlock;
            }
            if (isConstructor(resource)) {
              // Recursively update nested constructors
              return updateBlockInRows([resource])[0];
            }
            return resource;
          });
          return { ...cell, resources: updatedResources };
        });
        return { ...row, cells: updatedCells };
      });
    };

    setRows(updateBlockInRows(rows));
  };

  const handleDeleteBlock = () => {
    if (!selectedBlockId) return;
    
    const location = findBlockLocationInRows(rows, selectedBlockId);
    if (!location) return;

    const deleteBlockFromRows = (rowsToUpdate: Row[]): Row[] => {
      return rowsToUpdate.map((row) => {
        if (row.id !== location.rowId) {
          // Recursively check nested constructors
          const updatedCells = row.cells.map((cell) => {
            const updatedResources = cell.resources
              .filter((resource) => {
                if (isBlock(resource)) {
                  return resource.id !== selectedBlockId;
                }
                if (isConstructor(resource)) {
                  // Recursively delete from nested constructors
                  const nestedLocation = findBlockLocationInRows([resource], selectedBlockId);
                  if (nestedLocation) {
                    const updatedNested = deleteBlockFromRows([resource])[0];
                    // If constructor becomes empty, remove it
                    return updatedNested.cells.some(c => c.resources.length > 0);
                  }
                  return true;
                }
                return true;
              })
              .map((resource) => {
                if (isConstructor(resource)) {
                  return deleteBlockFromRows([resource])[0];
                }
                return resource;
              });
            return { ...cell, resources: updatedResources };
          });
          return { ...row, cells: updatedCells };
        }
        
        // This is the row containing the block to delete
        return {
          ...row,
          cells: row.cells.map((cell) => {
            if (cell.id !== location.cellId) return cell;
            return {
              ...cell,
              resources: cell.resources.filter((resource) => {
                if (isBlock(resource)) {
                  return resource.id !== selectedBlockId;
                }
                if (isConstructor(resource)) {
                  // Recursively delete from nested constructors
                  const nestedLocation = findBlockLocationInRows([resource], selectedBlockId);
                  if (nestedLocation) {
                    const updatedNested = deleteBlockFromRows([resource])[0];
                    return updatedNested.cells.some(c => c.resources.length > 0);
                  }
                  return true;
                }
                return true;
              }).map((resource) => {
                if (isConstructor(resource)) {
                  return deleteBlockFromRows([resource])[0];
                }
                return resource;
              }),
            };
          }),
        };
      });
    };

    setRows(deleteBlockFromRows(rows));
    setSelectedBlockId(null);
    setEditingBlockId(null);
  };

  const handleDuplicateBlock = () => {
    if (!selectedBlockId) return;
    
    const blockToDuplicate = findBlockInRows(rows, selectedBlockId);
    if (!blockToDuplicate) return;

    const location = findBlockLocationInRows(rows, selectedBlockId);
    if (!location) return;

    // Create a new block with same properties but new ID
    const duplicatedBlock = { ...blockToDuplicate, id: crypto.randomUUID() };

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== location.rowId) return row;
        return {
          ...row,
          cells: row.cells.map((cell) => {
            if (cell.id !== location.cellId) return cell;
            const newResources = [...cell.resources];
            newResources.splice(location.index + 1, 0, duplicatedBlock);
            return { ...cell, resources: newResources };
          }),
        };
      })
    );
    
    setSelectedBlockId(duplicatedBlock.id);
    setEditingBlockId(null);
  };

  const handleInsertBlock = (blockType: BlockType) => {
    const newBlock = createBlock(blockType);

    // Rule C: If a Row is selected, insert new Section (Row + Cell + Resource) below it
    if (selectedRowId) {
      const selectedRowIndex = rows.findIndex(r => r.id === selectedRowId);
      if (selectedRowIndex !== -1) {
        // Create new Row with one Cell containing the new Block
        const newRow = createNewRow();
        newRow.cells[0].resources = [newBlock];
        
        setRows((prev) => {
          const newRows = [...prev];
          newRows.splice(selectedRowIndex + 1, 0, newRow);
          return newRows;
        });
        
        setSelectedBlockId(newBlock.id);
        setEditingBlockId(null);
        return;
      }
    }

    // If no rows exist, create one
    if (rows.length === 0) {
      const newRow = createNewRow();
      newRow.cells[0].resources = [newBlock];
      setRows([newRow]);
      setSelectedBlockId(newBlock.id);
      setEditingBlockId(null);
      return;
    }

    // If a block is selected, find its location and insert after it in the same cell
    if (selectedBlockId) {
      const location = findBlockLocationInRows(rows, selectedBlockId);
      if (location) {
        setRows((prev) =>
          prev.map((row) => {
            if (row.id !== location.rowId) return row;
            return {
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.id !== location.cellId) return cell;
                const newResources = [...cell.resources];
                newResources.splice(location.index + 1, 0, newBlock);
                return { ...cell, resources: newResources };
              }),
            };
          })
        );
        setSelectedBlockId(newBlock.id);
        setEditingBlockId(null);
        return;
      }
    }

    // Fallback: append to last row's first cell
    setRows((prev) => {
      if (prev.length === 0) {
        const newRow = createNewRow();
        newRow.cells[0].resources = [newBlock];
        return [newRow];
      }
      return prev.map((row, index) => {
        if (index === prev.length - 1 && row.cells.length > 0) {
          return {
            ...row,
            cells: row.cells.map((cell, cellIndex) => {
              if (cellIndex === 0) {
                return {
                  ...cell,
                  resources: [...cell.resources, newBlock],
                };
              }
              return cell;
            }),
          };
        }
        return row;
      });
    });

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

    // Only reorder existing blocks within the same cell (not from palette, not in columns)
    if (activeData?.source !== 'palette' && !activeData?.containerId?.startsWith('columns:')) {
      const activeLocation = findBlockLocationInRows(rows, active.id as string);
      const overLocation = findBlockLocationInRows(rows, over.id as string);
      
      // Only reorder if both blocks are in the same row and cell
      if (activeLocation && overLocation && 
          activeLocation.rowId === overLocation.rowId &&
          activeLocation.cellId === overLocation.cellId) {
        setRows((prev) =>
          prev.map((row) => {
            if (row.id !== activeLocation.rowId) return row;
            return {
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.id !== activeLocation.cellId) return cell;
                const newResources = [...cell.resources];
                // Only reorder blocks, not constructors
                const blockIndices = newResources
                  .map((r, i) => isBlock(r) ? i : -1)
                  .filter(i => i !== -1);
                const activeBlockIndex = blockIndices.indexOf(activeLocation.index);
                const overBlockIndex = blockIndices.indexOf(overLocation.index);
                if (activeBlockIndex !== -1 && overBlockIndex !== -1) {
                  const blocks = blockIndices.map(i => newResources[i] as Block);
                  const reorderedBlocks = arrayMove(blocks, activeBlockIndex, overBlockIndex);
                  blockIndices.forEach((originalIndex, i) => {
                    newResources[originalIndex] = reorderedBlocks[i];
                  });
                }
                return { ...cell, resources: newResources };
              }),
            };
          })
        );
      }
    }
  };

  // Helper function to clean up empty cells and rows
  const cleanupEmptyCellsAndRows = (rowsToClean: Row[]): Row[] => {
    return rowsToClean
      .map((row) => {
        // Remove empty cells (cells with no resources)
        const nonEmptyCells = row.cells.filter((cell) => cell.resources.length > 0);
        
        // If row has no cells left, return null to filter it out
        if (nonEmptyCells.length === 0) {
          return null;
        }
        
        return {
          ...row,
          cells: nonEmptyCells,
        };
      })
      .filter((row): row is Row => row !== null);
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
      
      // Rule D: Special constructor item (for now, treat 'columns' as constructor)
      if (blockType === 'columns') {
        // Insert only structure (Row + Cells) with empty Resources
        const newConstructor = createNewConstructor(2); // Default 2 columns
        
        if (over.id === 'empty-canvas') {
          setRows([newConstructor]);
          return;
        }
        
        // Find where to insert
        const overLocation = findResourceLocation(rows, over.id as string);
        if (overLocation) {
          setRows((prev) =>
            prev.map((row) => {
              if (row.id !== overLocation.rowId) return row;
              return {
                ...row,
                cells: row.cells.map((cell) => {
                  if (cell.id !== overLocation.cellId) return cell;
                  const newResources = [...cell.resources];
                  newResources.splice(overLocation.index + 1, 0, newConstructor);
                  return { ...cell, resources: newResources };
                }),
              };
            })
          );
        } else {
          // Append to last row's first cell
          setRows((prev) => {
            if (prev.length === 0) return [newConstructor];
            return prev.map((row, index) => {
              if (index === prev.length - 1 && row.cells.length > 0) {
                return {
                  ...row,
                  cells: row.cells.map((cell, cellIndex) => {
                    if (cellIndex === 0) {
                      return {
                        ...cell,
                        resources: [...cell.resources, newConstructor],
                      };
                    }
                    return cell;
                  }),
                };
              }
              return row;
            });
          });
        }
        return;
      }
      
      // Regular block type
      const newBlock = createBlock(blockType);

      // Rule A: Dropped outside any existing Section/Cell
      if (over.id === 'empty-canvas') {
        // Create new Section: new Row + new Cell + new Resource
        const newRow = createNewRow();
        newRow.cells[0].resources = [newBlock];
        setRows([newRow]);
        setSelectedBlockId(newBlock.id);
        return;
      }

      // Check if dropped into a column (columns block within a row)
      if (overData?.containerId?.startsWith('columns:')) {
        const columnsBlockId = overData.columnsBlockId as string;
        const columnIndex = overData.columnIndex as number;
        
        // Helper to find and update columns block in resources
        const findAndUpdateColumns = (resources: Resource[]): Resource[] => {
          return resources.map(resource => {
            if (isBlock(resource) && resource.id === columnsBlockId && resource.type === 'columns') {
              const columnsBlock = { ...resource } as ColumnsBlock;
              const newChildren = [...columnsBlock.children];
              newChildren[columnIndex] = [...newChildren[columnIndex], newBlock];
              return { ...columnsBlock, children: newChildren };
            }
            if (isConstructor(resource)) {
              return {
                ...resource,
                cells: resource.cells.map(cell => ({
                  ...cell,
                  resources: findAndUpdateColumns(cell.resources),
                })),
              };
            }
            return resource;
          });
        };
        
        setRows((prev) =>
          prev.map((row) => ({
            ...row,
            cells: row.cells.map((cell) => ({
              ...cell,
              resources: findAndUpdateColumns(cell.resources),
            })),
          }))
        );
        setSelectedBlockId(newBlock.id);
        return;
      }

      // Rule B: Dropped on an existing block/cell - insert into target Cell's resources (vertical flow)
      // Do NOT create new Rows/Cells
      const overLocation = findBlockLocationInRows(rows, over.id as string);
      if (overLocation) {
        setRows((prev) =>
          prev.map((row) => {
            if (row.id !== overLocation.rowId) return row;
            return {
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.id !== overLocation.cellId) return cell;
                const newResources = [...cell.resources];
                newResources.splice(overLocation.index, 0, newBlock);
                return { ...cell, resources: newResources };
              }),
            };
          })
        );
        setSelectedBlockId(newBlock.id);
        return;
      }

      // Fallback: append to last row's first cell or create new row
      if (rows.length > 0 && rows[rows.length - 1].cells.length > 0) {
        setRows((prev) =>
          prev.map((row, index) => {
            if (index === prev.length - 1 && row.cells.length > 0) {
              return {
                ...row,
                cells: row.cells.map((cell, cellIndex) => {
                  if (cellIndex === 0) {
                    return {
                      ...cell,
                      resources: [...cell.resources, newBlock],
                    };
                  }
                  return cell;
                }),
              };
            }
            return row;
          })
        );
      } else {
        const newRow = createNewRow();
        newRow.cells[0].resources = [newBlock];
        setRows((prev) => (prev.length > 0 ? [...prev, newRow] : [newRow]));
      }
      setSelectedBlockId(newBlock.id);
      return;
    }

    // Handle moving existing blocks within rows
    const activeBlockId = active.id as string;
    const activeLocation = findBlockLocationInRows(rows, activeBlockId);
    const overLocation = findBlockLocationInRows(rows, over.id as string);
    
    // Handle reordering within the same cell (handled by handleDragOver, but ensure it's set)
    if (activeLocation && overLocation && 
        activeLocation.rowId === overLocation.rowId &&
        activeLocation.cellId === overLocation.cellId) {
      // Already handled by handleDragOver
      setSelectedBlockId(activeBlockId);
      return;
    }

    // Handle moving blocks between rows or cells
    const blockToMove = findBlockInRows(rows, activeBlockId);
    if (!blockToMove || !activeLocation) return;

    // Check if dropping into a columns block
    if (overData?.containerId?.startsWith('columns:')) {
      const columnsBlockId = overData.columnsBlockId as string;
      const columnIndex = overData.columnIndex as number;
      
      // Remove from source (using the removeBlockFromRows helper pattern)
      const removeBlockFromRows = (rowsToUpdate: Row[]): Row[] => {
        return rowsToUpdate.map((row) => {
          if (row.id !== activeLocation.rowId) {
            // Recursively check nested constructors
            return {
              ...row,
              cells: row.cells.map((cell) => {
                return {
                  ...cell,
                  resources: cell.resources
                    .filter((resource) => {
                      if (isBlock(resource)) {
                        return resource.id !== activeBlockId;
                      }
                      if (isConstructor(resource)) {
                        return true;
                      }
                      return true;
                    })
                    .map((resource) => {
                      if (isConstructor(resource)) {
                        return removeBlockFromRows([resource])[0];
                      }
                      return resource;
                    }),
                };
              }),
            };
          }
          
          return {
            ...row,
            cells: row.cells.map((cell) => {
              if (cell.id !== activeLocation.cellId) return cell;
              return {
                ...cell,
                resources: cell.resources.filter((resource) => {
                  if (isBlock(resource)) {
                    return resource.id !== activeBlockId;
                  }
                  return true;
                }),
              };
            }),
          };
        });
      };

      let rowsAfterRemove = removeBlockFromRows(rows);
      
      // Clean up empty cells and rows
      rowsAfterRemove = cleanupEmptyCellsAndRows(rowsAfterRemove);

      // Helper to find and update columns block in resources
      const findAndUpdateColumns = (resources: Resource[]): Resource[] => {
        return resources.map(resource => {
          if (isBlock(resource) && resource.id === columnsBlockId && resource.type === 'columns') {
            const columnsBlock = { ...resource } as ColumnsBlock;
            const newChildren = [...columnsBlock.children];
            newChildren[columnIndex] = [...newChildren[columnIndex], blockToMove];
            return { ...columnsBlock, children: newChildren };
          }
          if (isConstructor(resource)) {
            return {
              ...resource,
              cells: resource.cells.map(cell => ({
                ...cell,
                resources: findAndUpdateColumns(cell.resources),
              })),
            };
          }
          return resource;
        });
      };

      // Add to columns block
      setRows(
        rowsAfterRemove.map((row) => ({
          ...row,
          cells: row.cells.map((cell) => ({
            ...cell,
            resources: findAndUpdateColumns(cell.resources),
          })),
        }))
      );
      
      setSelectedBlockId(activeBlockId);
      return;
    }

    // Handle moving to a different row or cell
    if (overLocation) {
      // Remove from source
      const removeBlockFromRows = (rowsToUpdate: Row[]): Row[] => {
        return rowsToUpdate.map((row) => {
          if (row.id !== activeLocation.rowId) {
            // Recursively check nested constructors
            return {
              ...row,
              cells: row.cells.map((cell) => {
                return {
                  ...cell,
                  resources: cell.resources
                    .filter((resource) => {
                      if (isBlock(resource)) {
                        return resource.id !== activeId;
                      }
                      if (isConstructor(resource)) {
                        return true; // Keep constructor, will filter inside
                      }
                      return true;
                    })
                    .map((resource) => {
                      if (isConstructor(resource)) {
                        return removeBlockFromRows([resource])[0];
                      }
                      return resource;
                    }),
                };
              }),
            };
          }
          
          // This is the source row
          return {
            ...row,
            cells: row.cells.map((cell) => {
              if (cell.id !== activeLocation.cellId) return cell;
              return {
                ...cell,
                resources: cell.resources.filter((resource) => {
                  if (isBlock(resource)) {
                    return resource.id !== activeId;
                  }
                  if (isConstructor(resource)) {
                    // Recursively remove from nested constructors
                    const nestedLocation = findBlockLocationInRows([resource], activeBlockId);
                    if (nestedLocation) {
                      const updatedNested = removeBlockFromRows([resource])[0];
                      return updatedNested.cells.some(c => c.resources.length > 0);
                    }
                    return true;
                  }
                  return true;
                }).map((resource) => {
                  if (isConstructor(resource)) {
                    return removeBlockFromRows([resource])[0];
                  }
                  return resource;
                }),
              };
            }),
          };
        });
      };

      let rowsAfterRemove = removeBlockFromRows(rows);
      
      // Clean up empty cells and rows
      rowsAfterRemove = cleanupEmptyCellsAndRows(rowsAfterRemove);

      // Add to destination
      setRows(
        rowsAfterRemove.map((row) => {
          if (row.id !== overLocation.rowId) return row;
          return {
            ...row,
            cells: row.cells.map((cell) => {
              if (cell.id !== overLocation.cellId) return cell;
              const newResources = [...cell.resources];
              newResources.splice(overLocation.index, 0, blockToMove);
              return { ...cell, resources: newResources };
            }),
          };
        })
      );
      
      setSelectedBlockId(activeBlockId);
      return;
    }

    // Fallback: if dropped on empty canvas, move to last row
    if (over.id === 'empty-canvas' && rows.length > 0) {
      if (rows[rows.length - 1].cells.length > 0) {
        // Remove from source
        const removeBlockFromRows = (rowsToUpdate: Row[]): Row[] => {
          return rowsToUpdate.map((row) => {
            if (row.id !== activeLocation.rowId) {
              return {
                ...row,
                cells: row.cells.map((cell) => {
                  return {
                    ...cell,
                    resources: cell.resources
                      .filter((resource) => {
                        if (isBlock(resource)) {
                          return resource.id !== activeBlockId;
                        }
                        return true;
                      }),
                  };
                }),
              };
            }
            
            return {
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.id !== activeLocation.cellId) return cell;
                return {
                  ...cell,
                resources: cell.resources.filter((resource) => {
                  if (isBlock(resource)) {
                    return resource.id !== activeBlockId;
                  }
                  return true;
                }),
                };
              }),
            };
          });
        };

        let rowsAfterRemove = removeBlockFromRows(rows);
        
        // Clean up empty cells and rows
        rowsAfterRemove = cleanupEmptyCellsAndRows(rowsAfterRemove);

        // Add to last row's first cell
        setRows(
          rowsAfterRemove.map((row, index) => {
            if (index === rowsAfterRemove.length - 1 && row.cells.length > 0) {
              return {
                ...row,
                cells: row.cells.map((cell, cellIndex) => {
                  if (cellIndex === 0) {
                    return {
                      ...cell,
                      resources: [...cell.resources, blockToMove],
                    };
                  }
                  return cell;
                }),
              };
            }
            return row;
          })
        );
        setSelectedBlockId(activeBlockId);
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
  }, [selectedBlockId, editingBlockId, isPreview, handleDeleteBlock]);

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
                      isRightSidebarOpen={isRightSidebarOpen}
                      onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                      showStructureStrokes={showStructureStrokes}
                      onToggleStructureStrokes={() => setShowStructureStrokes(!showStructureStrokes)}
                    />
            <div className="app-content">
              <aside className="sidebar sidebar-left">
                <BlocksPalette onInsertBlock={handleInsertBlock} />
              </aside>
              <main className={`main-content${!isRightSidebarOpen ? ' main-content-full' : ''}`}>
                <LessonCanvas
                  sections={sections}
                  rows={rows}
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
                  onDeleteBlock={handleDeleteBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  isPreview={isPreview}
                  activeId={activeId}
                  allBlocks={blocks}
                  showStructureStrokes={showStructureStrokes}
                />
              </main>
              {isRightSidebarOpen && (
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
