import { useThemeSwitcher } from '../theme/ThemeProvider';
import { PanelRight, PanelRightClose } from 'lucide-react';

interface TopBarProps {
  isPreview: boolean;
  onTogglePreview: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  showStructureStrokes: boolean;
  onToggleStructureStrokes: () => void;
  onOpenThemeEditor: () => void;
}

// Grid/Layout icon SVG
const GridIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" style={{ width: '18px', height: '18px' }}>
    <path fill="currentColor" fillRule="evenodd" d="M19 2a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h14Zm-9 18h9a1 1 0 0 0 1-1v-9H10v10Zm-6-1a1 1 0 0 0 1 1h3V10H4v9ZM5 4a1 1 0 0 0-1 1v3h16V5a1 1 0 0 0-1-1H5Z" clipRule="evenodd"></path>
  </svg>
);

// Palette icon for theme editor button
const PaletteIcon = () => (
  <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="palette" className="svg-inline--fa fa-palette" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18">
    <path fill="currentColor" d="M464 258.2c0 2.7-1 5.2-4.2 8c-3.8 3.1-10.1 5.8-17.8 5.8H344c-53 0-96 43-96 96c0 6.8 .7 13.4 2.1 19.8c3.3 15.7 10.2 31.1 14.4 40.6l0 0c.7 1.6 1.4 3 1.9 4.3c5 11.5 5.6 15.4 5.6 17.1c0 5.3-1.9 9.5-3.8 11.8c-.9 1.1-1.6 1.6-2 1.8c-.3 .2-.8 .3-1.6 .4c-2.9 .1-5.7 .2-8.6 .2C141.1 464 48 370.9 48 256S141.1 48 256 48s208 93.1 208 208c0 .7 0 1.4 0 2.2zm48 .5c0-.9 0-1.8 0-2.7C512 114.6 397.4 0 256 0S0 114.6 0 256S114.6 512 256 512c3.5 0 7.1-.1 10.6-.2c31.8-1.3 53.4-30.1 53.4-62c0-14.5-6.1-28.3-12.1-42c-4.3-9.8-8.7-19.7-10.8-29.9c-.7-3.2-1-6.5-1-9.9c0-26.5 21.5-48 48-48h97.9c36.5 0 69.7-24.8 70.1-61.3zM160 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm128-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm64 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"></path>
  </svg>
);

export function TopBar({ isPreview, onTogglePreview, isRightSidebarOpen, onToggleRightSidebar, showStructureStrokes, onToggleStructureStrokes, onOpenThemeEditor }: TopBarProps) {
  const { themeId, setThemeId, customThemes } = useThemeSwitcher();

  // Get all custom themes, excluding the preview theme and built-in overrides
  const displayThemes = Object.entries(customThemes || {})
    .filter(([id]) => {
      // Exclude preview theme and built-in theme IDs (plain/neon) if they're custom overrides
      return id !== '__preview__' && id !== 'plain' && id !== 'neon';
    })
    .filter(([id, theme]) => {
      // Ensure theme has required properties
      return theme && typeof theme === 'object' && theme.name;
    })
    .sort(([idA, themeA], [idB, themeB]) => {
      // Sort by name for consistency
      const nameA = themeA?.name || '';
      const nameB = themeB?.name || '';
      return nameA.localeCompare(nameB);
    });

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
          {displayThemes.map(([id, theme]) => (
            <button
              key={id}
              type="button"
              className={`theme-option ${themeId === id ? 'active' : ''}`}
              onClick={() => setThemeId(id)}
              aria-label={`${theme.name} theme`}
            >
              {theme.name}
            </button>
          ))}
        </div>
        <button
          className="preview-toggle"
          onClick={onTogglePreview}
          aria-label={isPreview ? 'Switch to Edit mode' : 'Switch to Preview mode'}
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
        <button
          type="button"
          className={`structure-strokes-toggle ${showStructureStrokes ? 'active' : ''}`}
          onClick={onToggleStructureStrokes}
          aria-label={showStructureStrokes ? 'Hide structure strokes' : 'Show structure strokes'}
          title={showStructureStrokes ? 'Hide structure strokes' : 'Show structure strokes'}
        >
          <GridIcon />
        </button>
        <button
          className="sidebar-toggle"
          onClick={onToggleRightSidebar}
          aria-label={isRightSidebarOpen ? 'Hide properties panel' : 'Show properties panel'}
          title={isRightSidebarOpen ? 'Hide Properties' : 'Show Properties'}
        >
          {isRightSidebarOpen ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
        </button>
        <button
          className="theme-editor-toggle"
          onClick={onOpenThemeEditor}
          aria-label="Open theme editor"
          title="Theme Editor"
        >
          <PaletteIcon />
        </button>
      </div>
    </div>
  );
}
