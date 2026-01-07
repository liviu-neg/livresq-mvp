import type { ButtonBlock } from '../types';
import { useTheme } from '../theme/ThemeProvider';

interface ButtonBlockViewProps {
  block: ButtonBlock;
  isSelected: boolean;
  isEditing?: boolean;
  isPreview: boolean;
  onUpdate: (updates: Partial<ButtonBlock>) => void;
}

// Arrow icon SVG component - using the provided arrow icon
const ArrowIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="16" height="16">
    <path fill="currentColor" d="M21.769 11.36v1.28l-5 6-1.538-1.28L18.865 13H3v-2h15.865l-3.634-4.36 1.538-1.28 5 6Z"></path>
  </svg>
);

export function ButtonBlockView({ block, isSelected, isEditing = false, isPreview, onUpdate }: ButtonBlockViewProps) {
  const theme = useTheme();
  // Use primary color from theme (theme-dependent), fallback to #326CF6
  const primaryColor = theme.colors.accent || '#326CF6';

  if (isPreview || !isEditing) {
    // Read-only view - actual button element
    return (
      <div className="block-view button-block-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <button
          className="button-block"
          type="button"
          style={{
            width: '400px',
            height: '60px',
            backgroundColor: primaryColor,
            borderRadius: '4px',
            border: 'none',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '0 16px',
            boxSizing: 'border-box',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Initially does nothing
          }}
        >
          <span>{block.label || 'Write a continuation'}</span>
          <ArrowIcon />
        </button>
      </div>
    );
  }

  // Inline editing view
  return (
    <div className="block-view button-block-view">
      <div className="button-edit-container">
        <label className="button-edit-label">Label</label>
        <input
          type="text"
          value={block.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="button-edit-input"
          placeholder="Write a continuation"
        />
      </div>
    </div>
  );
}

