import React from 'react';
import type { Cell, Resource, Block } from '../types';
import { isBlock, isConstructor } from '../utils/sections';
import { RowView } from './RowView';

interface CellViewProps {
  cell: Cell;
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

export function CellView({
  cell,
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
}: CellViewProps) {
  return (
    <div className={`cell-view ${showStructureStrokes ? 'show-strokes' : ''}`} data-cell-id={cell.id}>
      <div className="cell-resources">
        {cell.resources.map((resource) => {
          if (isBlock(resource)) {
            return (
              <div key={resource.id} className="resource-wrapper">
                {renderResource(resource)}
              </div>
            );
          } else if (isConstructor(resource)) {
            // Nested constructor (Row inside a Cell)
            return (
              <div key={resource.id} className="resource-wrapper resource-constructor">
                <RowView
                  row={resource}
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
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

