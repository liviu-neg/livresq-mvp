import React from 'react';

interface PanelSectionProps {
  title: string;
  children: React.ReactNode;
}

export function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <div className="ui-section">
      <h3 className="ui-section-title">{title}</h3>
      {children}
    </div>
  );
}

