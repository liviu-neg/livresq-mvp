import React, { useRef, useState } from 'react';
import { FillPopover } from './FillPopover';
import { ColorPickerPopover } from './ColorPickerPopover';

interface FramerFillInputProps {
  label?: string;
  value?: {
    type: 'image' | 'color' | 'gradient';
    imageUrl?: string;
    imageType?: string;
    imageDescription?: string;
    color?: string;
    opacity?: number;
  };
  onChange?: (value: {
    type: 'image' | 'color' | 'gradient';
    imageUrl?: string;
    imageType?: string;
    imageDescription?: string;
    color?: string;
    opacity?: number;
  }) => void;
  onEditImage?: () => void;
}

export function FramerFillInput({
  label,
  value,
  onChange,
  onEditImage,
}: FramerFillInputProps) {
  const [isFillPopoverOpen, setIsFillPopoverOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const fillType = value?.type || 'color';
  const hasValue = value?.imageUrl || value?.color;

  const handleFillInputClick = () => {
    setIsFillPopoverOpen(true);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.({
      type: 'color',
      color: undefined,
      opacity: 1,
    });
  };

  const handleImageUrlChange = (url: string) => {
    onChange?.({
      ...value,
      type: 'image',
      imageUrl: url,
    });
  };

  const handleImageTypeChange = (type: string) => {
    onChange?.({
      ...value,
      type: 'image',
      imageType: type,
    });
  };

  const handleImageDescriptionChange = (description: string) => {
    onChange?.({
      ...value,
      type: 'image',
      imageDescription: description,
    });
  };

  const handleColorChange = (color: string) => {
    onChange?.({
      ...value,
      type: 'color',
      color,
    });
  };

  const handleOpacityChange = (opacity: number) => {
    onChange?.({
      ...value,
      opacity,
    });
  };

  const handleOpenColorPicker = () => {
    setIsFillPopoverOpen(false);
    setIsColorPickerOpen(true);
  };

  return (
    <>
      <div className="property-group">
        {label && <label className="property-label">{label}</label>}
        <div
          ref={anchorRef}
          className="fill-input"
          onClick={handleFillInputClick}
        >
          {fillType === 'image' && value?.imageUrl ? (
            <div className="fill-input-preview">
              <img src={value.imageUrl} alt="Preview" />
            </div>
          ) : fillType === 'color' && value?.color ? (
            <div
              className="fill-input-swatch"
              style={{
                backgroundColor: value.color ? (() => {
                  const hex = value.color.replace('#', '');
                  const r = parseInt(hex.substring(0, 2), 16);
                  const g = parseInt(hex.substring(2, 4), 16);
                  const b = parseInt(hex.substring(4, 6), 16);
                  const opacity = value.opacity ?? 1;
                  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                })() : value.color,
                backgroundImage: (value.opacity ?? 1) < 1 ? `
                  linear-gradient(45deg, #ccc 25%, transparent 25%),
                  linear-gradient(-45deg, #ccc 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #ccc 75%),
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                ` : undefined,
                backgroundSize: (value.opacity ?? 1) < 1 ? '8px 8px' : undefined,
                backgroundPosition: (value.opacity ?? 1) < 1 ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
              }}
            />
          ) : (
            <div className="fill-input-placeholder">Add...</div>
          )}
          {hasValue && (
            <button
              type="button"
              className="fill-input-clear"
              onClick={handleClear}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8.5" viewBox="0 0 8 8.5">
                <g fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
                  <path d="m1.5 6.75 5-5M6.5 6.75l-5-5"></path>
                </g>
              </svg>
            </button>
          )}
        </div>
      </div>

      <FillPopover
        isOpen={isFillPopoverOpen}
        onClose={() => setIsFillPopoverOpen(false)}
        anchorElement={anchorRef.current}
        fillType={fillType}
        imageUrl={value?.imageUrl}
        imageType={value?.imageType}
        imageDescription={value?.imageDescription}
        color={value?.color}
        opacity={value?.opacity}
        onImageUrlChange={handleImageUrlChange}
        onImageTypeChange={handleImageTypeChange}
        onImageDescriptionChange={handleImageDescriptionChange}
        onColorChange={handleColorChange}
        onOpacityChange={handleOpacityChange}
        onEditImage={onEditImage}
        onOpenColorPicker={handleOpenColorPicker}
      />

      <ColorPickerPopover
        isOpen={isColorPickerOpen}
        onClose={() => {
          setIsColorPickerOpen(false);
          setIsFillPopoverOpen(true);
        }}
        anchorElement={anchorRef.current}
        color={value?.color || '#000000'}
        opacity={value?.opacity ?? 1}
        onColorChange={handleColorChange}
        onOpacityChange={handleOpacityChange}
        showBackButton={true}
        onBack={() => {
          setIsColorPickerOpen(false);
          setIsFillPopoverOpen(true);
        }}
        title="Fill"
      />
    </>
  );
}


