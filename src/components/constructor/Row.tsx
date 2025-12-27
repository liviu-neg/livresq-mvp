import React from 'react';
import type { Row as RowType } from '../../types';
import { Cell } from './Cell';
import '../../styles/constructor.css';

interface RowProps {
  row: RowType;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  isPreview: boolean;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: any) => void;
  renderBlock: (block: any) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: any[];
  onUpdateRow: (row: RowType) => void;
}

export function Row({
  row,
  selectedBlockId,
  editingBlockId,
  isPreview,
  onSelectBlock,
  onEditBlock,
  onUpdateBlock,
  renderBlock,
  activeId,
  allBlocks = [],
  onUpdateRow,
}: RowProps) {
  const handleUpdateCell = (cellId: string, updatedCell: any) => {
    const updatedCells = row.cells.map(cell =>
      cell.id === cellId ? updatedCell : cell
    );
    onUpdateRow({ ...row, cells: updatedCells });
  };

  return (
    <div className="canvas-block constructor-row">
      <div className="block-card-content constructor-row-cells" style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
        {row.cells.map((cell) => (
          <Cell
            key={cell.id}
            cell={cell}
            selectedBlockId={selectedBlockId}
            editingBlockId={editingBlockId}
            isPreview={isPreview}
            onSelectBlock={onSelectBlock}
            onEditBlock={onEditBlock}
            onUpdateBlock={onUpdateBlock}
            renderBlock={renderBlock}
            activeId={activeId}
            allBlocks={allBlocks}
            onUpdateCell={handleUpdateCell}
          />
        ))}
      </div>
    </div>
  );
}

