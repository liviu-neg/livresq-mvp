import { useThemeSwitcher } from '../theme/ThemeProvider';
import { PanelRight, PanelRightClose } from 'lucide-react';

interface TopBarProps {
  isPreview: boolean;
  onTogglePreview: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  showStructureStrokes: boolean;
  onToggleStructureStrokes: () => void;
}

// Grid/Layout icon SVG
const GridIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" style={{ width: '18px', height: '18px' }}>
    <path fill="currentColor" fillRule="evenodd" d="M19 2a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h14Zm-9 18h9a1 1 0 0 0 1-1v-9H10v10Zm-6-1a1 1 0 0 0 1 1h3V10H4v9ZM5 4a1 1 0 0 0-1 1v3h16V5a1 1 0 0 0-1-1H5Z" clipRule="evenodd"></path>
  </svg>
);

export function TopBar({ isPreview, onTogglePreview, isRightSidebarOpen, onToggleRightSidebar, showStructureStrokes, onToggleStructureStrokes }: TopBarProps) {
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
      </div>
    </div>
  );
}
