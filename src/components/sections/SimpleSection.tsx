import React from 'react';
import type { SimpleSection as SimpleSectionType, Block } from '../../types';
import '../../styles/sections.css';

interface SimpleSectionProps {
  section: SimpleSectionType;
  blocks: Block[];
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

export function SimpleSection({
  blocks,
  renderBlock,
}: SimpleSectionProps) {
  return (
    <div className="section section-simple">
      <div className="section-slot section-slot-main">
        {blocks.map((block) => renderBlock(block))}
      </div>
    </div>
  );
}

