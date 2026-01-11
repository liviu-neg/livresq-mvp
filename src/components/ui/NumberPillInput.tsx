import React from 'react';

interface NumberPillInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}

export function NumberPillInput({ value, onChange, min = 0, max, placeholder }: NumberPillInputProps) {
  return (
    <input
      type="number"
      className="ui-number-pill"
      value={value}
      onChange={(e) => {
        const numValue = parseInt(e.target.value, 10) || 0;
        const clampedValue = max !== undefined ? Math.min(max, Math.max(min, numValue)) : Math.max(min, numValue);
        onChange(clampedValue);
      }}
      min={min}
      max={max}
      placeholder={placeholder}
    />
  );
}

