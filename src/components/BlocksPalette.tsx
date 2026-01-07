import { useDraggable } from '@dnd-kit/core';
import { useRef, useState } from 'react';
import type { BlockType, SectionTemplate } from '../types';
import { getPredefinedSections } from '../types';
import { SectionPreview } from './SectionPreview';

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

interface DraggableSectionProps {
  section: SectionTemplate;
  onInsert: (section: SectionTemplate) => void;
}

function DraggableSection({ section, onInsert }: DraggableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-section-${section.id}`,
      data: { sectionId: section.id, source: 'palette-section' },
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
    mouseDownRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    hasDraggedRef.current = false;
  };

  const handleMouseMove = () => {
    hasDraggedRef.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!mouseDownRef.current) return;

    const { x, y, time } = mouseDownRef.current;
    const deltaX = Math.abs(e.clientX - x);
    const deltaY = Math.abs(e.clientY - y);
    const deltaTime = Date.now() - time;

    if (deltaX < 8 && deltaY < 8 && !hasDraggedRef.current && !isDragging && deltaTime < 500) {
      e.preventDefault();
      e.stopPropagation();
      onInsert(section);
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
      className={`palette-section ${isDragging ? 'dragging' : ''}`}
    >
      <div className="palette-section-label">{section.name}</div>
      <div className="palette-section-preview">
        <SectionPreview section={section} />
      </div>
    </div>
  );
}

interface BlocksPaletteProps {
  onInsertBlock: (type: BlockType) => void;
  onInsertSection?: (section: SectionTemplate) => void;
}

export function BlocksPalette({ onInsertBlock, onInsertSection }: BlocksPaletteProps) {
  const [activeTab, setActiveTab] = useState<'elements' | 'sections'>('elements');
  const sections = getPredefinedSections();

  return (
    <div className="blocks-palette">
      <div className="palette-tabs">
        <button
          type="button"
          className={`palette-tab ${activeTab === 'elements' ? 'active' : ''}`}
          onClick={() => setActiveTab('elements')}
        >
          Elements
        </button>
        <button
          type="button"
          className={`palette-tab ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          Sections
        </button>
      </div>
      {activeTab === 'elements' ? (
        <>
          <h2 className="palette-title">Blocks</h2>
          <div className="palette-list">
            <DraggableBlockType type="text" label="Texta" icon="📝" onInsert={onInsertBlock} />
            <DraggableBlockType type="header" label="Header" icon="📝" onInsert={onInsertBlock} />
            <DraggableBlockType type="image" label="Image" icon="🖼️" onInsert={onInsertBlock} />
            <DraggableBlockType type="quiz" label="Quiz" icon="❓" onInsert={onInsertBlock} />
            <DraggableBlockType type="columns" label="Columns" icon="📊" onInsert={onInsertBlock} />
            <DraggableBlockType type="button" label="Button" icon="🔘" onInsert={onInsertBlock} />
          </div>
        </>
      ) : (
        <>
          <h2 className="palette-title">Sections</h2>
          <div className="palette-sections-list">
            {sections.map((section) => (
              <DraggableSection
                key={section.id}
                section={section}
                onInsert={onInsertSection || (() => {})}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
