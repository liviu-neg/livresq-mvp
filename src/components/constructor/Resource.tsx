import React from 'react';
import type { Resource as ResourceType } from '../../types';
import '../../styles/constructor.css';

interface ResourceProps {
  resource: ResourceType;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  isPreview: boolean;
  onSelectBlock: (blockId: string | null) => void;
  onEditBlock: (blockId: string) => void;
  onUpdateBlock: (block: any) => void;
  renderBlock: (block: any) => React.ReactNode;
  activeId?: string | null;
  allBlocks?: any[];
  onUpdateResource: (resource: ResourceType) => void;
}

export function Resource({
  resource,
  renderBlock,
}: ResourceProps) {
  const isEmpty = resource.blocks.length === 0;
  
  return (
    <div className={`constructor-resource ${isEmpty ? 'empty' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {isEmpty ? (
        <div className="constructor-resource-empty-placeholder">
          Drag and drop content here
        </div>
      ) : (
        resource.blocks.map((block) => renderBlock(block))
      )}
    </div>
  );
}

