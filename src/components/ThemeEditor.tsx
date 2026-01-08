import { useState, useEffect } from 'react';
import { useTheme, useThemeSwitcher } from '../theme/ThemeProvider';
import type { Theme } from '../theme/tokens';
import { plainTheme, neonTheme } from '../theme/tokens';

// Palette icon for theme editor button
const PaletteIcon = () => (
  <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="palette" className="svg-inline--fa fa-palette" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18">
    <path fill="currentColor" d="M464 258.2c0 2.7-1 5.2-4.2 8c-3.8 3.1-10.1 5.8-17.8 5.8H344c-53 0-96 43-96 96c0 6.8 .7 13.4 2.1 19.8c3.3 15.7 10.2 31.1 14.4 40.6l0 0c.7 1.6 1.4 3 1.9 4.3c5 11.5 5.6 15.4 5.6 17.1c0 5.3-1.9 9.5-3.8 11.8c-.9 1.1-1.6 1.6-2 1.8c-.3 .2-.8 .3-1.6 .4c-2.9 .1-5.7 .2-8.6 .2C141.1 464 48 370.9 48 256S141.1 48 256 48s208 93.1 208 208c0 .7 0 1.4 0 2.2zm48 .5c0-.9 0-1.8 0-2.7C512 114.6 397.4 0 256 0S0 114.6 0 256S114.6 512 256 512c3.5 0 7.1-.1 10.6-.2c31.8-1.3 53.4-30.1 53.4-62c0-14.5-6.1-28.3-12.1-42c-4.3-9.8-8.7-19.7-10.8-29.9c-.7-3.2-1-6.5-1-9.9c0-26.5 21.5-48 48-48h97.9c36.5 0 69.7-24.8 70.1-61.3zM160 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm128-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm64 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"></path>
  </svg>
);

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeUpdate: (themes: Record<string, Theme>) => void;
  customThemes: Record<string, Theme>;
}

type EditorStep = 'selection' | 'step1' | 'step2';

interface ThemeColorConfig {
  primaryColor: string; // For button block
  headingColor: string; // For header block
  paragraphColor: string; // For text block
  pageBackgroundColor: string;
  pageBackgroundColorOpacity?: number; // 0-1
  pageBackgroundImage?: string;
  pageBackgroundImageOpacity?: number; // 0-1
  rowBackgroundColor?: string;
  rowBackgroundColorOpacity?: number; // 0-1
  rowBackgroundImage?: string;
  rowBackgroundImageOpacity?: number; // 0-1
  cellBackgroundColor?: string; // Optional, default transparent
  cellBackgroundColorOpacity?: number; // 0-1
  cellBackgroundImage?: string; // Optional, default transparent
  cellBackgroundImageOpacity?: number; // 0-1
  resourceBackgroundColor?: string; // Optional, default transparent
  resourceBackgroundColorOpacity?: number; // 0-1
  resourceBackgroundImage?: string; // Optional, default transparent
  resourceBackgroundImageOpacity?: number; // 0-1
}

