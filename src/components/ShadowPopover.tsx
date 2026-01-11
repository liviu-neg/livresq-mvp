import React, { useState, useEffect, useRef } from 'react';
import { Popover } from './Popover';
import { ColorPickerPopover } from './ColorPickerPopover';

export interface Shadow {
  type: 'box' | 'realistic';
  position: 'outside' | 'inside';
  color: string;
  opacity: number;
  x: number;
  y: number;
  blur: number;
  spread: number;
}

interface ShadowPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  shadow: Shadow | null;
  onShadowChange: (shadow: Shadow | null) => void;
  onOpenColorPicker: () => void;
}

export function ShadowPopover({
  isOpen,
  onClose,
  anchorElement,
  shadow,
  onShadowChange,
  onOpenColorPicker,
}: ShadowPopoverProps) {
  const [localShadow, setLocalShadow] = useState<Shadow>(() => {
    if (shadow) return shadow;
    return {
      type: 'box',
      position: 'outside',
      color: '#000000',
      opacity: 0.25,
      x: 0,
      y: 4,
      blur: 8,
      spread: 0,
    };
  });

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const prevIsOpenRef = useRef(false);

  // Initialize localShadow from shadow prop only when popover first opens
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (shadow) {
        setLocalShadow(shadow);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, shadow]);

  // Sync localShadow changes to parent
  useEffect(() => {
    if (isOpen && shadow !== null) {
      onShadowChange(localShadow);
    }
  }, [localShadow, isOpen, onShadowChange]);

  const handleTypeChange = (type: 'box' | 'realistic') => {
    setLocalShadow({ ...localShadow, type });
  };

  const handlePositionChange = (position: 'outside' | 'inside') => {
    setLocalShadow({ ...localShadow, position });
  };

  const handleColorClick = () => {
    setIsColorPickerOpen(true);
  };

  const handleColorChange = (color: string) => {
    setLocalShadow({ ...localShadow, color });
  };

  const handleNumberChange = (field: 'x' | 'y' | 'blur' | 'spread', value: number) => {
    setLocalShadow({ ...localShadow, [field]: value });
  };

  const handleOpacityChange = (opacity: number) => {
    setLocalShadow({ ...localShadow, opacity });
  };

  if (!isOpen) return null;

  return (
    <>
      <Popover
        isOpen={isOpen && !isColorPickerOpen}
        onClose={onClose}
        anchorElement={anchorElement}
        title="Shadow"
        className="shadow-popover"
      >
        <div className="shadow-popover-content">
          {/* Type */}
          <div className="shadow-popover-group">
            <label>Type</label>
            <div className="shadow-popover-segmented">
              <button
                type="button"
                className={`shadow-popover-segment ${localShadow.type === 'box' ? 'active' : ''}`}
                onClick={() => handleTypeChange('box')}
              >
                Box
              </button>
              <button
                type="button"
                className={`shadow-popover-segment ${localShadow.type === 'realistic' ? 'active' : ''}`}
                onClick={() => handleTypeChange('realistic')}
              >
                Realistic
              </button>
            </div>
          </div>

          {/* Position */}
          <div className="shadow-popover-group">
            <label>Position</label>
            <div className="shadow-popover-segmented">
              <button
                type="button"
                className={`shadow-popover-segment ${localShadow.position === 'outside' ? 'active' : ''}`}
                onClick={() => handlePositionChange('outside')}
              >
                Outside
              </button>
              <button
                type="button"
                className={`shadow-popover-segment ${localShadow.position === 'inside' ? 'active' : ''}`}
                onClick={() => handlePositionChange('inside')}
              >
                Inside
              </button>
            </div>
          </div>

          {/* Color */}
          <div className="shadow-popover-group">
            <label>Color</label>
            <div className="shadow-popover-color-input" onClick={handleColorClick}>
              <div
                className="shadow-popover-color-swatch"
                style={{ backgroundColor: localShadow.color }}
              />
              <input
                type="text"
                value={localShadow.color.toUpperCase()}
                onChange={(e) => {
                  const newColor = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(newColor)) {
                    handleColorChange(newColor);
                  }
                }}
                className="shadow-popover-color-text"
                placeholder="#000000"
              />
              <button
                type="button"
                className="shadow-popover-color-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange('#000000');
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

          {/* Number inputs */}
          <div className="shadow-popover-group">
            <label>X</label>
            <div className="shadow-popover-number-input-group">
              <input
                type="number"
                value={localShadow.x}
                onChange={(e) => handleNumberChange('x', parseInt(e.target.value, 10) || 0)}
                className="shadow-popover-number-input"
              />
              <div className="shadow-popover-number-buttons">
                <button
                  type="button"
                  className="shadow-popover-number-button"
                  onClick={() => handleNumberChange('x', localShadow.x - 1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="shadow-popover-number-button"
                  onClick={() => handleNumberChange('x', localShadow.x + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="shadow-popover-group">
            <label>Y</label>
            <div className="shadow-popover-number-input-group">
              <input
                type="number"
                value={localShadow.y}
                onChange={(e) => handleNumberChange('y', parseInt(e.target.value, 10) || 0)}
                className="shadow-popover-number-input"
              />
              <div className="shadow-popover-number-buttons">
                <button
                  type="button"
                  className="shadow-popover-number-button"
                  onClick={() => handleNumberChange('y', localShadow.y - 1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="shadow-popover-number-button"
                  onClick={() => handleNumberChange('y', localShadow.y + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="shadow-popover-group">
            <label>Blur</label>
            <div className="shadow-popover-number-input-group">
              <input
                type="number"
                value={localShadow.blur}
                onChange={(e) => handleNumberChange('blur', parseInt(e.target.value, 10) || 0)}
                className="shadow-popover-number-input"
                min="0"
              />
              <div className="shadow-popover-number-buttons">
                <button
                  type="button"
                  className="shadow-popover-number-button"
                  onClick={() => handleNumberChange('blur', Math.max(0, localShadow.blur - 1))}
                >
                  −
                </button>
                <button
                  type="button"
                  className="shadow-popover-number-button"
                  onClick={() => handleNumberChange('blur', localShadow.blur + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="shadow-popover-group">
            <label>Spread</label>
            <div className="shadow-popover-number-input-group">
              <input
                type="number"
                value={localShadow.spread}
                onChange={(e) => handleNumberChange('spread', parseInt(e.target.value, 10) || 0)}
                className="shadow-popover-number-input"
              />
              <div className="shadow-popover-number-buttons">
                <button
                  type="button"
                  className="shadow-popover-number-button"
                  onClick={() => handleNumberChange('spread', localShadow.spread - 1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="shadow-popover-number-button"
                  onClick={() => handleNumberChange('spread', localShadow.spread + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </Popover>

      <ColorPickerPopover
        isOpen={isColorPickerOpen}
        onClose={() => {
          setIsColorPickerOpen(false);
        }}
        anchorElement={anchorElement}
        color={localShadow.color}
        opacity={localShadow.opacity}
        onColorChange={handleColorChange}
        onOpacityChange={handleOpacityChange}
        hideImageTab={true}
      />
    </>
  );
}


