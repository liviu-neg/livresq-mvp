import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// SVG Icons (same as CellToolbar)
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

const MoreOptionsIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24">
    <path fill="currentColor" d="M12 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"></path>
  </svg>
);

interface RowToolbarProps {
  rowContainerRef: React.RefObject<HTMLElement>;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  isEmptyState?: boolean; // If true, only show delete button
  isEmptyColumnsBlock?: boolean; // If true, only show delete and ellipsis buttons (for empty columns blocks)
}

export function RowToolbar({
  rowContainerRef,
  onDelete,
  onDuplicate,
  onDragStart,
  isEmptyState = false,
  isEmptyColumnsBlock = false,
}: RowToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Measure toolbar size and update position
  useEffect(() => {
    if (!rowContainerRef.current) {
      setPosition(null);
      return;
    }

    const container = rowContainerRef.current;
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

      // Get row position relative to viewport
      const containerRect = container.getBoundingClientRect();
      // Get scroll container position relative to viewport
      const scrollContainerRect = mainContent.getBoundingClientRect();
      
      // Calculate position relative to scroll container using scroll offset
      const viewportPadding = 8;
      const offset = 8; // Space between toolbar and row
      const topOffset = 11; // Additional vertical offset
      
      // Position above row, aligned to top-right
      let top = containerRect.top 
        - scrollContainerRect.top 
        + mainContent.scrollTop 
        - toolbarHeight 
        - offset 
        + topOffset;
      
      // Position aligned to right edge
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

    // ResizeObserver for selected row
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
  }, [rowContainerRef]);

  // Always render toolbar in portal (even if not positioned yet) so ref can be set
  const toolbarContent = (
    <div 
      ref={toolbarRef} 
      className="row-toolbar"
      style={{
        position: 'absolute',
        top: position ? `${position.top}px` : '-9999px',
        left: position ? `${position.left}px` : '-9999px',
        zIndex: 999, /* Lower than bubble toolbar (1001) so bubble toolbar appears above when text is selected */
        visibility: position ? 'visible' : 'hidden',
        pointerEvents: position ? 'auto' : 'none',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="row-toolbar-button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Delete"
      >
        <TrashIcon />
      </button>
      {!isEmptyState && !isEmptyColumnsBlock && (
        <>
          <div className="row-toolbar-divider"></div>
          <button
            type="button"
            className="row-toolbar-button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            aria-label="Duplicate"
          >
            <DuplicateIcon />
          </button>
          <div className="row-toolbar-divider"></div>
          <button
            type="button"
            className="row-toolbar-button row-toolbar-drag"
            onMouseDown={(e) => {
              e.stopPropagation();
              onDragStart(e);
            }}
            aria-label="Drag"
          >
            <DragHandleIcon />
          </button>
          <div className="row-toolbar-divider"></div>
        </>
      )}
      <div className="row-toolbar-divider"></div>
      <button
        type="button"
        className="row-toolbar-button"
        aria-label="More options"
      >
        <MoreOptionsIcon />
      </button>
      <div className="row-toolbar-divider"></div>
      <button
        type="button"
        className="row-toolbar-button row-toolbar-label-button"
        aria-label="Row type"
      >
        <span className="row-toolbar-label-text">Row</span>
      </button>
    </div>
  );

  // Portal toolbar into .main-content scroll container (same coordinate system as rows)
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

