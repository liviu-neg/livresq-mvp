import type { BlockType } from '../types';

interface BlockCardHeaderProps {
  type: BlockType;
  isPreview?: boolean;
}

const blockLabels: Record<BlockType, string> = {
  text: 'Texta',
  header: 'Header',
  image: 'Image',
  quiz: 'Quiz',
  columns: 'Columns',
};

export function BlockCardHeader({ 
  type, 
  isPreview = false
}: BlockCardHeaderProps) {
  return (
    <div className="block-card-header">
      <div className="block-card-header-left">
        <span className="block-card-type">{blockLabels[type]}</span>
      </div>
      {!isPreview && (
        <div className="block-card-drag-handle" aria-label="Drag to reorder">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
            <circle cx="6" cy="2" r="1" fill="currentColor" />
            <circle cx="10" cy="2" r="1" fill="currentColor" />
            <circle cx="2" cy="6" r="1" fill="currentColor" />
            <circle cx="6" cy="6" r="1" fill="currentColor" />
            <circle cx="10" cy="6" r="1" fill="currentColor" />
            <circle cx="2" cy="10" r="1" fill="currentColor" />
            <circle cx="6" cy="10" r="1" fill="currentColor" />
            <circle cx="10" cy="10" r="1" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}

