import { useDraggable } from '@dnd-kit/core';
import { useRef } from 'react';
import type { BlockType } from '../types';

interface DraggableBlockTypeProps {
  type: BlockType;
  label: string;
  icon: string;
  onInsert: (type: BlockType) => void;
}

function DraggableBlockType({ type, label, icon, onInsert }: DraggableBlockTypeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${type}`,
      data: { type, source: 'palette' },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Track mouse position to distinguish click from drag
  const mouseDownRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Store initial mouse position and time
    mouseDownRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    hasDraggedRef.current = false;
  };

  const handleMouseMove = () => {
    // If mouse moves, it's a drag, not a click
    hasDraggedRef.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!mouseDownRef.current) return;

    const { x, y, time } = mouseDownRef.current;
    const deltaX = Math.abs(e.clientX - x);
    const deltaY = Math.abs(e.clientY - y);
    const deltaTime = Date.now() - time;

    // If mouse moved less than 8px (same as drag activation distance), didn't drag, and took reasonable time, consider it a click
    if (deltaX < 8 && deltaY < 8 && !hasDraggedRef.current && !isDragging && deltaTime < 500) {
      e.preventDefault();
      e.stopPropagation();
      onInsert(type);
    }

    mouseDownRef.current = null;
    hasDraggedRef.current = false;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`palette-block ${isDragging ? 'dragging' : ''}`}
    >
      <span className="palette-icon">{icon}</span>
      <span className="palette-label">{label}</span>
    </div>
  );
}

interface BlocksPaletteProps {
  onInsertBlock: (type: BlockType) => void;
}

export function BlocksPalette({ onInsertBlock }: BlocksPaletteProps) {
  return (
    <div className="blocks-palette">
      <h2 className="palette-title">Blocks</h2>
      <div className="palette-list">
        <DraggableBlockType type="text" label="Text" icon="📝" onInsert={onInsertBlock} />
        <DraggableBlockType type="header" label="Header" icon="📝" onInsert={onInsertBlock} />
        <DraggableBlockType type="image" label="Image" icon="🖼️" onInsert={onInsertBlock} />
        <DraggableBlockType type="quiz" label="Quiz" icon="❓" onInsert={onInsertBlock} />
        <DraggableBlockType type="columns" label="Columns" icon="📊" onInsert={onInsertBlock} />
      </div>
    </div>
  );
}
