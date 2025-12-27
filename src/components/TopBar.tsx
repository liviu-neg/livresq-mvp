import { useThemeSwitcher } from '../theme/ThemeProvider';

interface TopBarProps {
  isPreview: boolean;
  onTogglePreview: () => void;
}

export function TopBar({ isPreview, onTogglePreview }: TopBarProps) {
  const { themeId, setThemeId } = useThemeSwitcher();

  return (
    <div className="top-bar">
      <h1 className="top-bar-title">Lesson Builder</h1>
      <div className="top-bar-actions">
        <div className="theme-toggle">
          <button
            type="button"
            className={`theme-option ${themeId === 'plain' ? 'active' : ''}`}
            onClick={() => setThemeId('plain')}
            aria-label="Plain theme"
          >
            Plain
          </button>
          <button
            type="button"
            className={`theme-option ${themeId === 'neon' ? 'active' : ''}`}
            onClick={() => setThemeId('neon')}
            aria-label="Neon theme"
          >
            Neon
          </button>
        </div>
        <button
          className="preview-toggle"
          onClick={onTogglePreview}
          aria-label={isPreview ? 'Switch to Edit mode' : 'Switch to Preview mode'}
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
    </div>
  );
}
