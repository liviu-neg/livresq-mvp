import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
  maxHeight?: string;
  contentKey?: string | number; // Key to track content changes (e.g., activeTab)
}

export function Popover({
  isOpen,
  onClose,
  anchorElement,
  children,
  title,
  showBackButton = false,
  onBack,
  className = '',
  maxHeight,
  contentKey,
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
  const [isPositionComputed, setIsPositionComputed] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [needsScrolling, setNeedsScrolling] = useState(false);

  useEffect(() => {
    if (!isOpen || !anchorElement) {
      // Reset state when closed
      setPosition({ top: -9999, left: -9999 });
      setIsPositionComputed(false);
      setShouldShow(false);
      return;
    }

    // Don't show until we have a valid anchor and can compute position
    if (!popoverRef.current) {
      setShouldShow(false);
      return;
    }

    const updatePosition = () => {
      if (!anchorElement || !popoverRef.current) {
        setShouldShow(false);
        return;
      }
      
      const anchorRect = anchorElement.getBoundingClientRect();
      const popoverRect = popoverRef.current?.getBoundingClientRect();
      
      // Safety check: if we can't get rects, don't show
      if (!popoverRect || !anchorRect || popoverRect.width === 0 || popoverRect.height === 0) {
        setShouldShow(false);
        return;
      }

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const gap = 8; // 8px gap between anchor and popover
      const margin = 16; // 16px margin for top/bottom
      
      // Position popover to the left of the anchor (right sidebar)
      let left = anchorRect.left - popoverRect.width - gap - 100;
      let top = anchorRect.top;

      // Ensure popover stays in viewport horizontally
      if (left < gap) {
        // Not enough space on left, try right side
        left = anchorRect.right + gap;
        // If still doesn't fit, align to viewport edge
        if (left + popoverRect.width > viewportWidth - gap) {
          left = viewportWidth - popoverRect.width - gap;
        }
      }

      // Ensure popover stays in viewport vertically with 16px margins
      const popoverHeight = popoverRect.height;
      const minTop = margin;
      const maxTop = viewportHeight - popoverHeight - margin;
      
      // Clamp top between [16px, viewportHeight - popoverHeight - 16px]
      if (top < minTop) {
        top = minTop;
      } else if (top + popoverHeight > viewportHeight - margin) {
        top = Math.max(minTop, viewportHeight - popoverHeight - margin);
      }
      
      // If popover cannot fit even at top margin, enable scrolling
      if (viewportHeight - popoverHeight - margin < margin) {
        // Popover is too tall, keep at top margin and enable scrolling
        top = margin;
        setNeedsScrolling(true);
      } else {
        setNeedsScrolling(false);
      }
      
      // Final safety checks
      if (top < gap) top = gap;
      if (left < gap) left = gap;
      if (top + popoverHeight > viewportHeight - gap) {
        top = Math.max(gap, viewportHeight - popoverHeight - gap);
      }
      if (left + popoverRect.width > viewportWidth - gap) {
        left = viewportWidth - popoverRect.width - gap;
      }

      const finalPosition = { top: Math.max(gap, top), left: Math.max(gap, left) };
      setPosition(finalPosition);
      setIsPositionComputed(true);
      
      // For layout effect (synchronous), show immediately
      // For regular effect, use double RAF
      if (isLayoutEffect) {
        setShouldShow(true);
      } else {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setShouldShow(true);
          });
        });
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready before calculating position
    // This is especially important when reopening the popover
    requestAnimationFrame(() => {
      updatePosition();
    });
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, anchorElement]);

  // Reposition synchronously when content changes (e.g., tab switch)
  // Use useLayoutEffect to prevent visible jump
  useLayoutEffect(() => {
    if (!isOpen || !anchorElement || !popoverRef.current || !isPositionComputed) {
      return;
    }

    // Re-measure and reposition when content changes
    // Create a local function to avoid dependency issues
    const updatePositionSync = () => {
      if (!anchorElement || !popoverRef.current) {
        setShouldShow(false);
        return;
      }
      
      const anchorRect = anchorElement.getBoundingClientRect();
      const popoverRect = popoverRef.current?.getBoundingClientRect();
      
      if (!popoverRect || !anchorRect || popoverRect.width === 0 || popoverRect.height === 0) {
        setShouldShow(false);
        return;
      }

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const gap = 8;
      const margin = 16;
      
      let left = anchorRect.left - popoverRect.width - gap - 100;
      let top = anchorRect.top;

      if (left < gap) {
        left = anchorRect.right + gap;
        if (left + popoverRect.width > viewportWidth - gap) {
          left = viewportWidth - popoverRect.width - gap;
        }
      }

      const popoverHeight = popoverRect.height;
      const minTop = margin;
      
      if (top < minTop) {
        top = minTop;
      } else if (top + popoverHeight > viewportHeight - margin) {
        top = Math.max(minTop, viewportHeight - popoverHeight - margin);
      }
      
      if (viewportHeight - popoverHeight - margin < margin) {
        top = margin;
        setNeedsScrolling(true);
      } else {
        setNeedsScrolling(false);
      }
      
      if (top < gap) top = gap;
      if (left < gap) left = gap;
      if (top + popoverHeight > viewportHeight - gap) {
        top = Math.max(gap, viewportHeight - popoverHeight - gap);
      }
      if (left + popoverRect.width > viewportWidth - gap) {
        left = viewportWidth - popoverRect.width - gap;
      }

      const finalPosition = { top: Math.max(gap, top), left: Math.max(gap, left) };
      setPosition(finalPosition);
      setShouldShow(true);
    };

    updatePositionSync();
  }, [contentKey, isOpen, anchorElement, isPositionComputed]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        
        // Don't close if clicking on another popover (allow multiple popovers)
        if (target.closest('.popover')) {
          return;
        }
        
        // Close if clicking on the properties panel (right sidebar)
        if (target.closest('.properties-panel')) {
          try {
            if (onClose && typeof onClose === 'function') {
              onClose();
            }
          } catch (error) {
            console.error('Error in onClose callback:', error);
          }
          return;
        }
        
        // Don't close if clicking on the anchor element (but allow clear button to close)
        if (anchorElement && anchorElement.contains(event.target as Node)) {
          // However, if clicking the clear button, close the popover
          if (target.closest('.fill-input-clear')) {
            try {
              if (onClose && typeof onClose === 'function') {
                onClose();
              }
            } catch (error) {
              console.error('Error in onClose callback:', error);
            }
          }
          return;
        }
        
        // Close for all other outside clicks
        try {
          if (onClose && typeof onClose === 'function') {
            onClose();
          }
        } catch (error) {
          console.error('Error in onClose callback:', error);
        }
      }
    };

    // Use setTimeout to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorElement]);

  if (!isOpen) return null;

  // Don't render if we can't compute position (safety fallback)
  if (!anchorElement) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={`popover ${className}`}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 10000,
        // Hide until position is computed to prevent flash
        visibility: shouldShow ? 'visible' : 'hidden',
        pointerEvents: shouldShow ? 'auto' : 'none',
        // Disable transitions on first render to prevent animation from 0,0
        transition: isPositionComputed ? undefined : 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {(title || showBackButton) && (
        <div className="popover-header">
          {showBackButton && onBack && (
            <button
              type="button"
              className="popover-back-button"
              onClick={onBack}
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8.5" viewBox="0 0 8 8.5">
                <g fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
                  <path d="m1.5 6.75 5-5M6.5 6.75l-5-5"></path>
                </g>
              </svg>
            </button>
          )}
          {title && <h3 className="popover-title">{title}</h3>}
          <button
            type="button"
            className="popover-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8.5" viewBox="0 0 8 8.5">
              <g fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
                <path d="m1.5 6.75 5-5M6.5 6.75l-5-5"></path>
              </g>
            </svg>
          </button>
        </div>
      )}
      <div 
        ref={contentRef}
        className="popover-content" 
        style={{
          ...(maxHeight ? { maxHeight, overflow: 'auto' } : {}),
          ...(needsScrolling && position.top !== -9999 ? { 
            maxHeight: `${window.innerHeight - position.top - (title || showBackButton ? 60 : 0) - 16}px`,
            overflow: 'auto'
          } : {})
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

