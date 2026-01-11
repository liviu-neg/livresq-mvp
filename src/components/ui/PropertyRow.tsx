import React from 'react';

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

export function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="ui-property-row">
      <div className="ui-property-row-label">{label}</div>
      <div className="ui-property-row-value">{children}</div>
    </div>
  );
}

