import React, { useState, useRef, useEffect } from 'react';
import { Popover } from './Popover';
import { useTheme } from '../theme/ThemeProvider';

interface ColorPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  color: string;
  opacity: number;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
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

export function ColorPickerPopover({
  isOpen,
  onClose,
  anchorElement,
  color: initialColor,
  opacity: initialOpacity,
  onColorChange,
  onOpacityChange,
  showBackButton = false,
  onBack,
  title,
}: ColorPickerPopoverProps) {
  const theme = useTheme();
  const [color, setColor] = useState(initialColor || '#000000');
  const [opacity, setOpacity] = useState(initialOpacity ?? 1);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [isDraggingOpacity, setIsDraggingOpacity] = useState(false);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const opacitySliderRef = useRef<HTMLDivElement>(null);

  // Initialize from color
  useEffect(() => {
    if (initialColor) {
      const rgb = hexToRgb(initialColor);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
      }
    }
  }, [initialColor]);

  // Update color when HSL changes
  useEffect(() => {
    const rgb = hslToRgb(hue, saturation, lightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setColor(hex);
    onColorChange(hex);
  }, [hue, saturation, lightness, onColorChange]);

  // Update opacity
  useEffect(() => {
    onOpacityChange(opacity);
  }, [opacity, onOpacityChange]);

  const handleSpectrumClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSaturation(Math.max(0, Math.min(100, x)));
    setLightness(Math.max(0, Math.min(100, 100 - y)));
  };

  const handleHueSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setHue(Math.max(0, Math.min(360, x * 3.6)));
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
    { name: 'Lighter primary color', color: '#5A8AFF' }, // Lighter version
    { name: 'Darker primary color', color: '#1A4FD9' }, // Darker version
  ];

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      anchorElement={anchorElement}
      title={title || 'Fill'}
      showBackButton={showBackButton}
      onBack={onBack}
      className="color-picker-popover"
    >
      <div className="color-picker-tabs">
        <button type="button" className="color-picker-tab">Image</button>
        <button type="button" className="color-picker-tab active">Color</button>
        <button type="button" className="color-picker-tab">Gradient</button>
      </div>

      <div className="color-picker-content">
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
    </Popover>
  );
}


