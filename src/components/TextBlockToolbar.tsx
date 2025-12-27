import React from 'react';
import type { Block } from '../types';

interface TextBlockToolbarProps {
  block: Block;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: () => void;
  onGenerateWithAI: () => void;
  onMoreOptions: () => void;
  blockType: 'text' | 'header' | 'image' | 'quiz';
}

// SVG Icons as React components
const DeleteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path fill="currentColor" d="M11 8v7H9V8h2Zm7.997.077L18.14 19.23A3 3 0 0 1 15.148 22H8.853a3 3 0 0 1-2.992-2.77L5.003 8.077l1.994-.154.858 11.154a1 1 0 0 0 .998.923h6.295a1 1 0 0 0 .997-.923l.858-11.154 1.994.154ZM15 1l.948.684L16.721 4H21v2H3V4h4.28l.772-2.316L9 1h6ZM9.387 4h5.226l-.334-1H9.721l-.334 1ZM15 8v7h-2V8h2Z" />
  </svg>
);

const DuplicateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path fill="currentColor" fillRule="evenodd" d="M13.154 6.004A3 3 0 0 1 16 9v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h8l.154.004ZM5 8a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9a1 1 0 0 0-.898-.995L13 8H5Zm14.154-5.996A3 3 0 0 1 22 5v10a3 3 0 0 1-3 3h-1v-2h1a1 1 0 0 0 1-1V5a1 1 0 0 0-.898-.995L19 4h-8a1 1 0 0 0-1 1H8a3 3 0 0 1 3-3h8l.154.004Z" clipRule="evenodd" />
  </svg>
);

const MoveIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.36314 13.9631L1 10.6M1 10.6L4.36314 7.23686M1 10.6H20.2M16.8369 13.9631L20.2 10.6M20.2 10.6L16.8369 7.23686M7.23686 4.36314L10.6 1M10.6 1L13.9631 4.36314M10.6 1L10.6 20.2M7.23686 16.8369L10.6 20.2M10.6 20.2L13.9631 16.8369" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GenerateAIIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path fill="currentColor" d="M5.5 16A2.5 2.5 0 0 0 8 18.5v1A2.5 2.5 0 0 0 5.5 22h-1A2.5 2.5 0 0 0 2 19.5v-1A2.5 2.5 0 0 0 4.5 16h1Zm5.178-10.793c.325-1.368 2.319-1.37 2.644 0l.027.142.042.255a6.26 6.26 0 0 0 5.26 5.046c1.553.224 1.561 2.473 0 2.699a6.26 6.26 0 0 0-5.302 5.301c-.225 1.563-2.475 1.554-2.699 0a6.26 6.26 0 0 0-5.3-5.3c-1.56-.225-1.557-2.474 0-2.699l.255-.042a6.26 6.26 0 0 0 5.046-5.26l.028-.141ZM19.5 2A2.5 2.5 0 0 0 22 4.5v1A2.5 2.5 0 0 0 19.5 8h-1A2.5 2.5 0 0 0 16 5.5v-1A2.5 2.5 0 0 0 18.5 2h1Z" />
  </svg>
);

const MoreOptionsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path fill="currentColor" d="M12 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
  </svg>
);

export function TextBlockToolbar({
  block,
  onDelete,
  onDuplicate,
  onMove,
  onGenerateWithAI,
  onMoreOptions,
  blockType,
}: TextBlockToolbarProps) {
  return (
    <div className="text-block-toolbar">
      <button
        type="button"
        className="text-block-toolbar-button"
        onClick={onDelete}
        title="Delete"
      >
        <DeleteIcon />
      </button>
      <button
        type="button"
        className="text-block-toolbar-button"
        onClick={onDuplicate}
        title="Duplicate"
      >
        <DuplicateIcon />
      </button>
      <button
        type="button"
        className="text-block-toolbar-button"
        onClick={onMove}
        title="Move"
      >
        <MoveIcon />
      </button>
      {blockType !== 'quiz' && (
        <button
          type="button"
          className="text-block-toolbar-button text-block-toolbar-button-ai"
          onClick={onGenerateWithAI}
          title="Generate with AI"
        >
          <div className="text-block-toolbar-button-ai-gradient"></div>
          <GenerateAIIcon />
        </button>
      )}
      {/* Temporarily removed to test */}
      <div className="text-block-toolbar-label">
        {blockType === 'header' ? 'Header' : blockType === 'image' ? 'Image' : blockType === 'quiz' ? 'Quiz' : 'Text'}
      </div>
    </div>
  );
}

