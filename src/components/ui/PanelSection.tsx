import React, { useRef } from 'react';

interface PanelSectionProps {
  title: string;
  children?: React.ReactNode;
  showAddButton?: boolean;
  onAddEffect?: (button: HTMLElement) => void;
}

export function PanelSection({ title, children, showAddButton, onAddEffect }: PanelSectionProps) {
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const handleAddClick = () => {
    if (addButtonRef.current && onAddEffect) {
      onAddEffect(addButtonRef.current);
    }
  };

  return (
    <div className="ui-section">
      <div className="ui-section-title-row">
        <h3 className="ui-section-title">{title}</h3>
        {showAddButton && onAddEffect && (
          <button
            ref={addButtonRef}
            type="button"
            className="ui-section-add-button"
            onClick={handleAddClick}
            aria-label="Add effect"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

