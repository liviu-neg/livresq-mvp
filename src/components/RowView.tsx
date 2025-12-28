import React from 'react';
import type { Row, Resource, Block } from '../types';
import { isBlock, isConstructor } from '../utils/sections';
import { CellView } from './CellView';

interface RowViewProps {
  row: Row;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  isPreview: boolean;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: Block) => void;
  renderResource: (resource: Resource) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: Block[];
  showStructureStrokes?: boolean;
}

export function RowView({
  row,
  selectedBlockId,
  editingBlockId,
  isPreview,
  onSelectBlock,
  onEditBlock,
  onUpdateBlock,
  renderResource,
  activeId,
  allBlocks,
  showStructureStrokes = false,
}: RowViewProps) {
  return (
    <div className={`row-view ${showStructureStrokes ? 'show-strokes' : ''}`} data-row-id={row.id}>
      <div className="row-cells">
        {row.cells.map((cell) => (
          <CellView
            key={cell.id}
            cell={cell}
            selectedBlockId={selectedBlockId}
            editingBlockId={editingBlockId}
            isPreview={isPreview}
            onSelectBlock={onSelectBlock}
            onEditBlock={onEditBlock}
            onUpdateBlock={onUpdateBlock}
            renderResource={renderResource}
            activeId={activeId}
            allBlocks={allBlocks}
            showStructureStrokes={showStructureStrokes}
          />
        ))}
      </div>
    </div>
  );
}

