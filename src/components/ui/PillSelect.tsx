import React from 'react';

interface PillSelectProps {
  thumbnail?: string;
  swatchColor?: string;
  swatchOpacity?: number; // Opacity for the color swatch (0-1)
  text: string;
  onClick?: () => void;
  onClear?: (e: React.MouseEvent) => void;
  showClear?: boolean;
  icon?: React.ReactNode; // Optional icon to display before text
}

// Helper to convert hex to rgba
function hexToRgba(hex: string, opacity: number = 1): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function PillSelect({ thumbnail, swatchColor, swatchOpacity = 1, text, onClick, onClear, showClear = false, icon }: PillSelectProps) {
  // If icon is provided with swatchColor, show icon inside swatch
  const showIconInSwatch = icon && swatchColor && !thumbnail;
  // Check if swatch is in selected state (primary blue)
  const isSelected = swatchColor === '#326CF6';
  
  // Create rgba color with opacity
  const swatchStyle = swatchColor ? {
    width: '100%',
    height: '100%',
    backgroundColor: hexToRgba(swatchColor, swatchOpacity),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Add checkerboard pattern background if opacity < 1
    backgroundImage: swatchOpacity < 1 ? `
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%)
    ` : undefined,
    backgroundSize: swatchOpacity < 1 ? '8px 8px' : undefined,
    backgroundPosition: swatchOpacity < 1 ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
  } : {};
  
  return (
    <button type="button" className="ui-pill-select" onClick={onClick}>
      {(thumbnail || swatchColor) && (
        <div className={`ui-pill-select-thumb ${swatchColor ? 'swatch' : ''} ${isSelected ? 'swatch-selected' : ''}`}>
          {thumbnail ? (
            <img src={thumbnail} alt="" />
          ) : swatchColor ? (
            <div style={swatchStyle}>
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

