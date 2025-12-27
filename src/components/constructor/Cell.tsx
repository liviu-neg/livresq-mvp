import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Cell as CellType } from '../../types';
import { Resource } from './Resource';
import '../../styles/constructor.css';

interface CellProps {
  cell: CellType;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  isPreview: boolean;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: any) => void;
  renderBlock: (block: any) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: any[];
  onUpdateCell: (cell: CellType) => void;
}

export function Cell({
  cell,
  selectedBlockId,
  editingBlockId,
  isPreview,
  onSelectBlock,
  onEditBlock,
  onUpdateBlock,
  renderBlock,
  activeId,
  allBlocks = [],
  onUpdateCell,
}: CellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${cell.id}`,
    data: {
      type: 'cell',
      cellId: cell.id,
    },
  });

  const handleUpdateResource = (updatedResource: any) => {
    onUpdateCell({ ...cell, resource: updatedResource });
  };

  return (
    <div
      ref={setNodeRef}
      className={`constructor-cell ${isOver ? 'drag-over' : ''}`}
      style={{ flex: 1, minWidth: 0 }}
    >
      <SortableContext
        items={cell.resource.blocks.map(b => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <Resource
          resource={cell.resource}
          selectedBlockId={selectedBlockId}
          editingBlockId={editingBlockId}
          isPreview={isPreview}
          onSelectBlock={onSelectBlock}
          onEditBlock={onEditBlock}
          onUpdateBlock={onUpdateBlock}
          renderBlock={renderBlock}
          activeId={activeId}
          allBlocks={allBlocks}
          onUpdateResource={handleUpdateResource}
        />
      </SortableContext>
    </div>
  );
}

