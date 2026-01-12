import React from 'react';

interface PillSelectProps {
  thumbnail?: string;
  swatchColor?: string;
  text: string;
  onClick?: () => void;
  onClear?: (e: React.MouseEvent) => void;
  showClear?: boolean;
  icon?: React.ReactNode; // Optional icon to display before text
}

export function PillSelect({ thumbnail, swatchColor, text, onClick, onClear, showClear = false, icon }: PillSelectProps) {
  // If icon is provided with swatchColor, show icon inside swatch
  const showIconInSwatch = icon && swatchColor && !thumbnail;
  // Check if swatch is in selected state (primary blue)
  const isSelected = swatchColor === '#326CF6';
  
  return (
    <button type="button" className="ui-pill-select" onClick={onClick}>
      {(thumbnail || swatchColor) && (
        <div className={`ui-pill-select-thumb ${swatchColor ? 'swatch' : ''} ${isSelected ? 'swatch-selected' : ''}`}>
          {thumbnail ? (
            <img src={thumbnail} alt="" />
          ) : swatchColor ? (
            <div style={{ width: '100%', height: '100%', backgroundColor: swatchColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showIconInSwatch && (
                <div className="ui-pill-select-icon-in-swatch">{icon}</div>
              )}
            </div>
          ) : null}
        </div>
      )}
      {icon && !thumbnail && !swatchColor && (
        <div className="ui-pill-select-icon">{icon}</div>
      )}
      <span className="ui-pill-select-text">{text}</span>
      {showClear && onClear && (
        <button
          type="button"
          className="ui-pill-select-close"
          onClick={(e) => {
            e.stopPropagation();
            onClear(e);
          }}
          aria-label="Clear"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8.5" viewBox="0 0 8 8.5">
            <g fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
              <path d="m1.5 6.75 5-5M6.5 6.75l-5-5"></path>
            </g>
          </svg>
        </button>
      )}
    </button>
  );
}

