import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';

// SVG Icons
const TrashIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24">
    <path fill="currentColor" d="M11 8v7H9V8h2Zm7.997.077L18.14 19.23A3 3 0 0 1 15.148 22H8.853a3 3 0 0 1-2.992-2.77L5.003 8.077l1.994-.154.858 11.154a1 1 0 0 0 .998.923h6.295a1 1 0 0 0 .997-.923l.858-11.154 1.994.154ZM15 1l.948.684L16.721 4H21v2H3V4h4.28l.772-2.316L9 1h6ZM9.387 4h5.226l-.334-1H9.721l-.334 1ZM15 8v7h-2V8h2Z"></path>
  </svg>
);

const DuplicateIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24">
    <path fill="currentColor" fillRule="evenodd" d="M13.154 6.004A3 3 0 0 1 16 9v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h8l.154.004ZM5 8a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9a1 1 0 0 0-.898-.995L13 8H5Zm14.154-5.996A3 3 0 0 1 22 5v10a3 3 0 0 1-3 3h-1v-2h1a1 1 0 0 0 1-1V5a1 1 0 0 0-.898-.995L19 4h-8a1 1 0 0 0-1 1H8a3 3 0 0 1 3-3h8l.154.004Z" clipRule="evenodd"></path>
  </svg>
);

const DragHandleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.26314 13.8631L0.899994 10.5M0.899994 10.5L4.26314 7.13685M0.899994 10.5H20.1M16.7368 13.8631L20.1 10.5M20.1 10.5L16.7368 7.13685M7.13685 4.26314L10.5 0.899994M10.5 0.899994L13.8631 4.26314M10.5 0.899994L10.5 20.1M7.13685 16.7368L10.5 20.1M10.5 20.1L13.8631 16.7368" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AiEditIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24">
    <path fill="currentColor" d="M5.5 16A2.5 2.5 0 0 0 8 18.5v1A2.5 2.5 0 0 0 5.5 22h-1A2.5 2.5 0 0 0 2 19.5v-1A2.5 2.5 0 0 0 4.5 16h1Zm5.178-10.793c.325-1.368 2.319-1.37 2.644 0l.027.142.042.255a6.26 6.26 0 0 0 5.26 5.046c1.553.224 1.561 2.473 0 2.699a6.26 6.26 0 0 0-5.302 5.301c-.225 1.563-2.475 1.554-2.699 0a6.26 6.26 0 0 0-5.3-5.3c-1.56-.225-1.557-2.474 0-2.699l.255-.042a6.26 6.26 0 0 0 5.046-5.26l.028-.141ZM19.5 2A2.5 2.5 0 0 0 22 4.5v1A2.5 2.5 0 0 0 19.5 8h-1A2.5 2.5 0 0 0 16 5.5v-1A2.5 2.5 0 0 0 18.5 2h1Z"></path>
  </svg>
);

const MoreOptionsIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24">
    <path fill="currentColor" d="M12 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"></path>
  </svg>
);

// Speech icon component - 32x32px icon for the "Add speech" button
const SpeechIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26 23V25H6V23H26Z" fill="currentColor"/>
    <path d="M16 17C18.0277 17 19.7951 18.221 20.5635 20H23C23.5523 20 24 19.5523 24 19V10C24 9.44772 23.5523 9 23 9H9C8.44772 9 8 9.44772 8 10V19C8 19.5523 8.44772 20 9 20H11.4365C12.2049 18.221 13.9723 17 16 17ZM16 19C15.122 19 14.3273 19.3847 13.7803 20H18.2197C17.6727 19.3847 16.878 19 16 19ZM17 13C17 12.4477 16.5523 12 16 12C15.4477 12 15 12.4477 15 13C15 13.5523 15.4477 14 16 14C16.5523 14 17 13.5523 17 13ZM19 13C19 14.6569 17.6569 16 16 16C14.3431 16 13 14.6569 13 13C13 11.3431 14.3431 10 16 10C17.6569 10 19 11.3431 19 13ZM26 19C26 20.6569 24.6569 22 23 22H9C7.34315 22 6 20.6569 6 19V10C6 8.34315 7.34315 7 9 7H23C24.6569 7 26 8.34315 26 10V19Z" fill="currentColor"/>
  </svg>
);

