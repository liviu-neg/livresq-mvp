import React from 'react';
import type { TwoColumnSection as TwoColumnSectionType, Block } from '../../types';

interface TwoColumnSectionProps {
  section: TwoColumnSectionType;
  leftBlocks: Block[];
  rightBlocks: Block[];
  selectedBlockId: string | null;
  editingBlockId: string | null;
  isPreview: boolean;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: Block) => void;
  renderBlock: (block: Block) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: Block[];
}

export function TwoColumnSection({
  leftBlocks,
  rightBlocks,
  renderBlock,
}: TwoColumnSectionProps) {
  return (
    <div
      className="section section-two-column"
      style={{
        padding: `var(--spacing-xl) var(--spacing-lg)`,
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div
        className="section-columns"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: `var(--spacing-xl)`,
          maxWidth: '100%',
        }}
      >
        <div
          className="section-slot section-slot-left"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `var(--spacing-lg)`,
          }}
        >
          {leftBlocks.map((block) => renderBlock(block))}
        </div>
        <div
          className="section-slot section-slot-right"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `var(--spacing-lg)`,
          }}
        >
          {rightBlocks.map((block) => renderBlock(block))}
        </div>
      </div>
    </div>
  );
}

