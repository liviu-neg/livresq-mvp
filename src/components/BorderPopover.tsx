import React, { useState, useEffect } from 'react';
import { Popover } from './Popover';

interface BorderPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  color: string;
  width: {
    mode: 'uniform' | 'individual';
    uniform?: number;
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  style: 'solid' | 'dashed' | 'dotted' | 'double';
  onColorChange: (color: string) => void;
  onWidthChange: (width: BorderPopoverProps['width']) => void;
  onStyleChange: (style: 'solid' | 'dashed' | 'dotted' | 'double') => void;
  onOpenColorPicker: () => void;
}

export function BorderPopover({
  isOpen,
  onClose,
  anchorElement,
  color,
  width,
  style,
  onColorChange,
  onWidthChange,
  onStyleChange,
  onOpenColorPicker,
}: BorderPopoverProps) {
  const [localColor, setLocalColor] = useState(color || '#326CF6');
  const [localWidth, setLocalWidth] = useState(width || { mode: 'uniform' as const, uniform: 0 });
  const [localStyle, setLocalStyle] = useState(style || 'solid');

  // Sync local state with props only when popover first opens (to avoid flickering)
  const prevIsOpenRef = React.useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Popover just opened - sync with props once
      if (color) setLocalColor(color);
      if (width && (width.uniform !== undefined || width.top !== undefined || width.right !== undefined || width.bottom !== undefined || width.left !== undefined)) {
        setLocalWidth(width);
      }
      if (style) setLocalStyle(style);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]); // Only depend on isOpen, not on color/width/style to prevent feedback loops

  const handleColorClick = () => {
    onOpenColorPicker();
  };

  const handleWidthModeChange = (mode: 'uniform' | 'individual') => {
    const newWidth = {
      ...localWidth,
      mode,
    };
    setLocalWidth(newWidth);
    onWidthChange(newWidth);
  };

  const handleUniformWidthChange = (value: number) => {
    const newWidth = {
      ...localWidth,
      mode: 'uniform' as const,
      uniform: value,
    };
    setLocalWidth(newWidth);
    onWidthChange(newWidth);
  };

  const handleIndividualWidthChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const newWidth = {
      ...localWidth,
      mode: 'individual' as const,
      [side]: value,
    };
    setLocalWidth(newWidth);
    onWidthChange(newWidth);
  };

  const handleStyleChange = (newStyle: 'solid' | 'dashed' | 'dotted' | 'double') => {
    setLocalStyle(newStyle);
    onStyleChange(newStyle);
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      anchorElement={anchorElement}
      title="Border"
      className="border-popover"
    >
      <div className="border-popover-content">
        {/* Color */}
        <div className="border-popover-group">
          <label>Color</label>
          <div className="border-popover-color-input" onClick={handleColorClick}>
            <div
              className="border-popover-color-swatch"
              style={{ backgroundColor: localColor }}
            />
            <input
              type="text"
              value={localColor.toUpperCase()}
              onChange={(e) => {
                const newColor = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(newColor)) {
                  setLocalColor(newColor);
                  onColorChange(newColor);
                }
              }}
              className="border-popover-color-text"
              placeholder="#326CF6"
            />
            <button
              type="button"
              className="border-popover-color-clear"
              onClick={(e) => {
                e.stopPropagation();
                setLocalColor('#000000');
                onColorChange('#000000');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
                <path
                  d="M2.75.75a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2h4.5a2 2 0 0 0 2-2v-4.5a2 2 0 0 0-2-2Z"
                  fill="transparent"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Width */}
        <div className="border-popover-group">
          <label>Width</label>
          <div className="border-popover-width-controls">
            {localWidth.mode === 'uniform' ? (
              <div className="border-popover-width-uniform">
                <input
                  type="number"
                  value={localWidth.uniform || 0}
                  onChange={(e) => handleUniformWidthChange(parseInt(e.target.value, 10) || 0)}
                  className="border-popover-width-input"
                  min="0"
                />
                <div className="border-popover-width-mode-toggle">
                  <button
                    type="button"
                    className={`border-popover-mode-button ${localWidth.mode === 'uniform' ? 'active' : ''}`}
                    onClick={() => handleWidthModeChange('uniform')}
                    aria-label="Uniform width"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
                      <path
                        d="M 0.75 3.5 L 0.75 2.75 C 0.75 1.645 1.645 0.75 2.75 0.75 L 3.5 0.75"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 9.25 3.5 L 9.25 2.75 C 9.25 1.645 8.355 0.75 7.25 0.75 L 6.5 0.75"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 9.25 6.5 L 9.25 7.25 C 9.25 8.355 8.355 9.25 7.25 9.25 L 6.5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 0.75 6.5 L 0.75 7.25 C 0.75 8.355 1.645 9.25 2.75 9.25 L 3.5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`border-popover-mode-button ${localWidth.mode === 'individual' ? 'active' : ''}`}
                    onClick={() => handleWidthModeChange('individual')}
                    aria-label="Individual width"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
                      <path
                        d="M 0.75 3.5 L 0.75 2.75 C 0.75 1.645 1.645 0.75 2.75 0.75 L 3.5 0.75"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 9.25 3.5 L 9.25 2.75 C 9.25 1.645 8.355 0.75 7.25 0.75 L 6.5 0.75"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 9.25 6.5 L 9.25 7.25 C 9.25 8.355 8.355 9.25 7.25 9.25 L 6.5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 0.75 6.5 L 0.75 7.25 C 0.75 8.355 1.645 9.25 2.75 9.25 L 3.5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 5 0.75 L 5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 0.75 5 L 9.25 5"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-popover-width-individual">
                <div className="border-popover-width-inputs">
                  <input
                    type="number"
                    value={localWidth.top || 0}
                    onChange={(e) => handleIndividualWidthChange('top', parseInt(e.target.value, 10) || 0)}
                    className="border-popover-width-input"
                    min="0"
                  />
                  <input
                    type="number"
                    value={localWidth.right || 0}
                    onChange={(e) => handleIndividualWidthChange('right', parseInt(e.target.value, 10) || 0)}
                    className="border-popover-width-input"
                    min="0"
                  />
                  <input
                    type="number"
                    value={localWidth.bottom || 0}
                    onChange={(e) => handleIndividualWidthChange('bottom', parseInt(e.target.value, 10) || 0)}
                    className="border-popover-width-input"
                    min="0"
                  />
                  <input
                    type="number"
                    value={localWidth.left || 0}
                    onChange={(e) => handleIndividualWidthChange('left', parseInt(e.target.value, 10) || 0)}
                    className="border-popover-width-input"
                    min="0"
                  />
                </div>
                <div className="border-popover-width-labels">
                  <span>T</span>
                  <span>R</span>
                  <span>B</span>
                  <span>L</span>
                </div>
                <div className="border-popover-width-mode-toggle">
                  <button
                    type="button"
                    className={`border-popover-mode-button ${localWidth.mode === 'uniform' ? 'active' : ''}`}
                    onClick={() => handleWidthModeChange('uniform')}
                    aria-label="Uniform width"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
                      <path
                        d="M 0.75 3.5 L 0.75 2.75 C 0.75 1.645 1.645 0.75 2.75 0.75 L 3.5 0.75"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 9.25 3.5 L 9.25 2.75 C 9.25 1.645 8.355 0.75 7.25 0.75 L 6.5 0.75"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 9.25 6.5 L 9.25 7.25 C 9.25 8.355 8.355 9.25 7.25 9.25 L 6.5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 0.75 6.5 L 0.75 7.25 C 0.75 8.355 1.645 9.25 2.75 9.25 L 3.5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`border-popover-mode-button ${localWidth.mode === 'individual' ? 'active' : ''}`}
                    onClick={() => handleWidthModeChange('individual')}
                    aria-label="Individual width"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
                      <path
                        d="M 0.75 3.5 L 0.75 2.75 C 0.75 1.645 1.645 0.75 2.75 0.75 L 3.5 0.75"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 9.25 3.5 L 9.25 2.75 C 9.25 1.645 8.355 0.75 7.25 0.75 L 6.5 0.75"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 9.25 6.5 L 9.25 7.25 C 9.25 8.355 8.355 9.25 7.25 9.25 L 6.5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 0.75 6.5 L 0.75 7.25 C 0.75 8.355 1.645 9.25 2.75 9.25 L 3.5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 5 0.75 L 5 9.25"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                      <path
                        d="M 0.75 5 L 9.25 5"
                        fill="transparent"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Style */}
        <div className="border-popover-group">
          <label>Style</label>
          <select
            value={localStyle}
            onChange={(e) => handleStyleChange(e.target.value as 'solid' | 'dashed' | 'dotted' | 'double')}
            className="border-popover-style-select"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="double">Double</option>
          </select>
        </div>
      </div>
    </Popover>
  );
}


