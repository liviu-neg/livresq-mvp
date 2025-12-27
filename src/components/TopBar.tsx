import { useThemeSwitcher } from '../theme/ThemeProvider';
import { PanelRight, PanelRightClose } from 'lucide-react';

interface TopBarProps {
  isPreview: boolean;
  onTogglePreview: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
}

export function TopBar({ isPreview, onTogglePreview, isRightSidebarOpen, onToggleRightSidebar }: TopBarProps) {
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