interface BlockToolbarProps {
  blockContainerRef: React.RefObject<HTMLElement>;
  blockType: 'text' | 'header' | 'image' | 'quiz';
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  editorRef?: React.RefObject<Editor | null>;
  onOpenAiEdit?: () => void;
}

export function BlockToolbar({
  blockContainerRef,
  blockType,
  onDelete,
  onDuplicate,
  onDragStart,
  editorRef,
  onOpenAiEdit,
}: BlockToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Measure toolbar size and update position
  useEffect(() => {
    if (!blockContainerRef.current) {
      setPosition(null);
      return;
    }

    const container = blockContainerRef.current;
    let isActive = true;
    let measurementRetries = 0;
    const MAX_MEASUREMENT_RETRIES = 20;

    const updatePosition = () => {
      if (!isActive) return;
      
      const toolbar = toolbarRef.current;
      if (!toolbar || !container) {
        return;
      }

      // Measure toolbar size after render
      const toolbarRect = toolbar.getBoundingClientRect();
      const toolbarWidth = toolbarRect.width;
      const toolbarHeight = toolbarRect.height;
      
      // If toolbar hasn't been measured yet, wait for next frame (with retry limit)
      if ((toolbarWidth === 0 || toolbarHeight === 0) && measurementRetries < MAX_MEASUREMENT_RETRIES) {
        measurementRetries++;
        requestAnimationFrame(updatePosition);
        return;
      }

      // Reset retry count on successful measurement
      measurementRetries = 0;
      
      // Get the scroll container (.main-content)
      const mainContent = document.querySelector('.main-content') as HTMLElement;
      if (!mainContent) {
        setPosition(null);
        return;
      }

      // Get block position relative to viewport
      const containerRect = container.getBoundingClientRect();
      // Get scroll container position relative to viewport
      const scrollContainerRect = mainContent.getBoundingClientRect();
      
      // Calculate position relative to scroll container using scroll offset
      const viewportPadding = 8;
      const offset = 8; // Space between toolbar and block
      const topOffset = 11; // Additional vertical offset
      
      // Position above block, aligned to top-right
      // Formula: blockRect.top - scrollContainerRect.top + scrollContainer.scrollTop - toolbarHeight - offset
      let top = containerRect.top 
        - scrollContainerRect.top 
        + mainContent.scrollTop 
        - toolbarHeight 
        - offset 
        + topOffset;
      
      // Position aligned to right edge
      // Formula: blockRect.right - scrollContainerRect.left + scrollContainer.scrollLeft - toolbarWidth
      let left = containerRect.right 
        - scrollContainerRect.left 
        + mainContent.scrollLeft 
        - toolbarWidth;

      // Clamp within scroll container bounds
      const maxLeft = mainContent.scrollWidth - toolbarWidth - viewportPadding;
      const maxTop = mainContent.scrollHeight - toolbarHeight - viewportPadding;
      const minLeft = viewportPadding;
      const minTop = viewportPadding;

      left = Math.max(minLeft, Math.min(maxLeft, left));
      top = Math.max(minTop, Math.min(maxTop, top));

      setPosition({ top, left });
    };

    // Initial position after toolbar is rendered and measured
    // Use double RAF to ensure toolbar is fully rendered and measured
    let rafId1: number | null = null;
    let rafId2: number | null = null;
    
    rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        updatePosition();
      });
    });

    // Update on scroll and resize events
    // Since toolbar is now in the same scroll context, we only need to listen to .main-content scroll
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (!mainContent) {
      return;
    }

    const handleUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    // Listen to scroll container scroll
    mainContent.addEventListener('scroll', handleUpdate, true);
    // Listen to window resize (scroll container size may change)
    window.addEventListener('resize', handleUpdate);

    // ResizeObserver for selected block
    const resizeObserver = new ResizeObserver(handleUpdate);
    resizeObserver.observe(container);

    return () => {
      if (rafId1 !== null) cancelAnimationFrame(rafId1);
      if (rafId2 !== null) cancelAnimationFrame(rafId2);
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleUpdate, true);
      }
      window.removeEventListener('resize', handleUpdate);
      resizeObserver.disconnect();
    };
  }, [blockContainerRef]);

  const handleAiEdit = () => {
    // Only available for text/header blocks
    if ((blockType === 'text' || blockType === 'header') && onOpenAiEdit) {
      onOpenAiEdit();
    }
  };

  const getBlockLabel = () => {
    switch (blockType) {
      case 'text':
        return 'Texta';
      case 'header':
        return 'Header';
      case 'image':
        return 'Image';
      case 'quiz':
        return 'Quiz';
      default:
        return '';
    }
  };

  // Always render toolbar in portal (even if not positioned yet) so ref can be set
  const toolbarContent = (
    <div 
      ref={toolbarRef} 
      className="block-toolbar"
      style={{
        position: 'absolute',
        top: position ? `${position.top}px` : '-9999px',
        left: position ? `${position.left}px` : '-9999px',
        zIndex: 1000,
        visibility: position ? 'visible' : 'hidden',
        pointerEvents: position ? 'auto' : 'none',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
        {/* Add speech button - currently non-functional, placeholder for future speech feature */}
        <button
          type="button"
          className="block-toolbar-button block-toolbar-speech-button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // TODO: Implement speech functionality
          }}
          aria-label="Add speech"
        >
          <SpeechIcon />
          <span className="block-toolbar-speech-text">Add speech</span>
        </button>
        <div className="block-toolbar-divider"></div>
        <button
          type="button"
          className="block-toolbar-button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete"
        >
          <TrashIcon />
        </button>
        <div className="block-toolbar-divider"></div>
        <button
          type="button"
          className="block-toolbar-button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          aria-label="Duplicate"
        >
          <DuplicateIcon />
        </button>
        <div className="block-toolbar-divider"></div>
        <button
          type="button"
          className="block-toolbar-button block-toolbar-drag"
          onMouseDown={(e) => {
            e.stopPropagation();
            onDragStart(e);
          }}
          aria-label="Drag"
        >
          <DragHandleIcon />
        </button>
        <div className="block-toolbar-divider"></div>
        {(blockType === 'text' || blockType === 'header') && (
          <>
            <button
              type="button"
              className="block-toolbar-button block-toolbar-ai"
              onClick={(e) => {
                e.stopPropagation();
                handleAiEdit();
              }}
              aria-label="Edit with AI"
            >
              <AiEditIcon />
            </button>
            <div className="block-toolbar-divider"></div>
          </>
        )}
        <button
          type="button"
          className="block-toolbar-button"
          aria-label="More options"
        >
          <MoreOptionsIcon />
        </button>
        <div className="block-toolbar-divider"></div>
        <button
          type="button"
          className="block-toolbar-button block-toolbar-label-button"
          aria-label="Block type"
        >
          <span className="block-toolbar-label-text">{getBlockLabel()}</span>
        </button>
      </div>
  );

  // Portal toolbar into .main-content scroll container (same coordinate system as blocks)
  // This keeps the toolbar in the same scroll context, so it stays attached during scroll
  if (typeof document === 'undefined') {
    return null;
  }
  
  const mainContent = document.querySelector('.main-content') as HTMLElement;
  if (!mainContent) {
    return null;
  }
  
  return createPortal(toolbarContent, mainContent);
}

