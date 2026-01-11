import React from 'react';
import { Popover } from '../Popover';

interface EffectsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  availableEffects: string[];
  onSelectEffect: (effect: string) => void;
}

export function EffectsMenu({
  isOpen,
  onClose,
  anchorElement,
  availableEffects,
  onSelectEffect,
}: EffectsMenuProps) {
  const handleSelectEffect = (effect: string) => {
    onSelectEffect(effect);
    onClose();
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      anchorElement={anchorElement}
      position="below"
      className="effects-menu-popover"
    >
      <div className="effects-menu-list">
        {availableEffects.map((effect) => (
          <button
            key={effect}
            type="button"
            className="effects-menu-item"
            onClick={() => handleSelectEffect(effect)}
          >
            {effect}
          </button>
        ))}
      </div>
    </Popover>
  );
}


