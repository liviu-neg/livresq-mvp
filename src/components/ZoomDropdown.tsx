import React, { useState, useRef, useEffect } from 'react';

interface ZoomDropdownProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function ZoomDropdown({ zoom, onZoomChange }: ZoomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const zoomOptions = [25, 50, 75, 100];
  const zoomIn = () => {
    const nextZoom = Math.min(100, Math.round((zoom + 10) / 10) * 10);
    onZoomChange(nextZoom);
  };
  const zoomOut = () => {
    const nextZoom = Math.max(25, Math.round((zoom - 10) / 10) * 10);
    onZoomChange(nextZoom);
  };
  const resetZoom = () => {
    onZoomChange(100);
  };

  return (
    <div className="zoom-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="zoom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Zoom"
      >
        {zoom}%
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && (
        <div className="zoom-dropdown-menu">
          <div className="zoom-dropdown-section">
            <button
              type="button"
              className="zoom-dropdown-item"
              onClick={() => {
                onZoomChange(100);
                setIsOpen(false);
              }}
            >
              <span>Zoom</span>
              <span className="zoom-dropdown-shortcut">Z</span>
            </button>
            <button
              type="button"
              className="zoom-dropdown-item"
              onClick={() => {
                zoomIn();
                setIsOpen(false);
              }}
            >
              <span>Zoom In</span>
              <span className="zoom-dropdown-shortcut">⌘ +</span>
            </button>
            <button
              type="button"
              className="zoom-dropdown-item"
              onClick={() => {
                zoomOut();
                setIsOpen(false);
              }}
            >
              <span>Zoom Out</span>
              <span className="zoom-dropdown-shortcut">⌘ -</span>
            </button>
          </div>
          <div className="zoom-dropdown-divider"></div>
          <div className="zoom-dropdown-section">
            {zoomOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`zoom-dropdown-item ${zoom === option ? 'active' : ''}`}
                onClick={() => {
                  onZoomChange(option);
                  setIsOpen(false);
                }}
              >
                <span>{option}%</span>
              </button>
            ))}
          </div>
          <div className="zoom-dropdown-divider"></div>
          <div className="zoom-dropdown-section">
            <button
              type="button"
              className="zoom-dropdown-item"
              onClick={() => {
                resetZoom();
                setIsOpen(false);
              }}
            >
              <span>Zoom to 100%</span>
              <span className="zoom-dropdown-shortcut">⌘ 0</span>
            </button>
            <button
              type="button"
              className="zoom-dropdown-item"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              <span>Zoom to Fit</span>
              <span className="zoom-dropdown-shortcut">⌘ 1</span>
            </button>
            <button
              type="button"
              className="zoom-dropdown-item zoom-dropdown-item-disabled"
              disabled
            >
              <span>Zoom to Selection</span>
              <span className="zoom-dropdown-shortcut">⌘ 2</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

