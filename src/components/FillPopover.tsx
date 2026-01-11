import React, { useState, useRef, useEffect, useRef as useRefHook } from 'react';
import { Popover } from './Popover';
import { useTheme } from '../theme/ThemeProvider';

type FillType = 'image' | 'color' | 'gradient';

interface FillPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  fillType: FillType;
  imageUrl?: string;
  imageType?: string;
  imageDescription?: string;
  color?: string;
  opacity?: number;
  onImageUrlChange?: (url: string) => void;
  onImageTypeChange?: (type: string) => void;
  onImageDescriptionChange?: (description: string) => void;
  onColorChange?: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
  onEditImage?: () => void;
}

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper to convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Helper to convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r, g, b };
}

// Helper to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
}

export function FillPopover({
  isOpen,
  onClose,
  anchorElement,
  fillType: initialFillType,
  imageUrl,
  imageType = 'Fill',
  imageDescription,
  color: initialColor = '#000000',
  opacity: initialOpacity = 1,
  onImageUrlChange,
  onImageTypeChange,
  onImageDescriptionChange,
  onColorChange,
  onOpacityChange,
  onEditImage,
}: FillPopoverProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<FillType>(initialFillType);
  const [isHovering, setIsHovering] = useState(false);
  const imagePreviewRef = useRef<HTMLDivElement>(null);
  
  
  // Initialize HSL from initial color
  const getInitialHsl = () => {
    const rgb = hexToRgb(initialColor);
    if (rgb) {
      return rgbToHsl(rgb.r, rgb.g, rgb.b);
    }
    return { h: 0, s: 0, l: 100 }; // Default to white if invalid
  };
  const initialHsl = getInitialHsl();

  // Color picker state
  const [color, setColor] = useState(initialColor);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [hue, setHue] = useState(initialHsl.h);
  const [saturation, setSaturation] = useState(initialHsl.s);
  const [lightness, setLightness] = useState(initialHsl.l);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [isDraggingOpacity, setIsDraggingOpacity] = useState(false);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const opacitySliderRef = useRef<HTMLDivElement>(null);

  // Sync HSL when popover opens or initialColor changes
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    // When popover opens, sync HSL from initialColor
    if (isOpen && !prevIsOpenRef.current) {
      const rgb = hexToRgb(initialColor);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
        setColor(initialColor);
      }
    }
    // Also sync if initialColor changes while popover is open
    else if (isOpen && initialColor && initialColor !== color) {
      const rgb = hexToRgb(initialColor);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
        setColor(initialColor);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialColor, color]);

  // Update color when HSL changes (this is a fallback, but we also call onColorChange directly in handlers for instant updates)
  // Only update when color actually changes due to HSL changes, not when just switching tabs
  const prevHslRef = useRef<{ h: number; s: number; l: number }>({ h: hue, s: saturation, l: lightness });
  useEffect(() => {
    // Don't run if popover is closed
    if (!isOpen) return;
    
    // Only call onColorChange if HSL actually changed (user interaction), not when just switching tabs
    const hslChanged = prevHslRef.current.h !== hue || 
                       prevHslRef.current.s !== saturation || 
                       prevHslRef.current.l !== lightness;
    
    if (activeTab === 'color' && !isDragging && !isDraggingHue && hslChanged && onColorChange) {
      const rgb = hslToRgb(hue, saturation, lightness);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      if (color !== hex) {
        try {
          setColor(hex);
          onColorChange(hex);
        } catch (error) {
          console.error('Error updating color:', error);
        }
      }
      prevHslRef.current = { h: hue, s: saturation, l: lightness };
    }
  }, [hue, saturation, lightness, activeTab, isDragging, isDraggingHue, color, isOpen, onColorChange]);

  // Update opacity
  useEffect(() => {
    // Don't run if popover is closed
    if (!isOpen) return;
    
    if (activeTab === 'color' && onOpacityChange) {
      try {
        onOpacityChange(opacity);
      } catch (error) {
        console.error('Error updating opacity:', error);
      }
    }
  }, [opacity, activeTab, isOpen, onOpacityChange]);

  // Mouse drag handlers for color picker
  useEffect(() => {
    if (!isDragging && !isDraggingHue && !isDraggingOpacity) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && spectrumRef.current) {
        const rect = spectrumRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const newSaturation = Math.max(0, Math.min(100, x));
        const newLightness = Math.max(0, Math.min(100, 100 - y));
        setSaturation(newSaturation);
        setLightness(newLightness);
        // Immediately update color during drag
        const rgb = hslToRgb(hue, newSaturation, newLightness);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        setColor(hex);
        onColorChange?.(hex);
      } else if (isDraggingHue && hueSliderRef.current) {
        const rect = hueSliderRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const newHue = Math.max(0, Math.min(360, x * 3.6));
        setHue(newHue);
        // Immediately update color during drag
        const rgb = hslToRgb(newHue, saturation, lightness);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        setColor(hex);
        onColorChange?.(hex);
      } else if (isDraggingOpacity && opacitySliderRef.current) {
        const rect = opacitySliderRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setOpacity(Math.max(0, Math.min(1, x / 100)));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsDraggingHue(false);
      setIsDraggingOpacity(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isDraggingHue, isDraggingOpacity]);

  const handleSpectrumClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newSaturation = Math.max(0, Math.min(100, x));
    const newLightness = Math.max(0, Math.min(100, 100 - y));
    setSaturation(newSaturation);
    setLightness(newLightness);
    // Immediately update color
    const rgb = hslToRgb(hue, newSaturation, newLightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setColor(hex);
    onColorChange?.(hex);
  };

  const handleHueSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const newHue = Math.max(0, Math.min(360, x * 3.6));
    setHue(newHue);
    // Immediately update color
    const rgb = hslToRgb(newHue, saturation, lightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setColor(hex);
    onColorChange?.(hex);
  };

  const handleOpacitySliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!opacitySliderRef.current) return;
    const rect = opacitySliderRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setOpacity(Math.max(0, Math.min(1, x / 100)));
  };

  // Get theme colors
  const themeColors = [
    { name: 'Primary color', color: theme?.colors?.accent || '#326CF6' },
    { name: 'Lighter primary color', color: '#5A8AFF' },
    { name: 'Darker primary color', color: '#1A4FD9' },
  ];

  const handleChooseImage = () => {
    // Trigger file picker or URL input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          if (url && onImageUrlChange) {
            onImageUrlChange(url);
            // Switch to image tab when image is selected
            setActiveTab('image');
          }
        };
        reader.onerror = () => {
          console.error('Error reading file');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      anchorElement={anchorElement}
      title="Fill"
      className="fill-popover"
      maxHeight="calc(100vh - 32px)"
      contentKey={activeTab}
    >
      <div className="fill-popover-tabs fill-popover-tabs-sticky">
        <button
          type="button"
          className={`fill-popover-tab ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          Image
        </button>
        <button
          type="button"
          className={`fill-popover-tab ${activeTab === 'color' ? 'active' : ''}`}
          onClick={() => setActiveTab('color')}
        >
          Color
        </button>
        <button
          type="button"
          className={`fill-popover-tab ${activeTab === 'gradient' ? 'active' : ''}`}
          onClick={() => setActiveTab('gradient')}
        >
          Gradient
        </button>
      </div>

      {activeTab === 'image' && (
        <div 
          className="fill-popover-image-content"
          onClick={(e) => {
            // Allow clicks on white space to work (don't interfere with click-outside)
            // Only stop propagation for interactive elements
            const target = e.target as HTMLElement;
            if (target.closest('.fill-popover-image-preview') || 
                target.closest('.fill-popover-image-inputs') ||
                target.closest('.fill-popover-edit-image-button')) {
              // These elements handle their own clicks
            }
            // Otherwise, let click bubble (but Popover's stopPropagation will catch it)
          }}
        >
          <div
            ref={imagePreviewRef}
            className="fill-popover-image-preview"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{ cursor: !imageUrl ? 'pointer' : 'default' }}
          >
            {imageUrl ? (
              <>
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="fill-popover-image"
                  onError={(e) => {
                    console.error('Image failed to load:', imageUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully');
                  }}
                />
                {isHovering && (
                  <div className="fill-popover-image-overlay" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="fill-popover-choose-image-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChooseImage();
                      }}
                    >
                      Choose image ...
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                className="fill-popover-choose-image-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChooseImage();
                }}
              >
                Choose image ...
              </button>
            )}
          </div>

          <div className="fill-popover-image-inputs">
            <div className="fill-popover-input-group">
              <label>Url</label>
              <input
                type="text"
                value={imageUrl || ''}
                onChange={(e) => onImageUrlChange?.(e.target.value)}
                placeholder="Add..."
                className="fill-popover-input"
              />
            </div>

            <div className="fill-popover-input-group">
              <label>Type</label>
              <select
                value={imageType}
                onChange={(e) => onImageTypeChange?.(e.target.value)}
                className="fill-popover-select"
              >
                <option value="Fill">Fill</option>
                <option value="Fit">Fit</option>
                <option value="Stretch">Stretch</option>
              </select>
            </div>

            <div className="fill-popover-input-group">
              <label>Description</label>
              <input
                type="text"
                value={imageDescription || ''}
                onChange={(e) => onImageDescriptionChange?.(e.target.value)}
                placeholder="Add..."
                className="fill-popover-input"
              />
            </div>
          </div>

          {imageUrl && (
            <button
              type="button"
              className="fill-popover-edit-image-button"
              onClick={(e) => {
                e.stopPropagation();
                if (onEditImage) {
                  onEditImage();
                } else {
                  handleChooseImage();
                }
              }}
            >
              <svg
                data-icon-component=""
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                width="14"
                height="14"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M14.492 3.414 8.921 8.985a4.312 4.312 0 0 0 6.105 6.09l5.564-5.562 1.414 1.414-5.664 5.664a6.002 6.002 0 0 1-2.182 1.392L3.344 21.94 2.06 20.656 6.02 9.845c.3-.82.774-1.563 1.391-2.18l.093-.092.01-.01L13.077 2l1.415 1.414ZM4.68 19.32l4.486-1.64a6.305 6.305 0 0 1-1.651-1.19 6.306 6.306 0 0 1-1.192-1.655L4.68 19.32Z"
                  clipRule="evenodd"
                />
              </svg>
              Edit image
            </button>
          )}
        </div>
      )}

      {activeTab === 'color' && (
        <div className="fill-popover-color-content">
          {/* Color Spectrum */}
          <div
            ref={spectrumRef}
            className="color-picker-spectrum"
            style={{
              background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`,
            }}
            onClick={handleSpectrumClick}
            onMouseDown={() => setIsDragging(true)}
          >
            <div
              className="color-picker-spectrum-handle"
              style={{
                left: `${saturation}%`,
                top: `${100 - lightness}%`,
              }}
            />
          </div>

          {/* Hue Slider */}
          <div
            ref={hueSliderRef}
            className="color-picker-hue-slider"
            style={{
              background: `linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)`,
            }}
            onClick={handleHueSliderClick}
            onMouseDown={() => setIsDraggingHue(true)}
          >
            <div
              className="color-picker-slider-handle"
              style={{
                left: `${hue / 3.6}%`,
              }}
            />
          </div>

          {/* Opacity Slider */}
          <div
            ref={opacitySliderRef}
            className="color-picker-opacity-slider"
            style={{
              background: `linear-gradient(to right, transparent, ${color})`,
            }}
            onClick={handleOpacitySliderClick}
            onMouseDown={() => setIsDraggingOpacity(true)}
          >
            <div
              className="color-picker-slider-handle"
              style={{
                left: `${opacity * 100}%`,
              }}
            />
          </div>

          {/* Input Fields */}
          <div className="color-picker-inputs">
            <input
              type="text"
              value={color.toUpperCase()}
              onChange={(e) => {
                const newColor = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(newColor)) {
                  setColor(newColor);
                  // Immediately call onColorChange when hex input changes
                  if (newColor.length === 7) { // Only call when valid 6-digit hex
                    onColorChange?.(newColor);
                  }
                  const rgb = hexToRgb(newColor);
                  if (rgb) {
                    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                    setHue(hsl.h);
                    setSaturation(hsl.s);
                    setLightness(hsl.l);
                  }
                }
              }}
              className="color-picker-hex-input"
              placeholder="#000000"
            />
            <input
              type="text"
              value={`${Math.round(opacity * 100)}%`}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace('%', ''), 10);
                if (!isNaN(value)) {
                  setOpacity(Math.max(0, Math.min(100, value)) / 100);
                }
              }}
              className="color-picker-opacity-input"
              placeholder="100%"
            />
          </div>

          {/* Theme Colors */}
          <div className="color-picker-theme-colors">
            {themeColors.map((themeColor, index) => (
              <div key={index} className="color-picker-theme-color-item">
                <div
                  className="color-picker-theme-color-swatch"
                  style={{ backgroundColor: themeColor.color }}
                  onClick={() => {
                    setColor(themeColor.color);
                    // Immediately call onColorChange when theme color is clicked
                    onColorChange?.(themeColor.color);
                    const rgb = hexToRgb(themeColor.color);
                    if (rgb) {
                      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                      setHue(hsl.h);
                      setSaturation(hsl.s);
                      setLightness(hsl.l);
                    }
                  }}
                />
                <span className="color-picker-theme-color-label">{themeColor.name}</span>
              </div>
            ))}
          </div>

          {/* New Style Button */}
          <button type="button" className="color-picker-new-style-button">
            New style
          </button>
        </div>
      )}

      {activeTab === 'gradient' && (
        <div className="fill-popover-gradient-content">
          <div className="fill-popover-gradient-placeholder">
            Gradient editor coming soon
          </div>
        </div>
      )}
    </Popover>
  );
}

