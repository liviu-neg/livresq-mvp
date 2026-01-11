import React from 'react';

interface Segment {
  value: string;
  icon: React.ReactNode;
}

interface SegmentedIconControlProps {
  value: string;
  segments: Segment[];
  onChange: (value: string) => void;
}

export function SegmentedIconControl({ value, segments, onChange }: SegmentedIconControlProps) {
  return (
    <div className="ui-segmented-control">
      {segments.map((segment) => (
        <button
          key={segment.value}
          type="button"
          className={`ui-segmented-control-segment ${value === segment.value ? 'active' : ''}`}
          onClick={() => onChange(segment.value)}
          aria-label={segment.value}
        >
          {segment.icon}
        </button>
      ))}
    </div>
  );
}

