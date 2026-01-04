import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
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
import type { Block, BlockType, ColumnsBlock, Row, Cell, Resource, SectionTemplate } from './types';
import { createBlock, getPredefinedSections } from './types';
import { 
  extractBlocksFromSections, 
  findBlockInSections, 
  migrateRowsToSections,
  findBlockInRows,
  findBlockLocationInRows,
  findResourceLocation,
  findCellInRows,
  findCellLocationInRows,
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
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
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
  
  // Track which row contains the selected block (for insertion rule C) - separate from row selection
  // This is used for insertion logic but doesn't affect row selection state
  const getSelectedBlockRowId = (): string | null => {
    if (selectedBlockId) {
      const location = findBlockLocationInRows(rows, selectedBlockId);
      return location ? location.rowId : null;
  }
  return null;
  };

  // Track newly inserted block to scroll to its row
  const [newlyInsertedBlockId, setNewlyInsertedBlockId] = useState<string | null>(null);

  // Scroll to row containing newly inserted block
  useEffect(() => {
    if (!newlyInsertedBlockId) return;

    let retryCount = 0;
    const MAX_RETRIES = 20; // Max 1 second of retries (20 * 50ms)

    const scrollToNewRow = () => {
      const location = findBlockLocationInRows(rows, newlyInsertedBlockId);
      if (!location) {
        // Retry if location not found yet
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(scrollToNewRow, 50);
        } else {
          // Give up after max retries
          setNewlyInsertedBlockId(null);
        }
        return;
      }

      const rowElement = document.querySelector(`[data-row-id="${location.rowId}"]`) as HTMLElement;
      if (!rowElement) {
        // Retry if element not found yet
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(scrollToNewRow, 50);
        } else {
          // Give up after max retries
          setNewlyInsertedBlockId(null);
        }
        return;
      }

      // Check if row is visible (with some tolerance)
      const rect = rowElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportTop = 0;
      const viewportBottom = viewportHeight;
      
      // Consider visible if at least 50% of the row is in viewport
      const rowHeight = rect.height;
      const visibleTop = Math.max(rect.top, viewportTop);
      const visibleBottom = Math.min(rect.bottom, viewportBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const isVisible = visibleHeight >= (rowHeight * 0.5);

      if (!isVisible) {
        rowElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }

      // Clear the flag after scrolling
      setNewlyInsertedBlockId(null);
    };

    // Use multiple RAFs to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToNewRow();
      });
    });
  }, [newlyInsertedBlockId, rows]);

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

  const handleDeleteCell = () => {
    if (!selectedCellId) return;
    
    const location = findCellLocationInRows(rows, selectedCellId);
    if (!location) return;

    // Find the row to check if it's a columns block
    const row = rows.find(r => r.id === location.rowId);
    const isColumnsBlock = row?.props?.isColumnsBlock === true;

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== location.rowId) {
          // Recursively check nested constructors
          return {
            ...row,
            cells: row.cells.map((cell) => ({
              ...cell,
              resources: cell.resources.map((resource) => {
                if (isConstructor(resource)) {
                  const nestedLocation = findCellLocationInRows([resource], selectedCellId);
                  if (nestedLocation) {
                    const updatedNested = {
                      ...resource,
                      cells: resource.cells.filter((_, idx) => idx !== nestedLocation.cellIndex),
                    };
                    return updatedNested.cells.length > 0 ? updatedNested : null;
                  }
                }
                return resource;
              }).filter(Boolean) as Resource[],
            })),
          };
        }
        
        // This is the row containing the cell to delete
        if (isColumnsBlock) {
          // For columns blocks, merge the deleted cell's resources into the remaining cells
          // and update the columns count
          const newCells = row.cells.filter((_, idx) => idx !== location.cellIndex);
          const deletedCell = row.cells[location.cellIndex];
          
          // If there are remaining cells, merge deleted cell's resources into the first remaining cell
          if (newCells.length > 0 && deletedCell) {
            newCells[0].resources.push(...deletedCell.resources);
          }
          
          const newColumns = Math.max(1, newCells.length); // Minimum 1 column
          
          return {
            ...row,
            cells: newCells,
            props: {
              ...row.props,
              columns: newColumns,
            },
          };
        }
        
        // Regular rows - just remove the cell
        return {
          ...row,
          cells: row.cells.filter((_, idx) => idx !== location.cellIndex),
        };
      }).filter((row) => row.cells.length > 0) // Remove rows with no cells
    );
    
    setSelectedCellId(null);
  };

  const handleEditCell = () => {
    if (!selectedCellId) return;
    setIsRightSidebarOpen(true);
    // Cell is already selected via selectedCellId, PropertiesPanel will find it
  };

  const handleUpdateCell = (updatedCell: Cell) => {
    setRows((prev) => {
      const updateCellInRow = (row: Row): Row => {
        // Check if this row contains the cell
        const cellIndex = row.cells.findIndex(c => c.id === updatedCell.id);
        if (cellIndex !== -1) {
          return {
            ...row,
            cells: row.cells.map((cell, idx) => idx === cellIndex ? updatedCell : cell),
          };
        }
        // Recursively check nested constructors
        return {
          ...row,
          cells: row.cells.map((cell) => ({
            ...cell,
            resources: cell.resources.map((resource) => {
              if (isConstructor(resource)) {
                return updateCellInRow(resource);
              }
              return resource;
            }),
          })),
        };
      };
      return prev.map(updateCellInRow);
    });
  };

  const handleDuplicateCell = () => {
    if (!selectedCellId) return;
    
    const cellToDuplicate = findCellInRows(rows, selectedCellId);
    if (!cellToDuplicate) return;

    const location = findCellLocationInRows(rows, selectedCellId);
    if (!location) return;

    // Find the row to check if it's a columns block
    const row = rows.find(r => r.id === location.rowId);
    const isColumnsBlock = row?.props?.isColumnsBlock === true;
    const currentColumns = (row?.props?.columns as number) || row?.cells.length || 2;

    // For columns blocks, check if we've reached max columns (4) or min columns (1)
    if (isColumnsBlock) {
      if (currentColumns >= 4) {
        // Don't allow duplicating beyond 4 columns
        return;
      }
      if (currentColumns <= 1) {
        // Don't allow duplicating if already at 1 column (can't go below 1)
        // Actually, allow duplicating from 1 to 2
      }
    }

    // Create a new cell with same properties but new ID and duplicated resources
    const duplicatedCell: Cell = {
      id: crypto.randomUUID(),
      resources: cellToDuplicate.resources.map((resource) => {
        if (isBlock(resource)) {
          return { ...resource, id: crypto.randomUUID() };
        }
        // For constructors, recursively duplicate
        if (isConstructor(resource)) {
            return {
            ...resource,
            id: crypto.randomUUID(),
            cells: resource.cells.map((cell) => ({
              ...cell,
              id: crypto.randomUUID(),
              resources: cell.resources.map((r) => 
                isBlock(r) ? { ...r, id: crypto.randomUUID() } : r
              ),
            })),
          };
        }
        return resource;
      }),
    };

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== location.rowId) return row;
        const newCells = [...row.cells];
        newCells.splice(location.cellIndex + 1, 0, duplicatedCell);
        
        // If it's a columns block, update the columns count
        if (isColumnsBlock) {
          const newColumns = Math.min(newCells.length, 4); // Cap at 4
            return {
            ...row,
            cells: newCells,
            props: {
              ...row.props,
              columns: newColumns,
              },
            };
          }
        
        return { ...row, cells: newCells };
      })
    );
    
    setSelectedCellId(duplicatedCell.id);
  };

  const handleDeleteRow = () => {
    if (!selectedRowId) return;
    
    setRows((prev) => prev.filter((row) => row.id !== selectedRowId));
    setSelectedRowId(null);
    setSelectedCellId(null);
    setSelectedBlockId(null);
  };

  const handleDuplicateRow = () => {
    if (!selectedRowId) return;
    
    const rowToDuplicate = rows.find((row) => row.id === selectedRowId);
    if (!rowToDuplicate) return;

    const selectedRowIndex = rows.findIndex((row) => row.id === selectedRowId);
    if (selectedRowIndex === -1) return;

    // Create a new row with same properties but new IDs
    const duplicatedRow: Row = {
      id: crypto.randomUUID(),
      cells: rowToDuplicate.cells.map((cell) => ({
        id: crypto.randomUUID(),
        resources: cell.resources.map((resource) => {
          if (isBlock(resource)) {
            return { ...resource, id: crypto.randomUUID() };
          }
          // For constructors, recursively duplicate
          if (isConstructor(resource)) {
            return {
              ...resource,
              id: crypto.randomUUID(),
              cells: resource.cells.map((nestedCell) => ({
                ...nestedCell,
                id: crypto.randomUUID(),
                resources: nestedCell.resources.map((r) =>
                  isBlock(r) ? { ...r, id: crypto.randomUUID() } : r
                ),
              })),
            };
          }
          return resource;
        }),
      })),
      props: rowToDuplicate.props ? { ...rowToDuplicate.props } : undefined,
    };

    setRows((prev) => {
      const newRows = [...prev];
      newRows.splice(selectedRowIndex + 1, 0, duplicatedRow);
      return newRows;
    });
    
    setSelectedRowId(duplicatedRow.id);
  };

  const handleAddEmptyStateRow = () => {
    if (!selectedRowId) return;
    
    const selectedRowIndex = rows.findIndex((row) => row.id === selectedRowId);
    if (selectedRowIndex === -1) return;

    // Check if the next row (directly below) is an empty state row
    const nextRow = rows[selectedRowIndex + 1];
    if (nextRow && nextRow.isEmptyState) {
      // Select the existing empty state row instead of creating a new one
      setSelectedRowId(nextRow.id);
      setSelectedBlockId(null);
      setSelectedCellId(null);
      
      // Scroll to the existing empty state row
      setTimeout(() => {
        const rowElement = document.querySelector(`[data-row-id="${nextRow.id}"]`) as HTMLElement;
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
        return;
      }

    // Create a new empty state row if no empty state row exists directly below
    const newEmptyStateRow: Row = {
      id: nanoid(),
      cells: [
        {
          id: nanoid(),
          resources: [],
        },
      ],
      isEmptyState: true,
    };

    setRows((prev) => {
      const newRows = [...prev];
      newRows.splice(selectedRowIndex + 1, 0, newEmptyStateRow);
      return newRows;
    });
    
    // Deselect previous row and select new empty state row
    setSelectedRowId(newEmptyStateRow.id);
    setSelectedBlockId(null);
    setSelectedCellId(null);
    
    // Scroll to the new row after a short delay to ensure it's rendered
    setTimeout(() => {
      const rowElement = document.querySelector(`[data-row-id="${newEmptyStateRow.id}"]`) as HTMLElement;
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const handleInsertSection = (section: SectionTemplate) => {
    // Create a row with one cell containing all the section's blocks
    const newRow = section.createSection();

    // If a Row is selected OR if a block is selected (use its parent row), insert new row below it
    const rowIdForInsertion = selectedRowId || getSelectedBlockRowId();
    if (rowIdForInsertion) {
      const selectedRowIndex = rows.findIndex(r => r.id === rowIdForInsertion);
      if (selectedRowIndex !== -1) {
        setRows((prev) => {
          const newRows = [...prev];
          newRows.splice(selectedRowIndex + 1, 0, newRow);
          return newRows;
        });
        
        // Select the row and clear all other selections
        setSelectedRowId(newRow.id);
        setSelectedBlockId(null);
        setSelectedCellId(null);
        setEditingBlockId(null);
        return;
      }
    }

    // If no rows exist or no row is selected, append at the end
    setRows((prev) => [...prev, newRow]);
    // Select the row and clear all other selections
    setSelectedRowId(newRow.id);
    setSelectedBlockId(null);
    setSelectedCellId(null);
    setEditingBlockId(null);
  };

  const handleInsertBlock = (blockType: BlockType) => {
    // Special handling for columns block - it becomes a Row directly
    if (blockType === 'columns') {
      const columnsBlock = createBlock(blockType) as ColumnsBlock;
      const newRow: Row = {
        ...columnsBlock.row,
        props: {
          isColumnsBlock: true,
          columns: columnsBlock.columns,
          columnGap: columnsBlock.columnGap,
          blockId: columnsBlock.id, // Store the block ID for reference
        },
      };

      // If a Row is selected OR if a block is selected (use its parent row), insert new row below it
      const rowIdForInsertion = selectedRowId || getSelectedBlockRowId();
      if (rowIdForInsertion) {
        const selectedRowIndex = rows.findIndex(r => r.id === rowIdForInsertion);
        if (selectedRowIndex !== -1) {
          setRows((prev) => {
            const newRows = [...prev];
            newRows.splice(selectedRowIndex + 1, 0, newRow);
            return newRows;
          });
          
          setSelectedRowId(newRow.id);
          setSelectedBlockId(null);
          setEditingBlockId(null);
          return;
        }
      }

      // If no rows exist or no row is selected, append at the end
      setRows((prev) => [...prev, newRow]);
      setSelectedRowId(newRow.id);
      setSelectedBlockId(null);
      setEditingBlockId(null);
      return;
    }

    // Regular blocks - create a new row with the block as a resource
    const newBlock = createBlock(blockType);
    const newRow = createNewRow();
    newRow.cells[0].resources = [newBlock];

    // If a Row is selected OR if a block is selected (use its parent row), insert new row below it
    const rowIdForInsertion = selectedRowId || getSelectedBlockRowId();
    if (rowIdForInsertion) {
      const selectedRowIndex = rows.findIndex(r => r.id === rowIdForInsertion);
      if (selectedRowIndex !== -1) {
        setRows((prev) => {
          const newRows = [...prev];
          newRows.splice(selectedRowIndex + 1, 0, newRow);
          return newRows;
        });

    setSelectedBlockId(newBlock.id);
    setEditingBlockId(null);
        setNewlyInsertedBlockId(newBlock.id); // Trigger scroll effect
        return;
      }
    }

    // If no rows exist or no row is selected, append at the end
    setRows((prev) => [...prev, newRow]);
    setSelectedBlockId(newBlock.id);
    setEditingBlockId(null);
    setNewlyInsertedBlockId(newBlock.id); // Trigger scroll effect
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
      // Use functional update to get current state
      setRows((prev) => {
        const activeLocation = findBlockLocationInRows(prev, active.id as string);
        const overLocation = findBlockLocationInRows(prev, over.id as string);
        
        // Only reorder if both blocks are in the same row and cell
      if (activeLocation && overLocation && 
            activeLocation.rowId === overLocation.rowId &&
            activeLocation.cellId === overLocation.cellId) {
          return prev.map((row) => {
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
          });
        }
        return prev; // No change if not same cell
      });
    }
  };

  // Helper function to clean up empty cells and rows
  const cleanupEmptyCellsAndRows = (rowsToClean: Row[]): Row[] => {
    return rowsToClean
      .map((row) => {
        // Don't clean up columns block rows - they must maintain their cell structure
        if (row.props?.isColumnsBlock === true) {
          return row;
        }
        
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

    // Handle dropping sections from palette
    if (activeData?.source === 'palette-section') {
      const sectionId = activeData.sectionId as string;
      const sections = getPredefinedSections();
      const section = sections.find(s => s.id === sectionId);
      
      if (section) {
        const newRow = section.createSection();
        
        // Rule A: Dropped outside any existing Section/Cell
        if (over.id === 'empty-canvas') {
          setRows([newRow]);
          setSelectedRowId(newRow.id);
          setSelectedBlockId(null);
          setSelectedCellId(null);
          setEditingBlockId(null);
          return;
        }

        // Rule B1: Dropped directly on a cell - append to cell's resources
        if (typeof over.id === 'string' && over.id.startsWith('cell:')) {
          const cellId = over.id.replace('cell:', '');
          const cellLocation = findCellLocationInRows(rows, cellId);
          if (cellLocation) {
            // Helper function to recursively update nested rows (including columns blocks)
            const updateCellInRows = (rowsToUpdate: Row[]): Row[] => {
              return rowsToUpdate.map((row) => {
                if (row.id === cellLocation.rowId) {
                  // Found the target row
                  return {
                    ...row,
                    cells: row.cells.map((cell, cellIndex) => {
                      if (cellIndex === cellLocation.cellIndex) {
                        return { ...cell, resources: [...cell.resources, ...newRow.cells[0].resources] };
                      }
                      return cell;
                    }),
                  };
                }
                // Check nested resources (columns blocks and constructors)
                return {
                  ...row,
                  cells: row.cells.map((cell) => ({
                    ...cell,
                    resources: cell.resources.map((resource) => {
                      if (isBlock(resource) && resource.type === 'columns') {
                        const columnsBlock = resource as ColumnsBlock;
                        const nestedLocation = findCellLocationInRows([columnsBlock.row], cellId);
                        if (nestedLocation) {
                          // Update the nested columns block's row
                          const updatedRow = {
                            ...columnsBlock.row,
                            cells: columnsBlock.row.cells.map((cell, cellIndex) => {
                              if (cellIndex === nestedLocation.cellIndex) {
                                return { ...cell, resources: [...cell.resources, ...newRow.cells[0].resources] };
                              }
                              return cell;
                            }),
                          };
                          return {
                            ...columnsBlock,
                            row: updatedRow,
                          };
                        }
                      } else if (isConstructor(resource)) {
                        // Recursively check nested constructors
                        const nestedRows = updateCellInRows([resource]);
                        return nestedRows[0] || resource;
                      }
                      return resource;
                    }),
                  })),
                };
              });
            };

            setRows((prev) => updateCellInRows(prev));
            setSelectedRowId(cellLocation.rowId);
            setSelectedBlockId(null);
            setSelectedCellId(null);
            setEditingBlockId(null);
            return;
          }
        }

        // Rule B2: Dropped on an existing block - insert into target Cell's resources
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
                  newResources.splice(overLocation.index, 0, ...newRow.cells[0].resources);
                  return { ...cell, resources: newResources };
                }),
              };
            })
          );
          setSelectedRowId(overLocation.rowId);
          setSelectedBlockId(null);
          setSelectedCellId(null);
          setEditingBlockId(null);
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
                        resources: [...cell.resources, ...newRow.cells[0].resources],
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
          setRows((prev) => [...prev, newRow]);
        }
        setSelectedRowId(newRow.id);
        setSelectedBlockId(null);
        setSelectedCellId(null);
        setEditingBlockId(null);
        return;
      }
    }

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

      // Rule B1: Dropped directly on a cell - append to cell's resources
      if (typeof over.id === 'string' && over.id.startsWith('cell:')) {
        const cellId = over.id.replace('cell:', '');
        const cellLocation = findCellLocationInRows(rows, cellId);
        if (cellLocation) {
          // Helper function to recursively update nested rows (including columns blocks)
          const updateCellInRows = (rowsToUpdate: Row[]): Row[] => {
            return rowsToUpdate.map((row) => {
              if (row.id === cellLocation.rowId) {
                // Found the target row
                return {
                  ...row,
                  cells: row.cells.map((cell, cellIndex) => {
                    if (cellIndex === cellLocation.cellIndex) {
                      return { ...cell, resources: [...cell.resources, newBlock] };
                    }
                    return cell;
                  }),
                };
              }
              // Check nested resources (columns blocks and constructors)
              return {
                ...row,
                cells: row.cells.map((cell) => ({
                  ...cell,
                  resources: cell.resources.map((resource) => {
                    if (isBlock(resource) && resource.type === 'columns') {
                      const columnsBlock = resource as ColumnsBlock;
                      const nestedLocation = findCellLocationInRows([columnsBlock.row], cellId);
                      if (nestedLocation) {
                        // Update the nested columns block's row
                        const updatedRow = {
                          ...columnsBlock.row,
                          cells: columnsBlock.row.cells.map((cell, cellIndex) => {
                            if (cellIndex === nestedLocation.cellIndex) {
                              return { ...cell, resources: [...cell.resources, newBlock] };
                            }
                            return cell;
                          }),
                        };
                        return {
                          ...columnsBlock,
                          row: updatedRow,
                        };
                      }
                    } else if (isConstructor(resource)) {
                      // Recursively check nested constructors
                      const nestedRows = updateCellInRows([resource]);
                      return nestedRows[0] || resource;
                    }
                    return resource;
                  }),
                })),
              };
            });
          };

          setRows((prev) => updateCellInRows(prev));
          setSelectedBlockId(newBlock.id);
          return;
        }
      }

      // Rule B2: Dropped on an existing block - insert into target Cell's resources (vertical flow)
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
    
    // Check if dropping directly on a cell
    if (typeof over.id === 'string' && over.id.startsWith('cell:')) {
      const cellId = over.id.replace('cell:', '');
      const cellLocation = findCellLocationInRows(rows, cellId);
      if (cellLocation && activeLocation) {
        // Move block to the target cell
        const blockToMove = findBlockInRows(rows, activeBlockId);
        if (!blockToMove) return;

        // Remove from source
        let updatedRows = rows.map((row) => {
          if (row.id !== activeLocation.rowId) return row;
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

        // Add to target cell
        updatedRows = updatedRows.map((row) => {
          if (row.id !== cellLocation.rowId) return row;
          return {
            ...row,
            cells: row.cells.map((cell, cellIndex) => {
              if (cellIndex !== cellLocation.cellIndex) return cell;
              return {
                ...cell,
                resources: [...cell.resources, blockToMove],
              };
            }),
          };
        });

        setRows(cleanupEmptyCellsAndRows(updatedRows));
        setSelectedBlockId(activeBlockId);
        return;
      }
    }

    const overLocation = findBlockLocationInRows(rows, over.id as string);
    
    // Handle reordering within the same cell (handled by handleDragOver, but ensure it's set)
    // IMPORTANT: If blocks are in the same cell, we should NOT add the block again
    if (activeLocation && overLocation && 
        activeLocation.rowId === overLocation.rowId &&
        activeLocation.cellId === overLocation.cellId) {
      // Already handled by handleDragOver - just select the block and return
      // Do NOT add the block again as it would cause duplication
      setSelectedBlockId(activeBlockId);
      return;
    }

    // If overLocation is null, it means we're not dropping on a block, so don't proceed with block-to-block movement
    if (!overLocation) {
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
                        return resource.id !== activeBlockId;
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
                    return resource.id !== activeBlockId;
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
      // IMPORTANT: Check if block is already in the destination to prevent duplication
      setRows((prev) => {
        // Check if block already exists in destination (shouldn't happen, but safety check)
        const blockAlreadyExists = prev.some(row => 
          row.id === overLocation.rowId && 
          row.cells.some(cell => 
            cell.id === overLocation.cellId && 
            cell.resources.some(r => isBlock(r) && r.id === activeBlockId)
          )
        );
        
        if (blockAlreadyExists) {
          // Block already in destination, don't add again
          return prev;
        }
        
        return rowsAfterRemove.map((row) => {
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
        });
      });
      
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
                rows={rows}
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
                <BlocksPalette onInsertBlock={handleInsertBlock} onInsertSection={handleInsertSection} />
              </aside>
              <main className={`main-content${!isRightSidebarOpen ? ' main-content-full' : ''}`}>
                <LessonCanvas
                  sections={sections}
                  rows={rows}
                  selectedBlockId={selectedBlockId}
                  selectedCellId={selectedCellId}
                  selectedRowId={selectedRowId}
                  editingBlockId={editingBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onSelectCell={setSelectedCellId}
                  onSelectRow={setSelectedRowId}
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
                  onDeleteCell={handleDeleteCell}
                  onDuplicateCell={handleDuplicateCell}
                  onEditCell={handleEditCell}
                  onDeleteRow={handleDeleteRow}
                  onDuplicateRow={handleDuplicateRow}
                  onAddEmptyStateRow={handleAddEmptyStateRow}
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
                  selectedRow={selectedRowId ? rows.find(r => r.id === selectedRowId) || null : null}
                  selectedCell={selectedCellId ? findCellInRows(rows, selectedCellId) : null}
                  onUpdateBlock={handleUpdateBlock}
                  onUpdateRow={(updatedRow) => {
                    setRows((prev) =>
                      prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
                    );
                  }}
                  onUpdateCell={handleUpdateCell}
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
