import React from 'react';

interface Segment {
  value: string;
  label: string;
}

interface SegmentedTextControlProps {
  value: string;
  segments: Segment[];
  onChange: (value: string) => void;
}

export function SegmentedTextControl({
  value,
  segments,
  onChange,
}: SegmentedTextControlProps) {
  return (
    <div className="ui-segmented-control">
      {segments.map((segment) => (
        <button
          key={segment.value}
          type="button"
          className={`ui-segmented-control-segment ${value === segment.value ? 'active' : ''}`}
          onClick={() => onChange(segment.value)}
        >
          <span className="ui-segmented-control-segment-text">{segment.label}</span>
        </button>
      ))}
    </div>
  );
}


