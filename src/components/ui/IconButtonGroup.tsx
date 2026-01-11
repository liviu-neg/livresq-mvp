import React from 'react';

interface IconButton {
  value: string;
  icon: React.ReactNode;
  label: string;
}

interface IconButtonGroupProps {
  buttons: IconButton[];
  activeValue?: string;
  onButtonClick: (value: string) => void;
}

export function IconButtonGroup({ buttons, activeValue, onButtonClick }: IconButtonGroupProps) {
  return (
    <div className="ui-icon-button-group">
      {buttons.map((button) => (
        <button
          key={button.value}
          type="button"
          className={`ui-icon-button ${activeValue === button.value ? 'active' : ''}`}
          onClick={() => onButtonClick(button.value)}
          aria-label={button.label}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
}

