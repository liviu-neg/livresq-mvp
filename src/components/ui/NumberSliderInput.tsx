import React, { useState, useRef, useEffect } from 'react';

interface NumberSliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberSliderInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: NumberSliderInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const updateValue = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = min + (percentage / 100) * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    onChange(clampedValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateValue(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  return (
    <div className="ui-number-slider-input">
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const numValue = parseInt(e.target.value, 10) || min;
          const clampedValue = Math.max(min, Math.min(max, numValue));
          onChange(clampedValue);
        }}
        min={min}
        max={max}
        step={step}
        className="ui-number-slider-input-field"
      />
      <div
        ref={sliderRef}
        className="ui-slider"
        onMouseDown={handleMouseDown}
        onClick={(e) => updateValue(e.clientX)}
      >
        <div className="ui-slider-track">
          <div
            className="ui-slider-fill"
            style={{ width: `${percentage}%` }}
          />
          <div
            className="ui-slider-thumb"
            style={{ left: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}


