import { useState, useEffect, useRef } from 'react';
import { useTheme, useThemeSwitcher } from '../theme/ThemeProvider';
import type { Theme } from '../theme/tokens';
import { plainTheme, neonTheme } from '../theme/tokens';
import type { ThemeSpecificRowProps, CuratedStyleId } from '../types';
import { curatedStyles } from '../styles/curatedStyles';
import { FillPopover } from './FillPopover';
import { BorderPopover } from './BorderPopover';
import { ShadowPopover, type Shadow } from './ShadowPopover';
import { ColorPickerPopover } from './ColorPickerPopover';
import { NumberPillInput } from './ui/NumberPillInput';
import { NumberSliderInput } from './ui/NumberSliderInput';
import { IconButtonGroup } from './ui/IconButtonGroup';
import { PillSelect } from './ui/PillSelect';

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
  
  // Step 2: Default Row Style
  const [defaultRowStyleType, setDefaultRowStyleType] = useState<'curated' | 'custom'>('curated');
  const [selectedCuratedStyle, setSelectedCuratedStyle] = useState<CuratedStyleId | null>(null);
  const [customStyleProperties, setCustomStyleProperties] = useState<Partial<ThemeSpecificRowProps>>({});

  // Load theme data when editing - only load when first opening or when editingThemeId changes
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
  }, [editingThemeId, isNewTheme, customThemes]); // Remove 'step' from dependencies to prevent resetting colorConfig when navigating steps

  // Load default row style for step2 - only when entering step2
  useEffect(() => {
    if (editingThemeId && step === 'step2') {
      // Check if custom theme exists first (for 'plain' and 'neon', custom versions override built-in)
      let theme: Theme | undefined;
      if (editingThemeId === 'plain' || editingThemeId === 'neon') {
        // Use custom version if it exists, otherwise fall back to built-in
        theme = customThemes[editingThemeId] || (editingThemeId === 'plain' ? plainTheme : neonTheme);
      } else {
        // For other themes, use custom theme
        theme = customThemes[editingThemeId];
      }
      
      // Load default row style for step2
      if (theme?.defaultRowStyle) {
        setDefaultRowStyleType(theme.defaultRowStyle.type);
        if (theme.defaultRowStyle.type === 'curated' && theme.defaultRowStyle.curatedId) {
          setSelectedCuratedStyle(theme.defaultRowStyle.curatedId as CuratedStyleId);
        } else if (theme.defaultRowStyle.type === 'custom' && theme.defaultRowStyle.customProperties) {
          setCustomStyleProperties(theme.defaultRowStyle.customProperties);
        }
      } else {
        // Reset to defaults if no default row style
        setDefaultRowStyleType('curated');
        setSelectedCuratedStyle(null);
        setCustomStyleProperties({});
      }
    }
  }, [editingThemeId, step, customThemes]);

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
      defaultRowStyle: (defaultRowStyleType === 'curated' && selectedCuratedStyle) || (defaultRowStyleType === 'custom' && Object.keys(customStyleProperties).length > 0)
        ? {
            type: defaultRowStyleType,
            curatedId: defaultRowStyleType === 'curated' ? selectedCuratedStyle || undefined : undefined,
            customProperties: defaultRowStyleType === 'custom' ? customStyleProperties : undefined,
          }
        : undefined,
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
                  <div 
                    className="theme-preview-visual" 
                    style={{ 
                      position: 'relative',
                      backgroundColor: hexToRgba(
                        plainTheme.pageBackground.backgroundColor || '#ffffff',
                        plainTheme.pageBackground.backgroundColorOpacity ?? 1
                      ),
                    }}
                  >
                    {/* Page background image layer */}
                    {plainTheme.pageBackground.backgroundImage && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: `url(${plainTheme.pageBackground.backgroundImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          opacity: plainTheme.pageBackground.backgroundImageOpacity ?? 1,
                          zIndex: 0,
                        }}
                      />
                    )}
                    <div style={{ 
                      position: 'relative',
                      zIndex: 1,
                      backgroundColor: hexToRgba(
                        plainTheme.rowBackground.backgroundColor || '#ffffff',
                        plainTheme.rowBackground.backgroundColorOpacity ?? 1
                      ),
                      padding: '8px',
                      margin: '4px',
                      borderRadius: '4px'
                    }}>
                      <div style={{ height: '2px', backgroundColor: plainTheme.colors.text || '#1a1a1a', marginBottom: '4px' }}></div>
                      <div style={{ height: '2px', backgroundColor: plainTheme.colors.mutedText || '#666666', marginBottom: '4px' }}></div>
                      <div style={{ width: '60%', height: '8px', backgroundColor: plainTheme.colors.accent || '#3b82f6', borderRadius: '2px' }}></div>
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
                  <div 
                    className="theme-preview-visual" 
                    style={{ 
                      position: 'relative',
                      backgroundColor: hexToRgba(
                        neonTheme.pageBackground.backgroundColor || '#000000',
                        neonTheme.pageBackground.backgroundColorOpacity ?? 1
                      ),
                    }}
                  >
                    {/* Page background image layer */}
                    {neonTheme.pageBackground.backgroundImage && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: `url(${neonTheme.pageBackground.backgroundImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          opacity: neonTheme.pageBackground.backgroundImageOpacity ?? 1,
                          zIndex: 0,
                        }}
                      />
                    )}
                    <div style={{ 
                      position: 'relative',
                      zIndex: 1,
                      backgroundColor: hexToRgba(
                        neonTheme.rowBackground.backgroundColor || '#1a1a2e',
                        neonTheme.rowBackground.backgroundColorOpacity ?? 1
                      ),
                      padding: '8px',
                      margin: '4px',
                      borderRadius: '4px'
                    }}>
                      <div style={{ height: '2px', backgroundColor: neonTheme.colors.text || '#ffffff', marginBottom: '4px' }}></div>
                      <div style={{ height: '2px', backgroundColor: neonTheme.colors.mutedText || '#a0a0b8', marginBottom: '4px' }}></div>
                      <div style={{ width: '60%', height: '8px', backgroundColor: neonTheme.colors.accent || '#8b5cf6', borderRadius: '2px' }}></div>
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
                    <div 
                      className="theme-preview-visual" 
                      style={{ 
                        position: 'relative',
                        backgroundColor: hexToRgba(
                          theme.pageBackground?.backgroundColor || '#ffffff',
                          theme.pageBackground?.backgroundColorOpacity ?? 1
                        ),
                      }}
                    >
                      {/* Page background image layer */}
                      {theme.pageBackground?.backgroundImage && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${theme.pageBackground.backgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            opacity: theme.pageBackground.backgroundImageOpacity ?? 1,
                            zIndex: 0,
                          }}
                        />
                      )}
                      <div style={{ 
                        position: 'relative',
                        zIndex: 1,
                        backgroundColor: hexToRgba(
                          theme.rowBackground?.backgroundColor || '#ffffff',
                          theme.rowBackground?.backgroundColorOpacity ?? 1
                        ),
                        padding: '8px',
                        margin: '4px',
                        borderRadius: '4px'
                      }}>
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
                <button 
                  className="theme-editor-button-secondary" 
                  onClick={() => setStep('step2')}
                >
                  Next: Design →
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

  // Step 2: Design (Default Row Style)
  if (step === 'step2') {
    const themeColors = {
      accent: colorConfig.primaryColor,
      surface: colorConfig.pageBackgroundColor,
      border: '#e0e0e0',
    };

    return (
      <div className="theme-editor-overlay" onClick={onClose}>
        <div className="theme-editor-container" onClick={(e) => e.stopPropagation()}>
          <div className="theme-editor-header">
            <button className="theme-editor-exit" onClick={onClose}>
              ← Exit
            </button>
            <div className="theme-editor-title">
              <PaletteIcon />
              <h2>Design</h2>
            </div>
          </div>

          <div className="theme-editor-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left Side: Configuration */}
            <div style={{ gridColumn: '1' }}>
              <div className="theme-config-section">
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Default Row Style</h3>
                
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #EAEAEA', marginBottom: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setDefaultRowStyleType('curated')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: defaultRowStyleType === 'curated' ? '2px solid #326CF6' : '2px solid transparent',
                      color: defaultRowStyleType === 'curated' ? '#111111' : '#6B6B6B',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    Curated
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultRowStyleType('custom')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: defaultRowStyleType === 'custom' ? '2px solid #326CF6' : '2px solid transparent',
                      color: defaultRowStyleType === 'custom' ? '#111111' : '#6B6B6B',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    Customize
                  </button>
                </div>

                {/* Curated Tab */}
                {defaultRowStyleType === 'curated' && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '16px' }}>
                      Select a curated style to use as the default for this theme.
                    </p>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '12px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}>
                      {curatedStyles.map((style) => {
                        const properties = style.getProperties(themeColors);
                        const isSelected = selectedCuratedStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setSelectedCuratedStyle(style.id as CuratedStyleId)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              padding: '12px',
                              border: isSelected ? '1px solid #326CF6' : '1px solid #EAEAEA',
                              borderRadius: '8px',
                              background: isSelected ? '#F8F9FF' : '#FFFFFF',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{
                              width: '100%',
                              height: '64px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              background: '#F5F5F5',
                            }}>
                              {/* Style Preview */}
                              <div style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: themeColors.surface,
                                borderRadius: properties.borderRadius?.mode === 'uniform' 
                                  ? `${properties.borderRadius.uniform ?? 0}px` 
                                  : '0px',
                                border: properties.border?.width?.mode === 'uniform' && (properties.border.width?.uniform ?? 0) > 0
                                  ? `${properties.border.width.uniform}px solid ${properties.border.color || themeColors.border}`
                                  : 'none',
                                boxShadow: properties.shadow ? (() => {
                                  const s = properties.shadow;
                                  const rgba = (() => {
                                    const hex = s.color.replace('#', '');
                                    const r = parseInt(hex.substring(0, 2), 16);
                                    const g = parseInt(hex.substring(2, 4), 16);
                                    const b = parseInt(hex.substring(4, 6), 16);
                                    return `rgba(${r}, ${g}, ${b}, ${s.opacity})`;
                                  })();
                                  const inset = s.position === 'inside' ? 'inset ' : '';
                                  return `${inset}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${rgba}`;
                                })() : undefined,
                              }} />
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
                                {style.name}
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: 400, color: '#6B6B6B', lineHeight: '1.3' }}>
                                {style.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customize Tab */}
                {defaultRowStyleType === 'custom' && (
                  <CustomizeTab
                    customStyleProperties={customStyleProperties}
                    setCustomStyleProperties={setCustomStyleProperties}
                    themeColors={themeColors}
                  />
                )}
              </div>

              <div className="theme-editor-actions">
                <button 
                  className="theme-editor-button-secondary" 
                  onClick={() => setStep('step1')}
                >
                  ← Back
                </button>
                <button 
                  className="theme-editor-button-primary" 
                  onClick={handleSaveTheme}
                >
                  {showSaveDialog && saveAsNew ? 'Create Theme' : isNewTheme ? 'Create Theme' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Right Side: Preview - Same as Step 1 but with default row style applied */}
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
                  {/* Get default row style properties */}
                  {(() => {
                    let rowStyleProps: Partial<ThemeSpecificRowProps> = {};
                    if (defaultRowStyleType === 'curated' && selectedCuratedStyle) {
                      const style = curatedStyles.find(s => s.id === selectedCuratedStyle);
                      if (style) {
                        rowStyleProps = style.getProperties(themeColors);
                      }
                    } else if (defaultRowStyleType === 'custom') {
                      rowStyleProps = customStyleProperties || {};
                    }

                    // Helper to convert shadow to CSS
                    const getBoxShadow = (shadow: typeof rowStyleProps.shadow): string => {
                      if (!shadow) return '';
                      const { x, y, blur, spread, color, opacity } = shadow;
                      const rgbaColor = (() => {
                        const hex = color.replace('#', '');
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                      })();
                      const inset = shadow.position === 'inside' ? 'inset ' : '';
                      return `${inset}${x}px ${y}px ${blur}px ${spread}px ${rgbaColor}`;
                    };

                    // Get border CSS
                    const getBorder = (): string => {
                      const border = rowStyleProps.border;
                      if (!border) return 'none';
                      const borderWidth = border.width?.mode === 'uniform' ? (border.width?.uniform ?? 0) : 0;
                      if (borderWidth > 0) {
                        return `${borderWidth}px solid ${border.color || themeColors.border}`;
                      }
                      return 'none';
                    };

                    // Get border radius
                    const getBorderRadius = (): string => {
                      const borderRadius = rowStyleProps.borderRadius;
                      if (borderRadius?.mode === 'uniform') {
                        return `${borderRadius.uniform ?? 0}px`;
                      }
                      return '8px'; // Default
                    };

                    return (
                      <>
                        {/* Row background color layer (base layer) - use default style or row background color */}
                        {(rowStyleProps.backgroundColor || colorConfig.rowBackgroundColor) && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: hexToRgba(
                                rowStyleProps.backgroundColor || colorConfig.rowBackgroundColor || '#ffffff',
                                rowStyleProps.backgroundColorOpacity ?? colorConfig.rowBackgroundColorOpacity ?? 1
                              ),
                              zIndex: 0,
                              borderRadius: getBorderRadius(),
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        {/* Row background image layer (above color) */}
                        {(rowStyleProps.backgroundImage || colorConfig.rowBackgroundImage) && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundImage: `url(${rowStyleProps.backgroundImage || colorConfig.rowBackgroundImage})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              opacity: rowStyleProps.backgroundImageOpacity ?? colorConfig.rowBackgroundImageOpacity ?? 1,
                              zIndex: 1,
                              borderRadius: getBorderRadius(),
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        {/* Row container with style properties applied */}
                        <div 
                          style={{ 
                            position: 'relative', 
                            zIndex: 2,
                            padding: '12px',
                            borderRadius: getBorderRadius(),
                            border: getBorder(),
                            boxShadow: rowStyleProps.shadow ? getBoxShadow(rowStyleProps.shadow) : undefined,
                            backdropFilter: rowStyleProps.bgBlur ? `blur(${rowStyleProps.bgBlur}px)` : undefined,
                            WebkitBackdropFilter: rowStyleProps.bgBlur ? `blur(${rowStyleProps.bgBlur}px)` : undefined,
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
                      </>
                    );
                  })()}
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

// Customize Tab Component - Full property editor for default row style
interface CustomizeTabProps {
  customStyleProperties: Partial<ThemeSpecificRowProps>;
  setCustomStyleProperties: (props: Partial<ThemeSpecificRowProps>) => void;
  themeColors: { accent: string; surface: string; border: string };
}

function CustomizeTab({ customStyleProperties = {}, setCustomStyleProperties, themeColors }: CustomizeTabProps) {
  // Ensure customStyleProperties is always an object
  const safeCustomStyleProperties = customStyleProperties || {};
  
  // State for popovers
  const [fillPopoverOpen, setFillPopoverOpen] = useState(false);
  const [fillColorPickerOpen, setFillColorPickerOpen] = useState(false);
  const [borderPopoverOpen, setBorderPopoverOpen] = useState(false);
  const [borderColorPickerOpen, setBorderColorPickerOpen] = useState(false);
  const [shadowPopoverOpen, setShadowPopoverOpen] = useState(false);
  const [shadowColorPickerOpen, setShadowColorPickerOpen] = useState(false);
  
  const fillPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const borderPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const shadowPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const borderInitializedRef = useRef(false);
  const shadowInitializedRef = useRef(false);

  // Extract current values
  const backgroundColor = safeCustomStyleProperties.backgroundColor;
  const backgroundColorOpacity = safeCustomStyleProperties.backgroundColorOpacity ?? 1;
  const backgroundImage = safeCustomStyleProperties.backgroundImage;
  const backgroundImageOpacity = safeCustomStyleProperties.backgroundImageOpacity ?? 1;
  const hasExplicitBackground = backgroundColor !== undefined || backgroundImage !== undefined;

  const borderRadius = safeCustomStyleProperties.borderRadius || { mode: 'uniform' as const, uniform: 0 };
  const borderRadiusMode = borderRadius?.mode || 'uniform';
  const uniformBorderRadius = borderRadius?.uniform ?? 0;

  const border = safeCustomStyleProperties.border || { color: undefined, width: { mode: 'uniform' as const, uniform: 0 }, style: 'solid' as const };
  const borderWidth = border?.width || { mode: 'uniform' as const, uniform: 0 };
  const borderWidthMode = borderWidth?.mode || 'uniform';
  const uniformBorderWidth = borderWidth?.uniform ?? 0;
  const hasVisibleBorder = uniformBorderWidth > 0;
  const borderColor = border?.color || themeColors?.border || '#e0e0e0';
  const borderStyle = border?.style || 'solid';

  const shadow = safeCustomStyleProperties.shadow ?? null;
  const hasShadow = shadow !== null;

  const bgBlur = safeCustomStyleProperties.bgBlur ?? 0;

  // Handlers
  const handleUpdateProperties = (updates: Partial<ThemeSpecificRowProps>) => {
    setCustomStyleProperties({ ...safeCustomStyleProperties, ...updates });
  };

  const handleBackgroundColorChange = (color: string) => {
    handleUpdateProperties({ backgroundColor: color });
  };

  const handleBackgroundColorOpacityChange = (opacity: number) => {
    handleUpdateProperties({ backgroundColorOpacity: opacity });
  };

  const handleBackgroundImageChange = (url: string | undefined) => {
    handleUpdateProperties({ backgroundImage: url });
  };

  const handleBackgroundImageOpacityChange = (opacity: number) => {
    handleUpdateProperties({ backgroundImageOpacity: opacity });
  };

  const handleClearBackground = () => {
    handleUpdateProperties({
      backgroundColor: undefined,
      backgroundColorOpacity: undefined,
      backgroundImage: undefined,
      backgroundImageOpacity: undefined,
    });
  };

  const handleBorderRadiusModeChange = (mode: 'uniform' | 'individual') => {
    handleUpdateProperties({
      borderRadius: {
        ...borderRadius,
        mode,
        uniform: mode === 'uniform' ? uniformBorderRadius : borderRadius.uniform,
      },
    });
  };

  const handleUniformBorderRadiusChange = (value: number) => {
    handleUpdateProperties({
      borderRadius: {
        uniform: value,
        mode: 'uniform',
      },
    });
  };

  const handleBorderColorChange = (color: string) => {
    handleUpdateProperties({
      border: {
        ...border,
        color,
        width: borderWidth || { mode: 'uniform', uniform: 1 },
        style: borderStyle || 'solid',
      },
    });
  };

  const handleBorderWidthChange = (width: { mode: 'uniform' | 'individual'; uniform?: number; top?: number; right?: number; bottom?: number; left?: number }) => {
    handleUpdateProperties({
      border: {
        ...border,
        width,
        color: border?.color || themeColors?.accent || '#326CF6',
        style: borderStyle || 'solid',
      },
    });
  };

  const handleBorderStyleChange = (style: 'solid' | 'dashed' | 'dotted' | 'double') => {
    handleUpdateProperties({
      border: {
        ...border,
        style,
      },
    });
  };

  const handleResetBorder = () => {
    handleUpdateProperties({
      border: {
        color: undefined,
        width: { mode: 'uniform', uniform: 0 },
        style: 'solid',
      },
    });
  };

  const handleShadowChange = (newShadow: Shadow | null) => {
    handleUpdateProperties({ shadow: newShadow });
  };

  const handleResetShadow = () => {
    handleUpdateProperties({ shadow: null });
  };

  const handleBgBlurChange = (value: number) => {
    handleUpdateProperties({ bgBlur: value });
  };

  const handleResetBgBlur = () => {
    handleUpdateProperties({ bgBlur: 0 });
  };

  // Icons
  const linkIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 10 10" style={{ width: '14px', height: '14px' }}>
      <path d="M2.75.75a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2h4.5a2 2 0 0 0 2-2v-4.5a2 2 0 0 0-2-2Z" fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  );
  const unlinkIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 10 10" style={{ width: '14px', height: '14px' }}>
      <path d="M 0.75 3.5 L 0.75 2.75 C 0.75 1.645 1.645 0.75 2.75 0.75 L 3.5 0.75" fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="1"></path>
      <path d="M 9.25 3.5 L 9.25 2.75 C 9.25 1.645 8.355 0.75 7.25 0.75 L 6.5 0.75" fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="1"></path>
      <path d="M 9.25 6.5 L 9.25 7.25 C 9.25 8.355 8.355 9.25 7.25 9.25 L 6.5 9.25" fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="1"></path>
      <path d="M 0.75 6.5 L 0.75 7.25 C 0.75 8.355 1.645 9.25 2.75 9.25 L 3.5 9.25" fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="1"></path>
    </svg>
  );

  // Safety check
  if (!setCustomStyleProperties || !themeColors) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '16px' }}>
        Define a custom default style for this theme.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Fill */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#6B6B6B', marginBottom: '8px' }}>
            Fill
          </label>
          <div
            ref={fillPopoverAnchorRef}
            onClick={() => {
              setBorderPopoverOpen(false);
              setShadowPopoverOpen(false);
              setFillPopoverOpen(true);
            }}
            style={{ width: '100%' }}
          >
            <PillSelect
              thumbnail={backgroundImage}
              swatchColor={backgroundColor}
              text={backgroundImage ? 'Image' : backgroundColor ? backgroundColor.toUpperCase() : 'Add...'}
              onClick={() => {}}
              onClear={(e) => {
                e.stopPropagation();
                handleClearBackground();
                setFillPopoverOpen(false);
              }}
              showClear={hasExplicitBackground}
            />
          </div>
        </div>

        {/* Radius */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#6B6B6B', marginBottom: '8px' }}>
            Radius
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            <NumberPillInput
              value={uniformBorderRadius}
              onChange={handleUniformBorderRadiusChange}
              min={0}
            />
            <IconButtonGroup
              buttons={[
                { value: 'uniform', icon: linkIcon, label: 'Uniform radius' },
                { value: 'individual', icon: unlinkIcon, label: 'Individual radius' },
              ]}
              activeValue={borderRadiusMode}
              onButtonClick={(value) => handleBorderRadiusModeChange(value as 'uniform' | 'individual')}
            />
          </div>
        </div>

        {/* Border */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#6B6B6B', marginBottom: '8px' }}>
            Border
          </label>
          <div
            ref={borderPopoverAnchorRef}
            onClick={() => {
              setFillPopoverOpen(false);
              setShadowPopoverOpen(false);
              if (!hasVisibleBorder && !borderInitializedRef.current) {
                borderInitializedRef.current = true;
                handleUpdateProperties({
                  border: {
                    color: themeColors.accent,
                    width: { mode: 'uniform', uniform: 2 },
                    style: 'solid',
                  },
                });
              }
              setBorderPopoverOpen(true);
            }}
            style={{ width: '100%' }}
          >
            <PillSelect
              swatchColor={hasVisibleBorder || borderPopoverOpen ? (borderColor || themeColors.accent) : '#CBCBCB'}
              text={hasVisibleBorder || borderPopoverOpen ? (borderStyle || 'solid') : 'Add...'}
              onClick={() => {}}
              onClear={(e) => {
                e.stopPropagation();
                handleResetBorder();
                setBorderPopoverOpen(false);
              }}
              showClear={hasVisibleBorder || borderPopoverOpen}
            />
          </div>
        </div>

        {/* Shadow */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#6B6B6B', marginBottom: '8px' }}>
            Shadow
          </label>
          <div
            ref={shadowPopoverAnchorRef}
            onClick={() => {
              setFillPopoverOpen(false);
              setBorderPopoverOpen(false);
              if (!hasShadow && !shadowInitializedRef.current) {
                shadowInitializedRef.current = true;
                handleShadowChange({
                  type: 'box',
                  position: 'outside',
                  color: '#000000',
                  opacity: 0.25,
                  x: 0,
                  y: 4,
                  blur: 8,
                  spread: 0,
                });
              }
              setShadowPopoverOpen(true);
            }}
            style={{ width: '100%' }}
          >
            <PillSelect
              swatchColor={hasShadow ? (shadow?.color || '#000000') : '#CBCBCB'}
              text={hasShadow ? 'Shadow' : 'Add...'}
              onClick={() => {}}
              onClear={(e) => {
                e.stopPropagation();
                handleResetShadow();
              }}
              showClear={hasShadow}
            />
          </div>
        </div>

        {/* BG Blur */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#6B6B6B', marginBottom: '8px' }}>
            BG Blur
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            <NumberSliderInput
              value={bgBlur}
              onChange={handleBgBlurChange}
              min={0}
              max={100}
              step={1}
            />
            {bgBlur > 0 && (
              <button
                type="button"
                onClick={handleResetBgBlur}
                style={{
                  width: '16px',
                  height: '16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B6B6B',
                }}
                aria-label="Remove BG Blur"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8.5" viewBox="0 0 8 8.5">
                  <g fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
                    <path d="m1.5 6.75 5-5M6.5 6.75l-5-5"></path>
                  </g>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Popovers */}
      <FillPopover
        isOpen={fillPopoverOpen}
        onClose={() => setFillPopoverOpen(false)}
        anchorElement={fillPopoverAnchorRef.current}
        fillType={backgroundImage ? 'image' : backgroundColor ? 'color' : 'color'}
        imageUrl={backgroundImage}
        imageType="Fill"
        color={backgroundColor}
        opacity={backgroundColorOpacity}
        onImageUrlChange={handleBackgroundImageChange}
        onImageTypeChange={() => {}}
        onImageDescriptionChange={() => {}}
        onColorChange={handleBackgroundColorChange}
        onOpacityChange={handleBackgroundColorOpacityChange}
      />

      {fillPopoverOpen && (
        <ColorPickerPopover
          isOpen={fillColorPickerOpen && fillPopoverOpen}
          onClose={() => {
            setFillColorPickerOpen(false);
            setFillPopoverOpen(true);
          }}
          anchorElement={fillPopoverAnchorRef.current}
          color={backgroundColor || '#326CF6'}
          opacity={backgroundColorOpacity}
          onColorChange={handleBackgroundColorChange}
          onOpacityChange={handleBackgroundColorOpacityChange}
          showBackButton={true}
          onBack={() => {
            setFillColorPickerOpen(false);
            setFillPopoverOpen(true);
          }}
          title="Fill"
        />
      )}

      <BorderPopover
        isOpen={borderPopoverOpen}
        onClose={() => {
          setBorderPopoverOpen(false);
          // Do not reset border when closing
        }}
        anchorElement={borderPopoverAnchorRef.current}
        color={borderColor || themeColors?.accent || '#326CF6'}
        width={borderWidth || { mode: 'uniform' as const, uniform: 0 }}
        style={(borderStyle || 'solid') as 'solid' | 'dashed' | 'dotted' | 'double'}
        onColorChange={handleBorderColorChange}
        onWidthChange={handleBorderWidthChange}
        onStyleChange={handleBorderStyleChange}
        onOpenColorPicker={() => {
          setBorderPopoverOpen(false);
          setBorderColorPickerOpen(true);
        }}
      />

      {borderPopoverOpen && (
        <ColorPickerPopover
          isOpen={borderColorPickerOpen && borderPopoverOpen}
          onClose={() => {
            setBorderColorPickerOpen(false);
            setBorderPopoverOpen(true);
          }}
          anchorElement={borderPopoverAnchorRef.current}
          color={borderColor || '#326CF6'}
          opacity={1}
          onColorChange={handleBorderColorChange}
          onOpacityChange={() => {}}
          showBackButton={true}
          onBack={() => {
            setBorderColorPickerOpen(false);
            setBorderPopoverOpen(true);
          }}
          title="Border"
          hideImageTab={true}
        />
      )}

      {hasShadow && (
        <ShadowPopover
          isOpen={shadowPopoverOpen && hasShadow}
          onClose={() => setShadowPopoverOpen(false)}
          anchorElement={shadowPopoverAnchorRef.current}
          shadow={shadow}
          onShadowChange={handleShadowChange}
          onOpenColorPicker={() => {
            setShadowPopoverOpen(false);
            setShadowColorPickerOpen(true);
          }}
        />
      )}

      {hasShadow && shadowPopoverOpen && (
        <ColorPickerPopover
          isOpen={shadowColorPickerOpen && shadowPopoverOpen && hasShadow}
          onClose={() => {
            setShadowColorPickerOpen(false);
            setShadowPopoverOpen(true);
          }}
          anchorElement={shadowPopoverAnchorRef.current}
          color={shadow?.color || '#000000'}
          opacity={shadow?.opacity || 0.25}
          onColorChange={(color) => {
            if (shadow) {
              handleShadowChange({ ...shadow, color });
            }
          }}
          onOpacityChange={(opacity) => {
            if (shadow) {
              handleShadowChange({ ...shadow, opacity });
            }
          }}
          showBackButton={true}
          onBack={() => {
            setShadowColorPickerOpen(false);
            setShadowPopoverOpen(true);
          }}
          title="Shadow"
          hideImageTab={true}
        />
      )}
    </div>
  );
}