// Helper function to convert hex color to rgba with opacity
function hexToRgba(hex: string, opacity: number = 1): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function ThemeEditor({ isOpen, onClose, onThemeUpdate, customThemes }: ThemeEditorProps) {
  const [step, setStep] = useState<EditorStep>('selection');
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [isNewTheme, setIsNewTheme] = useState(false);
  const [themeName, setThemeName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [colorConfig, setColorConfig] = useState<ThemeColorConfig>({
    primaryColor: '#326CF6',
    headingColor: '#000000',
    paragraphColor: '#272525',
    pageBackgroundColor: '#ffffff',
    pageBackgroundColorOpacity: 1,
    pageBackgroundImage: undefined,
    pageBackgroundImageOpacity: 1,
    rowBackgroundColor: '#ffffff',
    rowBackgroundColorOpacity: 1,
    rowBackgroundImage: undefined,
    rowBackgroundImageOpacity: 1,
    cellBackgroundColor: undefined,
    cellBackgroundColorOpacity: 1,
    cellBackgroundImage: undefined,
    cellBackgroundImageOpacity: 1,
    resourceBackgroundColor: undefined,
    resourceBackgroundColorOpacity: 1,
    resourceBackgroundImage: undefined,
    resourceBackgroundImageOpacity: 1,
  });

  // Load theme data when editing
  useEffect(() => {
    if (editingThemeId && step === 'step1') {
      // Check if custom theme exists first (for 'plain' and 'neon', custom versions override built-in)
      let theme: Theme | undefined;
      if (editingThemeId === 'plain' || editingThemeId === 'neon') {
        // Use custom version if it exists, otherwise fall back to built-in
        theme = customThemes[editingThemeId] || (editingThemeId === 'plain' ? plainTheme : neonTheme);
      } else {
        // For other themes, use custom theme
        theme = customThemes[editingThemeId];
      }
      
      if (theme) {
        setColorConfig({
          primaryColor: theme.colors.accent || '#326CF6',
          headingColor: theme.colors.text || '#000000',
          paragraphColor: theme.colors.mutedText || '#272525',
          pageBackgroundColor: theme.pageBackground?.backgroundColor || '#ffffff',
          pageBackgroundColorOpacity: theme.pageBackground?.backgroundColorOpacity ?? 1,
          pageBackgroundImage: theme.pageBackground?.backgroundImage,
          pageBackgroundImageOpacity: theme.pageBackground?.backgroundImageOpacity ?? 1,
          rowBackgroundColor: theme.rowBackground?.backgroundColor,
          rowBackgroundColorOpacity: theme.rowBackground?.backgroundColorOpacity ?? 1,
          rowBackgroundImage: theme.rowBackground?.backgroundImage,
          rowBackgroundImageOpacity: theme.rowBackground?.backgroundImageOpacity ?? 1,
          cellBackgroundColor: theme.cellBackground?.backgroundColor,
          cellBackgroundColorOpacity: theme.cellBackground?.backgroundColorOpacity ?? 1,
          cellBackgroundImage: theme.cellBackground?.backgroundImage,
          cellBackgroundImageOpacity: theme.cellBackground?.backgroundImageOpacity ?? 1,
          resourceBackgroundColor: theme.resourceBackground?.backgroundColor,
          resourceBackgroundColorOpacity: theme.resourceBackground?.backgroundColorOpacity ?? 1,
          resourceBackgroundImage: theme.resourceBackground?.backgroundImage,
          resourceBackgroundImageOpacity: theme.resourceBackground?.backgroundImageOpacity ?? 1,
        });
        if (!isNewTheme) {
          setThemeName(theme.name || editingThemeId);
        }
      }
    }
  }, [editingThemeId, step, isNewTheme, customThemes]);

  if (!isOpen) return null;

  const handleStartNewTheme = () => {
    setIsNewTheme(true);
    setEditingThemeId(null);
    setThemeName('');
    setColorConfig({
      primaryColor: '#326CF6',
      headingColor: '#000000',
      paragraphColor: '#272525',
      pageBackgroundColor: '#ffffff',
      rowBackgroundColor: '#ffffff',
    });
    setStep('step1');
  };

  const handleEditTheme = (themeId: string) => {
    setIsNewTheme(false);
    setEditingThemeId(themeId);
    setStep('step1');
  };

  const handleSaveTheme = () => {
    // If editing Plain or Neon, show save dialog first
    if ((editingThemeId === 'plain' || editingThemeId === 'neon') && !showSaveDialog) {
      setShowSaveDialog(true);
      setNewThemeName('');
      return;
    }

    // If showing save dialog and saving as new, require name
    if (showSaveDialog && saveAsNew && !newThemeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    if (isNewTheme && !themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }
    // Validate theme name for existing themes (should not be empty when renaming)
    if (!isNewTheme && editingThemeId && !themeName.trim()) {
      alert('Theme name cannot be empty');
      return;
    }

    // Determine final theme name and ID
    let finalThemeName: string;
    let finalThemeId: string;

    if (showSaveDialog && saveAsNew) {
      // Save as new theme with custom name
      let baseName = newThemeName.trim();
      const baseThemeName = editingThemeId === 'plain' ? 'Plain' : 'Neon';
      
      // If user enters the same name as the base theme or empty, add suffix
      if (baseName.toLowerCase() === baseThemeName.toLowerCase() || baseName === '') {
        baseName = baseThemeName;
        // Find existing themes with similar names and add suffix
        let counter = 1;
        let testName = `${baseName}-${counter}`;
        while (Object.values(customThemes).some(theme => theme.name === testName)) {
          counter++;
          testName = `${baseName}-${counter}`;
        }
        finalThemeName = testName;
      } else {
        // Check if a theme with this exact name already exists
        // If it does, add a suffix
        if (Object.values(customThemes).some(theme => theme.name === baseName)) {
          let counter = 1;
          let testName = `${baseName}-${counter}`;
          while (Object.values(customThemes).some(theme => theme.name === testName)) {
            counter++;
            testName = `${baseName}-${counter}`;
          }
          finalThemeName = testName;
        } else {
          finalThemeName = baseName;
        }
      }
      
      finalThemeId = finalThemeName.toLowerCase().replace(/\s+/g, '-');
      // Ensure ID uniqueness (check both exact ID and if name-based ID exists)
      let counter = 1;
      let uniqueId = finalThemeId;
      while (customThemes[uniqueId]) {
        uniqueId = `${finalThemeId}-${counter}`;
        counter++;
      }
      finalThemeId = uniqueId;
    } else if (showSaveDialog && !saveAsNew) {
      // Update existing theme (save as custom with same name/ID)
      finalThemeName = editingThemeId === 'plain' ? 'Plain' : 'Neon';
      finalThemeId = editingThemeId; // Use 'plain' or 'neon' as the ID
    } else if (isNewTheme) {
      // New theme
      finalThemeName = themeName.trim();
      finalThemeId = finalThemeName.toLowerCase().replace(/\s+/g, '-');
      let counter = 1;
      let uniqueId = finalThemeId;
      while (customThemes[uniqueId]) {
        uniqueId = `${finalThemeId}-${counter}`;
        counter++;
      }
      finalThemeId = uniqueId;
    } else {
      // Editing existing custom theme - use the themeName from state (allows renaming)
      finalThemeName = themeName.trim() || customThemes[editingThemeId!]?.name || 'Custom Theme';
      finalThemeId = editingThemeId!;
    }

    // Convert colorConfig to Theme structure
    const newTheme: Theme = {
      name: finalThemeName,
      colors: {
        // bg and surface should NOT be set from rowBackgroundColor - they affect resources/blocks
        // Use page background color instead, or keep default white/transparent
        bg: colorConfig.pageBackgroundColor,
        surface: colorConfig.pageBackgroundColor,
        text: colorConfig.headingColor,
        mutedText: colorConfig.paragraphColor,
        border: '#e0e0e0', // Default border color
        focusRing: colorConfig.primaryColor,
        accent: colorConfig.primaryColor,
      },
      typography: plainTheme.typography, // Use default typography for now
      spacing: plainTheme.spacing, // Use default spacing for now
      radius: plainTheme.radius, // Use default radius for now
      shadow: plainTheme.shadow, // Use default shadow for now
      cellPadding: plainTheme.cellPadding, // Use default cell padding for now
      cellBackground: {
        backgroundColor: colorConfig.cellBackgroundColor,
        backgroundColorOpacity: colorConfig.cellBackgroundColor ? (colorConfig.cellBackgroundColorOpacity ?? 1) : undefined,
        backgroundImage: colorConfig.cellBackgroundImage,
        backgroundImageOpacity: colorConfig.cellBackgroundImage ? (colorConfig.cellBackgroundImageOpacity ?? 1) : undefined,
      },
      rowPadding: plainTheme.rowPadding, // Use default row padding for now
      rowBackground: {
        backgroundColor: colorConfig.rowBackgroundColor,
        backgroundColorOpacity: colorConfig.rowBackgroundColorOpacity ?? 1,
        backgroundImage: colorConfig.rowBackgroundImage,
        backgroundImageOpacity: colorConfig.rowBackgroundImage ? (colorConfig.rowBackgroundImageOpacity ?? 1) : undefined,
      },
      cellBorder: plainTheme.cellBorder, // Use default cell border for now
      cellBorderRadius: plainTheme.cellBorderRadius, // Use default cell border radius for now
      rowBorder: plainTheme.rowBorder, // Use default row border for now
      rowBorderRadius: plainTheme.rowBorderRadius, // Use default row border radius for now
      pageBackground: {
        backgroundColor: colorConfig.pageBackgroundColor,
        backgroundColorOpacity: colorConfig.pageBackgroundColorOpacity ?? 1,
        backgroundImage: colorConfig.pageBackgroundImage,
        backgroundImageOpacity: colorConfig.pageBackgroundImage ? (colorConfig.pageBackgroundImageOpacity ?? 1) : undefined,
      },
      resourceBackground: {
        backgroundColor: colorConfig.resourceBackgroundColor,
        backgroundColorOpacity: colorConfig.resourceBackgroundColor ? (colorConfig.resourceBackgroundColorOpacity ?? 1) : undefined,
        backgroundImage: colorConfig.resourceBackgroundImage,
        backgroundImageOpacity: colorConfig.resourceBackgroundImage ? (colorConfig.resourceBackgroundImageOpacity ?? 1) : undefined,
      },
    };

    // Update custom themes
    const updatedThemes = {
      ...customThemes,
      [finalThemeId]: newTheme,
    };

    // Save themes
    onThemeUpdate(updatedThemes);

    // Reset state and close
    setStep('selection');
    setEditingThemeId(null);
    setIsNewTheme(false);
    setThemeName('');
    setShowSaveDialog(false);
    setSaveAsNew(false);
    setNewThemeName('');
    onClose();
  };

  const handleSaveDialogChoice = (asNew: boolean) => {
    setSaveAsNew(asNew);
    if (asNew) {
      // Wait for user to enter name, then save
      // The save button will be clicked again after name is entered
    } else {
      // Update existing theme - proceed with save
      handleSaveTheme();
    }
  };

  // Theme selection screen
  if (step === 'selection') {
    return (
      <div className="theme-editor-overlay" onClick={onClose}>
        <div className="theme-editor-container" onClick={(e) => e.stopPropagation()}>
          <div className="theme-editor-header">
            <button className="theme-editor-exit" onClick={onClose}>
              ← Exit
            </button>
            <div className="theme-editor-title">
              <PaletteIcon />
              <h2>Colors</h2>
            </div>
            <div></div>
          </div>
          <div className="theme-editor-content">
            <p className="theme-editor-subtitle">Choose your theme and background colors.</p>
            <div className="theme-preview-grid">
              {/* Plain Theme Preview - Show built-in only if no custom version exists */}
              {!customThemes['plain'] && (
                <div className="theme-preview-card" onClick={() => handleEditTheme('plain')}>
                  <div className="theme-preview-visual" style={{ backgroundColor: '#f5f5f5' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '8px', margin: '4px', borderRadius: '4px' }}>
                      <div style={{ height: '2px', backgroundColor: '#1a1a1a', marginBottom: '4px' }}></div>
                      <div style={{ height: '2px', backgroundColor: '#666666', marginBottom: '4px' }}></div>
                      <div style={{ width: '60%', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                  <div className="theme-preview-info">
                    <span>Plain</span>
                    <button className="theme-edit-button">Edit</button>
                  </div>
                </div>
              )}

              {/* Neon Theme Preview - Show built-in only if no custom version exists */}
              {!customThemes['neon'] && (
                <div className="theme-preview-card" onClick={() => handleEditTheme('neon')}>
                  <div className="theme-preview-visual" style={{ backgroundColor: '#0f0f1e' }}>
                    <div style={{ backgroundColor: '#1a1a2e', padding: '8px', margin: '4px', borderRadius: '4px' }}>
                      <div style={{ height: '2px', backgroundColor: '#ffffff', marginBottom: '4px' }}></div>
                      <div style={{ height: '2px', backgroundColor: '#a0a0b8', marginBottom: '4px' }}></div>
                      <div style={{ width: '60%', height: '8px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                  <div className="theme-preview-info">
                    <span>Neon</span>
                    <button className="theme-edit-button">Edit</button>
                  </div>
                </div>
              )}

              {/* Custom Themes - Show ALL custom themes, including those that override 'plain' and 'neon' */}
              {Object.entries(customThemes)
                .sort(([idA, themeA], [idB, themeB]) => {
                  // Sort by name for better organization
                  return themeA.name.localeCompare(themeB.name);
                })
                .map(([id, theme]) => (
                  <div key={id} className="theme-preview-card" onClick={() => handleEditTheme(id)}>
                    <div className="theme-preview-visual" style={{ backgroundColor: theme.pageBackground?.backgroundColor || '#ffffff' }}>
                      <div style={{ backgroundColor: theme.rowBackground?.backgroundColor || '#ffffff', padding: '8px', margin: '4px', borderRadius: '4px' }}>
                        <div style={{ height: '2px', backgroundColor: theme.colors.text || '#000000', marginBottom: '4px' }}></div>
                        <div style={{ height: '2px', backgroundColor: theme.colors.mutedText || '#666666', marginBottom: '4px' }}></div>
                        <div style={{ width: '60%', height: '8px', backgroundColor: theme.colors.accent || '#326CF6', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                    <div className="theme-preview-info">
                      <span>{theme.name}</span>
                      <button className="theme-edit-button">Edit</button>
                    </div>
                  </div>
                ))}

              {/* Create New Theme */}
              <div className="theme-preview-card theme-preview-card-new" onClick={handleStartNewTheme}>
                <div className="theme-preview-visual" style={{ backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '24px' }}>+</span>
                </div>
                <div className="theme-preview-info">
                  <span>Create new theme</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Save Dialog for Plain/Neon themes
  if (showSaveDialog && !saveAsNew) {
    return (
      <div className="theme-editor-overlay" onClick={() => { setShowSaveDialog(false); setSaveAsNew(false); }}>
        <div className="theme-save-dialog" onClick={(e) => e.stopPropagation()}>
          <h3>Save Theme</h3>
          <p>How would you like to save your changes to {editingThemeId === 'plain' ? 'Plain' : 'Neon'}?</p>
          <div className="theme-save-dialog-actions">
            <button
              className="theme-save-dialog-button theme-save-dialog-button-secondary"
              onClick={() => {
                setShowSaveDialog(false);
                setSaveAsNew(false);
              }}
            >
              Cancel
            </button>
            <button
              className="theme-save-dialog-button theme-save-dialog-button-primary"
              onClick={() => handleSaveDialogChoice(true)}
            >
              Save as new theme
            </button>
            <button
              className="theme-save-dialog-button theme-save-dialog-button-primary"
              onClick={() => handleSaveDialogChoice(false)}
            >
              Update {editingThemeId === 'plain' ? 'Plain' : 'Neon'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Theme Color Configuration
  if (step === 'step1') {
    return (
      <div className="theme-editor-overlay" onClick={onClose}>
        {/* Save Dialog overlay (if showing) */}
        {showSaveDialog && !saveAsNew && (
          <div className="theme-save-dialog-overlay" onClick={(e) => { e.stopPropagation(); setShowSaveDialog(false); setSaveAsNew(false); }}>
            <div className="theme-save-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Save Theme</h3>
              <p>How would you like to save your changes to {editingThemeId === 'plain' ? 'Plain' : 'Neon'}?</p>
              <div className="theme-save-dialog-actions">
                <button
                  className="theme-save-dialog-button theme-save-dialog-button-secondary"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveAsNew(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="theme-save-dialog-button theme-save-dialog-button-primary"
                  onClick={() => {
                    setSaveAsNew(true);
                    setShowSaveDialog(false);
                    // Name input will show in the config panel
                  }}
                >
                  Save as new theme
                </button>
                <button
                  className="theme-save-dialog-button theme-save-dialog-button-primary"
                  onClick={() => handleSaveDialogChoice(false)}
                >
                  Update {editingThemeId === 'plain' ? 'Plain' : 'Neon'}
                </button>
              </div>
            </div>
          </div>
        )}
          <div className="theme-editor-container theme-editor-step1" onClick={(e) => e.stopPropagation()}>
            <div className="theme-editor-header" style={{ gridColumn: '1 / -1' }}>
              <button className="theme-editor-exit" onClick={() => {
                setStep('selection');
                setShowSaveDialog(false);
                setSaveAsNew(false);
                setNewThemeName('');
              }}>
                ← Back
              </button>
              <div className="theme-editor-title">
                <PaletteIcon />
                <h2>Colors</h2>
              </div>
              <div></div>
            </div>
          <div className="theme-editor-step-content" style={{ gridColumn: '1' }}>
            <div className="theme-editor-config-panel">
              <h3>Theme Color</h3>
              
              {/* Theme Palette - Primary Color */}
              <div className="theme-config-section">
                <div className="theme-config-section-header">
                  <label>Theme palette</label>
                  <span className="theme-config-info">ℹ️</span>
                </div>
                <div className="theme-config-group">
                  <label>Primary color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={colorConfig.primaryColor}
                      onChange={(e) => setColorConfig({ ...colorConfig, primaryColor: e.target.value })}
                      className="theme-color-input"
                    />
                    <input
                      type="text"
                      value={colorConfig.primaryColor}
                      onChange={(e) => setColorConfig({ ...colorConfig, primaryColor: e.target.value })}
                      className="theme-color-text-input"
                    />
                  </div>
                </div>
              </div>

              {/* Font Color */}
              <div className="theme-config-section">
                <div className="theme-config-section-header">
                  <label>Font color</label>
                </div>
                <div className="theme-config-group">
                  <label>Heading</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={colorConfig.headingColor}
                      onChange={(e) => setColorConfig({ ...colorConfig, headingColor: e.target.value })}
                      className="theme-color-input"
                    />
                    <input
                      type="text"
                      value={colorConfig.headingColor}
                      onChange={(e) => setColorConfig({ ...colorConfig, headingColor: e.target.value })}
                      className="theme-color-text-input"
                    />
                  </div>
                </div>
                <div className="theme-config-group">
                  <label>Paragraph</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={colorConfig.paragraphColor}
                      onChange={(e) => setColorConfig({ ...colorConfig, paragraphColor: e.target.value })}
                      className="theme-color-input"
                    />
                    <input
                      type="text"
                      value={colorConfig.paragraphColor}
                      onChange={(e) => setColorConfig({ ...colorConfig, paragraphColor: e.target.value })}
                      className="theme-color-text-input"
                    />
                  </div>
                </div>
              </div>

              {/* Page Background */}
              <div className="theme-config-section">
                <div className="theme-config-section-header">
                  <label>Page background</label>
                </div>
                <div className="theme-config-group">
                  <label>Background color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={colorConfig.pageBackgroundColor}
                      onChange={(e) => setColorConfig({ ...colorConfig, pageBackgroundColor: e.target.value })}
                      className="theme-color-input"
                    />
                    <input
                      type="text"
                      value={colorConfig.pageBackgroundColor}
                      onChange={(e) => setColorConfig({ ...colorConfig, pageBackgroundColor: e.target.value })}
                      className="theme-color-text-input"
                    />
                  </div>
                  <div className="opacity-input-wrapper" style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Opacity:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={colorConfig.pageBackgroundColorOpacity ?? 1}
                      onChange={(e) => setColorConfig({ ...colorConfig, pageBackgroundColorOpacity: parseFloat(e.target.value) })}
                      className="theme-opacity-slider"
                    />
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={colorConfig.pageBackgroundColorOpacity ?? 1}
                      onChange={(e) => setColorConfig({ ...colorConfig, pageBackgroundColorOpacity: parseFloat(e.target.value) || 1 })}
                      className="theme-opacity-input"
                    />
                  </div>
                </div>
                <div className="theme-config-group">
                  <label>Background image</label>
                  <input
                    type="text"
                    value={colorConfig.pageBackgroundImage || ''}
                    onChange={(e) => setColorConfig({ ...colorConfig, pageBackgroundImage: e.target.value || undefined })}
                    className="theme-text-input"
                    placeholder="https://example.com/image.jpg"
                  />
                  {colorConfig.pageBackgroundImage && (
                    <div className="opacity-input-wrapper" style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Opacity:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.pageBackgroundImageOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, pageBackgroundImageOpacity: parseFloat(e.target.value) })}
                        className="theme-opacity-slider"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.pageBackgroundImageOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, pageBackgroundImageOpacity: parseFloat(e.target.value) || 1 })}
                        className="theme-opacity-input"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Card/Content/Section (Row) Background */}
              <div className="theme-config-section">
                <div className="theme-config-section-header">
                  <label>Card/Content/Section</label>
                </div>
                <div className="theme-config-group">
                  <label>Background color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={colorConfig.rowBackgroundColor || '#ffffff'}
                      onChange={(e) => setColorConfig({ ...colorConfig, rowBackgroundColor: e.target.value })}
                      className="theme-color-input"
                      disabled={!colorConfig.rowBackgroundColor}
                    />
                    <input
                      type="text"
                      value={colorConfig.rowBackgroundColor || ''}
                      onChange={(e) => setColorConfig({ ...colorConfig, rowBackgroundColor: e.target.value || undefined })}
                      className="theme-color-text-input"
                      placeholder="Transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setColorConfig({ ...colorConfig, rowBackgroundColor: undefined })}
                      className="transparent-button"
                      title="Set to transparent"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        background: !colorConfig.rowBackgroundColor ? '#f0f0f0' : 'transparent',
                        color: !colorConfig.rowBackgroundColor ? '#666' : '#333',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {colorConfig.rowBackgroundColor ? 'Set transparent' : 'Transparent'}
                    </button>
                  </div>
                  <div className="opacity-input-wrapper" style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Opacity:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={colorConfig.rowBackgroundColorOpacity ?? 1}
                      onChange={(e) => setColorConfig({ ...colorConfig, rowBackgroundColorOpacity: parseFloat(e.target.value) })}
                      className="theme-opacity-slider"
                    />
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={colorConfig.rowBackgroundColorOpacity ?? 1}
                      onChange={(e) => setColorConfig({ ...colorConfig, rowBackgroundColorOpacity: parseFloat(e.target.value) || 1 })}
                      className="theme-opacity-input"
                    />
                  </div>
                </div>
                <div className="theme-config-group">
                  <label>Background image</label>
                  <input
                    type="text"
                    value={colorConfig.rowBackgroundImage || ''}
                    onChange={(e) => setColorConfig({ ...colorConfig, rowBackgroundImage: e.target.value || undefined })}
                    className="theme-text-input"
                    placeholder="https://example.com/image.jpg"
                  />
                  {colorConfig.rowBackgroundImage && (
                    <div className="opacity-input-wrapper" style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Opacity:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.rowBackgroundImageOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, rowBackgroundImageOpacity: parseFloat(e.target.value) })}
                        className="theme-opacity-slider"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.rowBackgroundImageOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, rowBackgroundImageOpacity: parseFloat(e.target.value) || 1 })}
                        className="theme-opacity-input"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Cells and Resources (Optional) */}
              <div className="theme-config-section">
                <div className="theme-config-section-header">
                  <label>Cells and Resources (Optional)</label>
                  <span className="theme-config-note">Default: transparent</span>
                </div>
                <div className="theme-config-group">
                  <label>Cell background color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={colorConfig.cellBackgroundColor || '#ffffff'}
                      onChange={(e) => setColorConfig({ ...colorConfig, cellBackgroundColor: e.target.value || undefined })}
                      className="theme-color-input"
                      disabled={!colorConfig.cellBackgroundColor}
                    />
                    <input
                      type="text"
                      value={colorConfig.cellBackgroundColor || ''}
                      onChange={(e) => setColorConfig({ ...colorConfig, cellBackgroundColor: e.target.value || undefined })}
                      className="theme-color-text-input"
                      placeholder="Transparent (default)"
                    />
                    <button
                      type="button"
                      onClick={() => setColorConfig({ ...colorConfig, cellBackgroundColor: undefined })}
                      className="transparent-button"
                      title="Set to transparent"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        background: !colorConfig.cellBackgroundColor ? '#f0f0f0' : 'transparent',
                        color: !colorConfig.cellBackgroundColor ? '#666' : '#333',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {colorConfig.cellBackgroundColor ? 'Set transparent' : 'Transparent'}
                    </button>
                  </div>
                  {colorConfig.cellBackgroundColor && (
                    <div className="opacity-input-wrapper" style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Opacity:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.cellBackgroundColorOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, cellBackgroundColorOpacity: parseFloat(e.target.value) })}
                        className="theme-opacity-slider"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.cellBackgroundColorOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, cellBackgroundColorOpacity: parseFloat(e.target.value) || 1 })}
                        className="theme-opacity-input"
                      />
                    </div>
                  )}
                </div>
                <div className="theme-config-group">
                  <label>Cell background image</label>
                  <input
                    type="text"
                    value={colorConfig.cellBackgroundImage || ''}
                    onChange={(e) => setColorConfig({ ...colorConfig, cellBackgroundImage: e.target.value || undefined })}
                    className="theme-text-input"
                    placeholder="https://example.com/image.jpg"
                  />
                  {colorConfig.cellBackgroundImage && (
                    <div className="opacity-input-wrapper" style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Opacity:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.cellBackgroundImageOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, cellBackgroundImageOpacity: parseFloat(e.target.value) })}
                        className="theme-opacity-slider"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.cellBackgroundImageOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, cellBackgroundImageOpacity: parseFloat(e.target.value) || 1 })}
                        className="theme-opacity-input"
                      />
                    </div>
                  )}
                </div>
                <div className="theme-config-group">
                  <label>Resource background color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={colorConfig.resourceBackgroundColor || '#ffffff'}
                      onChange={(e) => setColorConfig({ ...colorConfig, resourceBackgroundColor: e.target.value || undefined })}
                      className="theme-color-input"
                      disabled={!colorConfig.resourceBackgroundColor}
                    />
                    <input
                      type="text"
                      value={colorConfig.resourceBackgroundColor || ''}
                      onChange={(e) => setColorConfig({ ...colorConfig, resourceBackgroundColor: e.target.value || undefined })}
                      className="theme-color-text-input"
                      placeholder="Transparent (default)"
                    />
                    <button
                      type="button"
                      onClick={() => setColorConfig({ ...colorConfig, resourceBackgroundColor: undefined })}
                      className="transparent-button"
                      title="Set to transparent"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        background: !colorConfig.resourceBackgroundColor ? '#f0f0f0' : 'transparent',
                        color: !colorConfig.resourceBackgroundColor ? '#666' : '#333',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {colorConfig.resourceBackgroundColor ? 'Set transparent' : 'Transparent'}
                    </button>
                  </div>
                  {colorConfig.resourceBackgroundColor && (
                    <div className="opacity-input-wrapper" style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Opacity:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.resourceBackgroundColorOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, resourceBackgroundColorOpacity: parseFloat(e.target.value) })}
                        className="theme-opacity-slider"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.resourceBackgroundColorOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, resourceBackgroundColorOpacity: parseFloat(e.target.value) || 1 })}
                        className="theme-opacity-input"
                      />
                    </div>
                  )}
                </div>
                <div className="theme-config-group">
                  <label>Resource background image</label>
                  <input
                    type="text"
                    value={colorConfig.resourceBackgroundImage || ''}
                    onChange={(e) => setColorConfig({ ...colorConfig, resourceBackgroundImage: e.target.value || undefined })}
                    className="theme-text-input"
                    placeholder="https://example.com/image.jpg"
                  />
                  {colorConfig.resourceBackgroundImage && (
                    <div className="opacity-input-wrapper" style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Opacity:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.resourceBackgroundImageOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, resourceBackgroundImageOpacity: parseFloat(e.target.value) })}
                        className="theme-opacity-slider"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={colorConfig.resourceBackgroundImageOpacity ?? 1}
                        onChange={(e) => setColorConfig({ ...colorConfig, resourceBackgroundImageOpacity: parseFloat(e.target.value) || 1 })}
                        className="theme-opacity-input"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Name (for new themes and editing existing themes) */}
              <div className="theme-config-section">
                <div className="theme-config-group">
                  <label>Theme name</label>
                  <input
                    type="text"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    className="theme-text-input"
                    placeholder={isNewTheme ? "Enter theme name" : "Theme name"}
                    required={isNewTheme}
                  />
                </div>
              </div>

              {/* Theme Name (when saving Plain/Neon as new) */}
              {showSaveDialog && saveAsNew && (
                <div className="theme-config-section">
                  <div className="theme-config-group">
                    <label>Theme name</label>
                    <input
                      type="text"
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      className="theme-text-input"
                      placeholder="Enter theme name"
                      required
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <div className="theme-editor-actions">
                <button className="theme-editor-button-primary" onClick={handleSaveTheme}>
                  {showSaveDialog && saveAsNew ? 'Create Theme' : isNewTheme ? 'Create Theme' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Right Side Preview */}
            <div className="theme-editor-preview" style={{ gridColumn: '2' }}>
              <div className="theme-preview-header">
                <div className="theme-preview-tabs">
                  <button className="theme-preview-tab active">Test page</button>
                  <button className="theme-preview-tab">Current page</button>
                </div>
                <button className="theme-preview-close" onClick={onClose}>×</button>
              </div>
              <div 
                className="theme-preview-content" 
                style={{ 
                  backgroundColor: hexToRgba(colorConfig.pageBackgroundColor, colorConfig.pageBackgroundColorOpacity ?? 1),
                  position: 'relative',
                }}
              >
                {colorConfig.pageBackgroundImage && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${colorConfig.pageBackgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: colorConfig.pageBackgroundImageOpacity ?? 1,
                      zIndex: 0,
                    }}
                  />
                )}
                <div 
                  className="theme-preview-card-preview" 
                  style={{ 
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Row background color layer (base layer) - always render if color is set */}
                  {colorConfig.rowBackgroundColor && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: hexToRgba(colorConfig.rowBackgroundColor, colorConfig.rowBackgroundColorOpacity ?? 1),
                        zIndex: 0,
                        borderRadius: '8px',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  {/* Row background image layer (above color) */}
                  {colorConfig.rowBackgroundImage && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${colorConfig.rowBackgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: colorConfig.rowBackgroundImageOpacity ?? 1,
                        zIndex: 1,
                        borderRadius: '8px',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  {/* Row cells container - simulates .row-cells with padding */}
                  <div 
                    style={{ 
                      position: 'relative', 
                      zIndex: 2,
                      padding: '12px', // Reduced padding between row and cell
                    }}
                  >
                    {/* Cell view container - simulates .cell-view */}
                    <div style={{ position: 'relative' }}>
                      {/* Cell background color layer (if cell background is set) */}
                      {colorConfig.cellBackgroundColor && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: hexToRgba(colorConfig.cellBackgroundColor, colorConfig.cellBackgroundColorOpacity ?? 1),
                            zIndex: 0,
                            borderRadius: '4px',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      {/* Cell background image layer */}
                      {colorConfig.cellBackgroundImage && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${colorConfig.cellBackgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: colorConfig.cellBackgroundImageOpacity ?? 1,
                            zIndex: 1,
                            borderRadius: '4px',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      {/* Cell resources container - simulates .cell-resources with padding */}
                      <div style={{ position: 'relative', zIndex: 2, padding: '16px' }}>
                    {/* Resource background for heading */}
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      {colorConfig.resourceBackgroundColor && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: hexToRgba(colorConfig.resourceBackgroundColor, colorConfig.resourceBackgroundColorOpacity ?? 1),
                            zIndex: 0,
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      {colorConfig.resourceBackgroundImage && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${colorConfig.resourceBackgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: colorConfig.resourceBackgroundImageOpacity ?? 1,
                            zIndex: 1,
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      <h3 style={{ color: colorConfig.headingColor, position: 'relative', zIndex: 2, padding: colorConfig.resourceBackgroundColor || colorConfig.resourceBackgroundImage ? '8px' : '0' }}>This is a theme preview.</h3>
                    </div>
                    {/* Resource background for paragraph */}
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                      {colorConfig.resourceBackgroundColor && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: hexToRgba(colorConfig.resourceBackgroundColor, colorConfig.resourceBackgroundColorOpacity ?? 1),
                            zIndex: 0,
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      {colorConfig.resourceBackgroundImage && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${colorConfig.resourceBackgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: colorConfig.resourceBackgroundImageOpacity ?? 1,
                            zIndex: 1,
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      <p style={{ color: colorConfig.paragraphColor, position: 'relative', zIndex: 2, padding: colorConfig.resourceBackgroundColor || colorConfig.resourceBackgroundImage ? '8px' : '0' }}>
                        Here's an example of body text. You can change its font and the color. Your accent color will be used for links. It will also be used for layouts and buttons.
                      </p>
                    </div>
                    {/* Resource background for button */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', position: 'relative' }}>
                      {colorConfig.resourceBackgroundColor && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: hexToRgba(colorConfig.resourceBackgroundColor, colorConfig.resourceBackgroundColorOpacity ?? 1),
                            zIndex: 0,
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      {colorConfig.resourceBackgroundImage && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${colorConfig.resourceBackgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: colorConfig.resourceBackgroundImageOpacity ?? 1,
                            zIndex: 1,
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      <button
                        style={{
                          backgroundColor: colorConfig.primaryColor,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        Primary button
                      </button>
                    </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

