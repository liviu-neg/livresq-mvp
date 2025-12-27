import { useThemeSwitcher } from '../theme/ThemeProvider';
import { ZoomDropdown } from './ZoomDropdown';

interface TopBarProps {
  isPreview: boolean;
  onTogglePreview: () => void;
  isPropertiesPanelVisible: boolean;
  onTogglePropertiesPanel: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function TopBar({ isPreview, onTogglePreview, isPropertiesPanelVisible, onTogglePropertiesPanel, zoom, onZoomChange }: TopBarProps) {
  const { themeId, setThemeId } = useThemeSwitcher();

  return (
    <div className="top-bar">
      <h1 className="top-bar-title">Lesson Builder</h1>
      <div className="top-bar-actions">
        <ZoomDropdown zoom={zoom} onZoomChange={onZoomChange} />
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
          className="properties-panel-toggle"
          onClick={onTogglePropertiesPanel}
          aria-label={isPropertiesPanelVisible ? 'Hide properties panel' : 'Show properties panel'}
          title={isPropertiesPanelVisible ? 'Hide properties panel' : 'Show properties panel'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            {isPropertiesPanelVisible ? (
              <path d="M11 3L6 8L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M5 3L10 8L5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
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
