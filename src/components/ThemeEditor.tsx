import { useState, useEffect, useLayoutEffect, useRef, useMemo, createContext, useContext, ReactNode } from 'react';
import { useTheme, useThemeSwitcher, ThemeProvider } from '../theme/ThemeProvider';
import type { Theme, ThemeId } from '../theme/tokens';
import { plainTheme, neonTheme, themeToCSSVariables } from '../theme/tokens';
import { getBackgroundSize } from '../utils/backgroundImage';
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
import { PanelSection } from './ui/PanelSection';
import { PropertyRow } from './ui/PropertyRow';
import { RowView } from './RowView';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';
import { ColumnsBlockView } from './ColumnsBlockView';
import { ButtonBlockView } from './ButtonBlockView';
import type { Row, Block } from '../types';

// Palette icon for Colors
const PaletteIcon = () => (
  <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="palette" className="svg-inline--fa fa-palette" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18">
    <path fill="currentColor" d="M464 258.2c0 2.7-1 5.2-4.2 8c-3.8 3.1-10.1 5.8-17.8 5.8H344c-53 0-96 43-96 96c0 6.8 .7 13.4 2.1 19.8c3.3 15.7 10.2 31.1 14.4 40.6l0 0c.7 1.6 1.4 3 1.9 4.3c5 11.5 5.6 15.4 5.6 17.1c0 5.3-1.9 9.5-3.8 11.8c-.9 1.1-1.6 1.6-2 1.8c-.3 .2-.8 .3-1.6 .4c-2.9 .1-5.7 .2-8.6 .2C141.1 464 48 370.9 48 256S141.1 48 256 48s208 93.1 208 208c0 .7 0 1.4 0 2.2zm48 .5c0-.9 0-1.8 0-2.7C512 114.6 397.4 0 256 0S0 114.6 0 256S114.6 512 256 512c3.5 0 7.1-.1 10.6-.2c31.8-1.3 53.4-30.1 53.4-62c0-14.5-6.1-28.3-12.1-42c-4.3-9.8-8.7-19.7-10.8-29.9c-.7-3.2-1-6.5-1-9.9c0-26.5 21.5-48 48-48h97.9c36.5 0 69.7-24.8 70.1-61.3zM160 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm128-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm64 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"></path>
  </svg>
);

// Paintbrush-pencil icon for Design
const DesignIcon = () => (
  <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="paintbrush-pencil" className="svg-inline--fa fa-paintbrush-pencil" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="18" height="18">
    <path fill="currentColor" d="M181.3 19.3c-25-25-65.5-25-90.5 0L51.3 58.7c-3.1 3.1-5.9 6.5-8.2 10c-16.4 24.8-13.7 58.6 8.2 80.5l88.8 88.8c13.9-4 28.6-6.1 43.9-6.1l1.5 0 8.2-8.2L161 191 223 129l32.8 32.8 33.9-33.9L181.3 19.3zM414.2 320.1l37.3 37.3c.6 .6 1.2 1.2 1.7 1.8c3.9 4.4 6.7 9.6 8.4 15.2l6.9 23.4 16.1 54.8-54.8-16.1-23.4-6.9c-6.4-1.9-12.3-5.4-17-10.1l-37.3-37.3-8.1 8.1 0 1.7c0 15.2-2.1 29.9-6.1 43.9l17.6 17.6c1.3 1.3 2.6 2.6 4 3.8c9.6 8.5 21 14.8 33.4 18.4l78.1 23L513.2 511c8.4 2.5 17.5 .2 23.7-6.1s8.5-15.3 6.1-23.7L530.6 439l-23-78.1c-4.2-14.1-11.8-27-22.2-37.4l-37.3-37.3-33.9 33.9zM519 57c8.3 8.3 8.3 21.8 0 30.1L336.3 269.8l-30.1-30.1L489 57c8.3-8.3 21.8-8.3 30.1 0zM184 320c9.4 0 18.3 1.8 26.5 5L251 365.5c3.3 8.2 5 17.2 5 26.5c0 39.8-32.2 72-72 72H98.4l.7-.9c11.6-16.9 17.1-38.6 13.8-60c-.5-3.6-.8-7.3-.8-11.1c0-39.8 32.2-72 72-72zM455 23L204.3 273.7c-6.6-1.1-13.4-1.7-20.3-1.7c-66.3 0-120 53.7-120 120c0 6.2 .5 12.4 1.4 18.4C68.1 428.2 56.1 448 38 448H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H184c66.3 0 120-53.7 120-120c0-6.9-.6-13.7-1.7-20.3L553 121c27-27 27-70.9 0-97.9s-70.9-27-97.9 0z"></path>
  </svg>
);

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeUpdate: (themes: Record<string, Theme>) => void;
  customThemes: Record<string, Theme>;
  rows?: import('../types').Row[];
  blocks?: import('../types').Block[];
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
  pageBackgroundImageType?: 'fill' | 'fit' | 'stretch';
  rowBackgroundColor?: string;
  rowBackgroundColorOpacity?: number; // 0-1
  rowBackgroundImage?: string;
  rowBackgroundImageOpacity?: number; // 0-1
  rowBackgroundImageType?: 'fill' | 'fit' | 'stretch';
  cellBackgroundColor?: string; // Optional, default transparent
  cellBackgroundColorOpacity?: number; // 0-1
  cellBackgroundImage?: string; // Optional, default transparent
  cellBackgroundImageOpacity?: number; // 0-1
  cellBackgroundImageType?: 'fill' | 'fit' | 'stretch';
  resourceBackgroundColor?: string; // Optional, default transparent
  resourceBackgroundColorOpacity?: number; // 0-1
  resourceBackgroundImage?: string; // Optional, default transparent
  resourceBackgroundImageOpacity?: number; // 0-1
  resourceBackgroundImageType?: 'fill' | 'fit' | 'stretch';
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



export function ThemeEditor({ isOpen, onClose, onThemeUpdate, customThemes, rows = [], blocks = [] }: ThemeEditorProps) {
  const [step, setStep] = useState<EditorStep>('selection');
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [isNewTheme, setIsNewTheme] = useState(false);
  const [themeName, setThemeName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [previewTab, setPreviewTab] = useState<'test' | 'current'>('test');
  
  // Get theme context at top level (must be called unconditionally)
  const themeSwitcher = useThemeSwitcher();
  const [colorConfig, setColorConfig] = useState<ThemeColorConfig>({
    primaryColor: '#326CF6',
    headingColor: '#000000',
    paragraphColor: '#272525',
    pageBackgroundColor: '#ffffff',
    pageBackgroundColorOpacity: 1,
    pageBackgroundImage: undefined,
    pageBackgroundImageOpacity: 1,
    pageBackgroundImageType: 'fill',
    rowBackgroundColor: '#ffffff',
    rowBackgroundColorOpacity: 1,
    rowBackgroundImage: undefined,
    rowBackgroundImageOpacity: 1,
    rowBackgroundImageType: 'fill',
    cellBackgroundColor: undefined,
    cellBackgroundColorOpacity: 1,
    cellBackgroundImage: undefined,
    cellBackgroundImageOpacity: 1,
    cellBackgroundImageType: 'fill',
    resourceBackgroundColor: undefined,
    resourceBackgroundColorOpacity: 1,
    resourceBackgroundImage: undefined,
    resourceBackgroundImageOpacity: 1,
    resourceBackgroundImageType: 'fill',
  });

  // Step 2: Default Row Style
  const [defaultRowStyleType, setDefaultRowStyleType] = useState<'curated' | 'custom'>('curated');
  const [selectedCuratedStyle, setSelectedCuratedStyle] = useState<CuratedStyleId | null>(null);
  const [customStyleProperties, setCustomStyleProperties] = useState<Partial<ThemeSpecificRowProps>>({});
  
  // Step 1: Popover state
  const [primaryColorPopoverOpen, setPrimaryColorPopoverOpen] = useState(false);
  const [headingColorPopoverOpen, setHeadingColorPopoverOpen] = useState(false);
  const [paragraphColorPopoverOpen, setParagraphColorPopoverOpen] = useState(false);
  const [pageFillPopoverOpen, setPageFillPopoverOpen] = useState(false);
  const [rowFillPopoverOpen, setRowFillPopoverOpen] = useState(false);
  const [cellFillPopoverOpen, setCellFillPopoverOpen] = useState(false);
  const [resourceFillPopoverOpen, setResourceFillPopoverOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  
  const primaryColorPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const headingColorPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const paragraphColorPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const pageFillPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const rowFillPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const cellFillPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const resourceFillPopoverAnchorRef = useRef<HTMLDivElement>(null);

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
          pageBackgroundImageType: theme.pageBackground?.backgroundImageType ?? 'fill',
          rowBackgroundColor: theme.rowBackground?.backgroundColor,
          rowBackgroundColorOpacity: theme.rowBackground?.backgroundColorOpacity ?? 1,
          rowBackgroundImage: theme.rowBackground?.backgroundImage,
          rowBackgroundImageOpacity: theme.rowBackground?.backgroundImageOpacity ?? 1,
          rowBackgroundImageType: theme.rowBackground?.backgroundImageType ?? 'fill',
          cellBackgroundColor: theme.cellBackground?.backgroundColor,
          cellBackgroundColorOpacity: theme.cellBackground?.backgroundColorOpacity ?? 1,
          cellBackgroundImage: theme.cellBackground?.backgroundImage,
          cellBackgroundImageOpacity: theme.cellBackground?.backgroundImageOpacity ?? 1,
          cellBackgroundImageType: theme.cellBackground?.backgroundImageType ?? 'fill',
          resourceBackgroundColor: theme.resourceBackground?.backgroundColor,
          resourceBackgroundColorOpacity: theme.resourceBackground?.backgroundColorOpacity ?? 1,
          resourceBackgroundImage: theme.resourceBackground?.backgroundImage,
          resourceBackgroundImageOpacity: theme.resourceBackground?.backgroundImageOpacity ?? 1,
          resourceBackgroundImageType: theme.resourceBackground?.backgroundImageType ?? 'fill',
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
        // Initialize customStyleProperties with row background color from Step 1
        setCustomStyleProperties({
          backgroundColor: colorConfig.rowBackgroundColor,
          backgroundColorOpacity: colorConfig.rowBackgroundColorOpacity ?? 1,
          backgroundImage: colorConfig.rowBackgroundImage,
          backgroundImageOpacity: colorConfig.rowBackgroundImageOpacity ?? 1,
        });
      }
    }
  }, [editingThemeId, step, customThemes]);

  // Step 2: Design (Default Row Style) - hooks must be declared before any early returns
  const originalThemeIdRef = useRef<string | null>(null);
  const [previewThemeReady, setPreviewThemeReady] = useState(false);
  
  // Get theme switcher at top level (hooks must be called unconditionally)
  const { updateCustomThemes, setThemeId: setContextThemeId, customThemes: contextCustomThemes, themeId: currentThemeId } = themeSwitcher;
  
  // Create preview theme from current colorConfig (must be at top level for useMemo)
  const previewTheme: Theme = useMemo(() => ({
    name: editingThemeId || 'Preview',
    colors: {
      bg: colorConfig.pageBackgroundColor,
      surface: colorConfig.pageBackgroundColor,
      text: colorConfig.headingColor,
      mutedText: colorConfig.paragraphColor,
      border: '#e0e0e0',
      focusRing: colorConfig.primaryColor,
      accent: colorConfig.primaryColor,
    },
    typography: plainTheme.typography,
    spacing: plainTheme.spacing,
    radius: plainTheme.radius,
    shadow: plainTheme.shadow,
    cellPadding: plainTheme.cellPadding,
    cellBackground: {
      backgroundColor: colorConfig.cellBackgroundColor,
      backgroundColorOpacity: colorConfig.cellBackgroundColor ? (colorConfig.cellBackgroundColorOpacity ?? 1) : undefined,
      backgroundImage: colorConfig.cellBackgroundImage,
      backgroundImageOpacity: colorConfig.cellBackgroundImage ? (colorConfig.cellBackgroundImageOpacity ?? 1) : undefined,
      backgroundImageType: colorConfig.cellBackgroundImageType ?? 'fill',
    },
    rowPadding: plainTheme.rowPadding,
    rowBackground: {
      backgroundColor: colorConfig.rowBackgroundColor,
      backgroundColorOpacity: colorConfig.rowBackgroundColorOpacity ?? 1,
      backgroundImage: colorConfig.rowBackgroundImage,
      backgroundImageOpacity: colorConfig.rowBackgroundImage ? (colorConfig.rowBackgroundImageOpacity ?? 1) : undefined,
      backgroundImageType: colorConfig.rowBackgroundImageType ?? 'fill',
    },
    cellBorder: plainTheme.cellBorder,
    cellBorderRadius: plainTheme.cellBorderRadius,
    rowBorder: plainTheme.rowBorder,
    rowBorderRadius: plainTheme.rowBorderRadius,
    pageBackground: {
      backgroundColor: colorConfig.pageBackgroundColor,
      backgroundColorOpacity: colorConfig.pageBackgroundColorOpacity ?? 1,
      backgroundImage: colorConfig.pageBackgroundImage,
      backgroundImageOpacity: colorConfig.pageBackgroundImage ? (colorConfig.pageBackgroundImageOpacity ?? 1) : undefined,
      backgroundImageType: colorConfig.pageBackgroundImageType ?? 'fill',
    },
    resourceBackground: {
      backgroundColor: colorConfig.resourceBackgroundColor,
      backgroundColorOpacity: colorConfig.resourceBackgroundColor ? (colorConfig.resourceBackgroundColorOpacity ?? 1) : undefined,
      backgroundImage: colorConfig.resourceBackgroundImage,
      backgroundImageOpacity: colorConfig.resourceBackgroundImage ? (colorConfig.resourceBackgroundImageOpacity ?? 1) : undefined,
      backgroundImageType: colorConfig.resourceBackgroundImageType ?? 'fill',
    },
    defaultRowStyle: (defaultRowStyleType === 'curated' && selectedCuratedStyle) || (defaultRowStyleType === 'custom' && Object.keys(customStyleProperties).length > 0)
      ? {
          type: defaultRowStyleType,
          curatedId: defaultRowStyleType === 'curated' ? selectedCuratedStyle || undefined : undefined,
          customProperties: defaultRowStyleType === 'custom' ? customStyleProperties : undefined,
        }
      : undefined,
  }), [colorConfig, defaultRowStyleType, selectedCuratedStyle, customStyleProperties, editingThemeId]);

  // Update customThemes with preview theme and set themeId when previewing current page
  // Use useLayoutEffect to set theme synchronously before browser paints
  useLayoutEffect(() => {
    const previewThemeId = '__preview__';
    
    if (previewTab === 'current' && step === 'step2') {
      // Store original themeId if not already stored
      if (originalThemeIdRef.current === null) {
        originalThemeIdRef.current = currentThemeId;
      }
      
      // Add preview theme to customThemes
      updateCustomThemes((prevThemes) => ({
        ...prevThemes,
        [previewThemeId]: previewTheme,
      }));
      
      // Set theme to preview theme immediately (synchronously)
      setContextThemeId(previewThemeId);
      setPreviewThemeReady(true);
    } else {
      // When switching away from current page or step, restore original theme
      if (originalThemeIdRef.current !== null) {
        updateCustomThemes((prevThemes) => {
          const { [previewThemeId]: _, ...rest } = prevThemes;
          return rest;
        });
        setContextThemeId(originalThemeIdRef.current);
        originalThemeIdRef.current = null;
        setPreviewThemeReady(false);
      }
    }
  }, [previewTab, previewTheme, step, updateCustomThemes, setContextThemeId, currentThemeId]);

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
        backgroundImageType: colorConfig.cellBackgroundImageType ?? 'fill',
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
        backgroundImageType: colorConfig.pageBackgroundImageType ?? 'fill',
      },
      resourceBackground: {
        backgroundColor: colorConfig.resourceBackgroundColor,
        backgroundColorOpacity: colorConfig.resourceBackgroundColor ? (colorConfig.resourceBackgroundColorOpacity ?? 1) : undefined,
        backgroundImage: colorConfig.resourceBackgroundImage,
        backgroundImageOpacity: colorConfig.resourceBackgroundImage ? (colorConfig.resourceBackgroundImageOpacity ?? 1) : undefined,
        backgroundImageType: colorConfig.resourceBackgroundImageType ?? 'fill',
      },
      defaultRowStyle: (defaultRowStyleType === 'curated' && selectedCuratedStyle) || (defaultRowStyleType === 'custom' && Object.keys(customStyleProperties).length > 0)
        ? {
            type: defaultRowStyleType,
            curatedId: defaultRowStyleType === 'curated' ? selectedCuratedStyle || undefined : undefined,
            customProperties: defaultRowStyleType === 'custom' ? customStyleProperties : undefined,
          }
        : undefined,
    };

    // Update custom themes - ensure we preserve all existing themes
    const updatedThemes = {
      ...customThemes, // Preserve all existing themes
      [finalThemeId]: newTheme, // Add or update the current theme
    };

    // Save themes - this will trigger the save in ThemeProvider
    onThemeUpdate(updatedThemes);
    
    // Log for debugging
    console.log(`Saved theme "${finalThemeName}" with ID "${finalThemeId}"`);
    console.log(`Total themes after save: ${Object.keys(updatedThemes).length}`);

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
                          backgroundSize: getBackgroundSize(plainTheme.pageBackground.backgroundImageType),
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
                          backgroundSize: getBackgroundSize(neonTheme.pageBackground.backgroundImageType),
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
                .filter(([id, theme]) => {
                  // Exclude preview theme, but include all others
                  return id !== '__preview__' && theme && typeof theme === 'object' && theme.name;
                })
                .sort(([idA, themeA], [idB, themeB]) => {
                  // Sort by name for better organization
                  const nameA = themeA?.name || '';
                  const nameB = themeB?.name || '';
                  return nameA.localeCompare(nameB);
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
                            backgroundSize: getBackgroundSize(theme.pageBackground.backgroundImageType),
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
          <div className="theme-editor-header">
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
          <div className="theme-editor-main-content">
            <div className="theme-editor-left-panel">
              <div className="theme-editor-sidebar">
                <button className={`theme-editor-sidebar-item ${step === 'step1' ? 'active' : ''}`} onClick={() => setStep('step1')}>
                  <PaletteIcon />
                  <span>Colors</span>
                </button>
                <button className={`theme-editor-sidebar-item ${step === 'step2' ? 'active' : ''}`} onClick={() => setStep('step2')}>
                  <DesignIcon />
                  <span>Design</span>
                </button>
              </div>
              <div className="theme-editor-config-wrapper">
                <div className="theme-editor-config-panel ui-properties-panel">
              
              {/* Theme Palette - Primary Color */}
              <PanelSection title="Theme palette">
                <PropertyRow label="Primary">
                  <div
                    ref={primaryColorPopoverAnchorRef}
                    onClick={() => {
                      setHeadingColorPopoverOpen(false);
                      setParagraphColorPopoverOpen(false);
                      setPageFillPopoverOpen(false);
                      setRowFillPopoverOpen(false);
                      setCellFillPopoverOpen(false);
                      setResourceFillPopoverOpen(false);
                      setColorPickerOpen(false);
                      setActiveColorPicker('primary');
                      setPrimaryColorPopoverOpen(true);
                    }}
                    style={{ width: '100%', flex: 1 }}
                  >
                    <PillSelect
                      swatchColor={colorConfig.primaryColor}
                      text={colorConfig.primaryColor.toUpperCase()}
                      onClick={() => {}}
                      showClear={false}
                    />
                  </div>
                </PropertyRow>
              </PanelSection>

              {/* Font Color */}
              <PanelSection title="Font color">
                <PropertyRow label="Heading">
                  <div
                    ref={headingColorPopoverAnchorRef}
                    onClick={() => {
                      setPrimaryColorPopoverOpen(false);
                      setParagraphColorPopoverOpen(false);
                      setPageFillPopoverOpen(false);
                      setRowFillPopoverOpen(false);
                      setCellFillPopoverOpen(false);
                      setResourceFillPopoverOpen(false);
                      setColorPickerOpen(false);
                      setActiveColorPicker('heading');
                      setHeadingColorPopoverOpen(true);
                    }}
                    style={{ width: '100%', flex: 1 }}
                  >
                    <PillSelect
                      swatchColor={colorConfig.headingColor}
                      text={colorConfig.headingColor.toUpperCase()}
                      onClick={() => {}}
                      showClear={false}
                    />
                  </div>
                </PropertyRow>
                <PropertyRow label="Paragraph">
                  <div
                    ref={paragraphColorPopoverAnchorRef}
                    onClick={() => {
                      setPrimaryColorPopoverOpen(false);
                      setHeadingColorPopoverOpen(false);
                      setPageFillPopoverOpen(false);
                      setRowFillPopoverOpen(false);
                      setCellFillPopoverOpen(false);
                      setResourceFillPopoverOpen(false);
                      setColorPickerOpen(false);
                      setActiveColorPicker('paragraph');
                      setParagraphColorPopoverOpen(true);
                    }}
                    style={{ width: '100%', flex: 1 }}
                  >
                    <PillSelect
                      swatchColor={colorConfig.paragraphColor}
                      text={colorConfig.paragraphColor.toUpperCase()}
                      onClick={() => {}}
                      showClear={false}
                    />
                  </div>
                </PropertyRow>
              </PanelSection>

              {/* Page Background */}
              <PanelSection title="Page background">
                <PropertyRow label="Fill">
                  <div
                    ref={pageFillPopoverAnchorRef}
                    onClick={() => {
                      setPrimaryColorPopoverOpen(false);
                      setHeadingColorPopoverOpen(false);
                      setParagraphColorPopoverOpen(false);
                      setRowFillPopoverOpen(false);
                      setCellFillPopoverOpen(false);
                      setResourceFillPopoverOpen(false);
                      setColorPickerOpen(false);
                      setPageFillPopoverOpen(true);
                    }}
                    style={{ width: '100%', flex: 1 }}
                  >
                    <PillSelect
                      thumbnail={colorConfig.pageBackgroundImage}
                      swatchColor={colorConfig.pageBackgroundColor}
                      swatchOpacity={colorConfig.pageBackgroundColorOpacity ?? 1}
                      text={colorConfig.pageBackgroundImage ? 'Image' : colorConfig.pageBackgroundColor ? colorConfig.pageBackgroundColor.toUpperCase() : 'Add...'}
                      onClick={() => {}}
                      onClear={(e) => {
                        e.stopPropagation();
                        setColorConfig({
                          ...colorConfig,
                          pageBackgroundColor: '#ffffff',
                          pageBackgroundColorOpacity: 1,
                          pageBackgroundImage: undefined,
                          pageBackgroundImageOpacity: 1,
                        });
                        setPageFillPopoverOpen(false);
                      }}
                      showClear={!!colorConfig.pageBackgroundColor || !!colorConfig.pageBackgroundImage}
                    />
                </div>
                </PropertyRow>
              </PanelSection>

              {/* Card/Content/Section (Row) Background */}
              <PanelSection title="Card/Content/Section">
                <PropertyRow label="Fill">
                  <div
                    ref={rowFillPopoverAnchorRef}
                    onClick={() => {
                      setPrimaryColorPopoverOpen(false);
                      setHeadingColorPopoverOpen(false);
                      setParagraphColorPopoverOpen(false);
                      setPageFillPopoverOpen(false);
                      setCellFillPopoverOpen(false);
                      setResourceFillPopoverOpen(false);
                      setColorPickerOpen(false);
                      setRowFillPopoverOpen(true);
                    }}
                    style={{ width: '100%', flex: 1 }}
                  >
                    <PillSelect
                      thumbnail={colorConfig.rowBackgroundImage}
                      swatchColor={colorConfig.rowBackgroundColor}
                      swatchOpacity={colorConfig.rowBackgroundColorOpacity ?? 1}
                      text={colorConfig.rowBackgroundImage ? 'Image' : colorConfig.rowBackgroundColor ? colorConfig.rowBackgroundColor.toUpperCase() : 'Add...'}
                      onClick={() => {}}
                      onClear={(e) => {
                        e.stopPropagation();
                        setColorConfig({
                          ...colorConfig,
                          rowBackgroundColor: undefined,
                          rowBackgroundColorOpacity: 1,
                          rowBackgroundImage: undefined,
                          rowBackgroundImageOpacity: 1,
                        });
                        setRowFillPopoverOpen(false);
                      }}
                      showClear={!!colorConfig.rowBackgroundColor || !!colorConfig.rowBackgroundImage}
                    />
                  </div>
                </PropertyRow>
              </PanelSection>

              {/* Cells and Resources (Optional) */}
              <PanelSection title="Cells and Resources">
                <PropertyRow label="Cell Fill">
                  <div
                    ref={cellFillPopoverAnchorRef}
                    onClick={() => {
                      setPrimaryColorPopoverOpen(false);
                      setHeadingColorPopoverOpen(false);
                      setParagraphColorPopoverOpen(false);
                      setPageFillPopoverOpen(false);
                      setRowFillPopoverOpen(false);
                      setResourceFillPopoverOpen(false);
                      setColorPickerOpen(false);
                      setCellFillPopoverOpen(true);
                    }}
                    style={{ width: '100%', flex: 1 }}
                  >
                    <PillSelect
                      thumbnail={colorConfig.cellBackgroundImage}
                      swatchColor={colorConfig.cellBackgroundColor}
                      swatchOpacity={colorConfig.cellBackgroundColorOpacity ?? 1}
                      text={colorConfig.cellBackgroundImage ? 'Image' : colorConfig.cellBackgroundColor ? colorConfig.cellBackgroundColor.toUpperCase() : 'Add...'}
                      onClick={() => {}}
                      onClear={(e) => {
                        e.stopPropagation();
                        setColorConfig({
                          ...colorConfig,
                          cellBackgroundColor: undefined,
                          cellBackgroundColorOpacity: 1,
                          cellBackgroundImage: undefined,
                          cellBackgroundImageOpacity: 1,
                        });
                        setCellFillPopoverOpen(false);
                      }}
                      showClear={!!colorConfig.cellBackgroundColor || !!colorConfig.cellBackgroundImage}
                    />
                  </div>
                </PropertyRow>
                <PropertyRow label="Resource Fill">
                  <div
                    ref={resourceFillPopoverAnchorRef}
                    onClick={() => {
                      setPrimaryColorPopoverOpen(false);
                      setHeadingColorPopoverOpen(false);
                      setParagraphColorPopoverOpen(false);
                      setPageFillPopoverOpen(false);
                      setRowFillPopoverOpen(false);
                      setCellFillPopoverOpen(false);
                      setColorPickerOpen(false);
                      setResourceFillPopoverOpen(true);
                    }}
                    style={{ width: '100%', flex: 1 }}
                  >
                    <PillSelect
                      thumbnail={colorConfig.resourceBackgroundImage}
                      swatchColor={colorConfig.resourceBackgroundColor}
                      swatchOpacity={colorConfig.resourceBackgroundColorOpacity ?? 1}
                      text={colorConfig.resourceBackgroundImage ? 'Image' : colorConfig.resourceBackgroundColor ? colorConfig.resourceBackgroundColor.toUpperCase() : 'Add...'}
                      onClick={() => {}}
                      onClear={(e) => {
                        e.stopPropagation();
                        setColorConfig({
                          ...colorConfig,
                          resourceBackgroundColor: undefined,
                          resourceBackgroundColorOpacity: 1,
                          resourceBackgroundImage: undefined,
                          resourceBackgroundImageOpacity: 1,
                        });
                        setResourceFillPopoverOpen(false);
                      }}
                      showClear={!!colorConfig.resourceBackgroundColor || !!colorConfig.resourceBackgroundImage}
                    />
                  </div>
                </PropertyRow>
              </PanelSection>

              {/* Theme Name (for new themes and editing existing themes) */}
              <PanelSection title="Theme">
                <PropertyRow label="Name">
                  <input
                    type="text"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    className="ui-number-pill"
                    placeholder={isNewTheme ? "Enter theme name" : "Theme name"}
                    required={isNewTheme}
                    style={{ width: '100%', flex: 1 }}
                  />
                </PropertyRow>
              </PanelSection>

              {/* Theme Name (when saving Plain/Neon as new) */}
              {showSaveDialog && saveAsNew && (
                <PanelSection title="Theme">
                  <PropertyRow label="Name">
                      <input
                      type="text"
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      className="ui-number-pill"
                      placeholder="Enter theme name"
                      required
                      autoFocus
                      style={{ width: '100%', flex: 1 }}
                    />
                  </PropertyRow>
                </PanelSection>
              )}

              {/* Popovers */}
              {primaryColorPopoverOpen && (
                <ColorPickerPopover
                  isOpen={primaryColorPopoverOpen && !colorPickerOpen}
                  onClose={() => setPrimaryColorPopoverOpen(false)}
                  anchorElement={primaryColorPopoverAnchorRef.current}
                  color={colorConfig.primaryColor}
                  opacity={1}
                  onColorChange={(color) => setColorConfig({ ...colorConfig, primaryColor: color })}
                  onOpacityChange={() => {}}
                  hideImageTab={true}
                  hideThemeColors={true}
                />
              )}

              {headingColorPopoverOpen && (
                <ColorPickerPopover
                  isOpen={headingColorPopoverOpen && !colorPickerOpen}
                  onClose={() => setHeadingColorPopoverOpen(false)}
                  anchorElement={headingColorPopoverAnchorRef.current}
                  color={colorConfig.headingColor}
                  opacity={1}
                  onColorChange={(color) => setColorConfig({ ...colorConfig, headingColor: color })}
                  onOpacityChange={() => {}}
                  hideImageTab={true}
                  hideThemeColors={true}
                />
              )}

              {paragraphColorPopoverOpen && (
                <ColorPickerPopover
                  isOpen={paragraphColorPopoverOpen && !colorPickerOpen}
                  onClose={() => setParagraphColorPopoverOpen(false)}
                  anchorElement={paragraphColorPopoverAnchorRef.current}
                  color={colorConfig.paragraphColor}
                  opacity={1}
                  onColorChange={(color) => setColorConfig({ ...colorConfig, paragraphColor: color })}
                  onOpacityChange={() => {}}
                  hideImageTab={true}
                  hideThemeColors={true}
                />
              )}

              <FillPopover
                isOpen={pageFillPopoverOpen}
                onClose={() => setPageFillPopoverOpen(false)}
                anchorElement={pageFillPopoverAnchorRef.current}
                fillType={colorConfig.pageBackgroundImage ? 'image' : colorConfig.pageBackgroundColor ? 'color' : 'color'}
                imageUrl={colorConfig.pageBackgroundImage}
                imageType={colorConfig.pageBackgroundImageType === 'fill' ? 'Fill' : colorConfig.pageBackgroundImageType === 'fit' ? 'Fit' : 'Stretch'}
                color={colorConfig.pageBackgroundColor}
                opacity={colorConfig.pageBackgroundColorOpacity ?? 1}
                onImageUrlChange={(url) => setColorConfig({ ...colorConfig, pageBackgroundImage: url })}
                onImageTypeChange={(type) => {
                  const imageType = type === 'Fill' ? 'fill' : type === 'Fit' ? 'fit' : type === 'Stretch' ? 'stretch' : 'fill';
                  setColorConfig({ ...colorConfig, pageBackgroundImageType: imageType as 'fill' | 'fit' | 'stretch' });
                }}
                onImageDescriptionChange={() => {}}
                onColorChange={(color) => setColorConfig({ ...colorConfig, pageBackgroundColor: color })}
                onOpacityChange={(opacity) => setColorConfig({ ...colorConfig, pageBackgroundColorOpacity: opacity })}
              />

              <FillPopover
                isOpen={rowFillPopoverOpen}
                onClose={() => setRowFillPopoverOpen(false)}
                anchorElement={rowFillPopoverAnchorRef.current}
                fillType={colorConfig.rowBackgroundImage ? 'image' : colorConfig.rowBackgroundColor ? 'color' : 'color'}
                imageUrl={colorConfig.rowBackgroundImage}
                imageType={colorConfig.rowBackgroundImageType === 'fill' ? 'Fill' : colorConfig.rowBackgroundImageType === 'fit' ? 'Fit' : 'Stretch'}
                color={colorConfig.rowBackgroundColor}
                opacity={colorConfig.rowBackgroundColorOpacity ?? 1}
                onImageUrlChange={(url) => setColorConfig({ ...colorConfig, rowBackgroundImage: url })}
                onImageTypeChange={(type) => {
                  const imageType = type === 'Fill' ? 'fill' : type === 'Fit' ? 'fit' : type === 'Stretch' ? 'stretch' : 'fill';
                  setColorConfig({ ...colorConfig, rowBackgroundImageType: imageType as 'fill' | 'fit' | 'stretch' });
                }}
                onImageDescriptionChange={() => {}}
                onColorChange={(color) => setColorConfig({ ...colorConfig, rowBackgroundColor: color })}
                onOpacityChange={(opacity) => setColorConfig({ ...colorConfig, rowBackgroundColorOpacity: opacity })}
              />

              <FillPopover
                isOpen={cellFillPopoverOpen}
                onClose={() => setCellFillPopoverOpen(false)}
                anchorElement={cellFillPopoverAnchorRef.current}
                fillType={colorConfig.cellBackgroundImage ? 'image' : colorConfig.cellBackgroundColor ? 'color' : 'color'}
                imageUrl={colorConfig.cellBackgroundImage}
                imageType={colorConfig.cellBackgroundImageType === 'fill' ? 'Fill' : colorConfig.cellBackgroundImageType === 'fit' ? 'Fit' : 'Stretch'}
                color={colorConfig.cellBackgroundColor}
                opacity={colorConfig.cellBackgroundColorOpacity ?? 1}
                onImageUrlChange={(url) => setColorConfig({ ...colorConfig, cellBackgroundImage: url })}
                onImageTypeChange={(type) => {
                  const imageType = type === 'Fill' ? 'fill' : type === 'Fit' ? 'fit' : type === 'Stretch' ? 'stretch' : 'fill';
                  setColorConfig({ ...colorConfig, cellBackgroundImageType: imageType as 'fill' | 'fit' | 'stretch' });
                }}
                onImageDescriptionChange={() => {}}
                onColorChange={(color) => setColorConfig({ ...colorConfig, cellBackgroundColor: color })}
                onOpacityChange={(opacity) => setColorConfig({ ...colorConfig, cellBackgroundColorOpacity: opacity })}
              />

              <FillPopover
                isOpen={resourceFillPopoverOpen}
                onClose={() => setResourceFillPopoverOpen(false)}
                anchorElement={resourceFillPopoverAnchorRef.current}
                fillType={colorConfig.resourceBackgroundImage ? 'image' : colorConfig.resourceBackgroundColor ? 'color' : 'color'}
                imageUrl={colorConfig.resourceBackgroundImage}
                imageType={colorConfig.resourceBackgroundImageType === 'fill' ? 'Fill' : colorConfig.resourceBackgroundImageType === 'fit' ? 'Fit' : 'Stretch'}
                color={colorConfig.resourceBackgroundColor}
                opacity={colorConfig.resourceBackgroundColorOpacity ?? 1}
                onImageUrlChange={(url) => setColorConfig({ ...colorConfig, resourceBackgroundImage: url })}
                onImageTypeChange={(type) => {
                  const imageType = type === 'Fill' ? 'fill' : type === 'Fit' ? 'fit' : type === 'Stretch' ? 'stretch' : 'fill';
                  setColorConfig({ ...colorConfig, resourceBackgroundImageType: imageType as 'fill' | 'fit' | 'stretch' });
                }}
                onImageDescriptionChange={() => {}}
                onColorChange={(color) => setColorConfig({ ...colorConfig, resourceBackgroundColor: color })}
                onOpacityChange={(opacity) => setColorConfig({ ...colorConfig, resourceBackgroundColorOpacity: opacity })}
              />

                </div>
                <div className="theme-editor-footer-sticky">
                  <button 
                    className="theme-editor-button-secondary" 
                    onClick={() => setStep('step2')}
                  >
                    Next: Design →
                  </button>
                </div>
              </div>
            </div>
            {/* Right Side Preview */}
            <div className="theme-editor-preview">
              <div className="theme-preview-header">
                <div className="theme-preview-tabs">
                  <button 
                    className={`theme-preview-tab ${previewTab === 'test' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('test')}
                  >
                    Test page
                  </button>
                  <button 
                    className={`theme-preview-tab ${previewTab === 'current' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('current')}
                  >
                    Current page
                  </button>
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
                      backgroundSize: getBackgroundSize(colorConfig.pageBackgroundImageType),
                      backgroundPosition: 'center',
                      opacity: colorConfig.pageBackgroundImageOpacity ?? 1,
                      zIndex: 0,
                    }}
                  />
                )}
                {previewTab === 'test' ? (
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
                        backgroundSize: getBackgroundSize(colorConfig.rowBackgroundImageType),
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
                            backgroundSize: getBackgroundSize(colorConfig.cellBackgroundImageType),
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
                            backgroundSize: getBackgroundSize(colorConfig.resourceBackgroundImageType),
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
                            backgroundSize: getBackgroundSize(colorConfig.resourceBackgroundImageType),
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
                            backgroundSize: getBackgroundSize(colorConfig.resourceBackgroundImageType),
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
                ) : (
                  // Current page - render actual canvas content
                  <div style={{ position: 'relative', zIndex: 1, padding: '16px', overflowY: 'auto', height: '100%' }}>
                    {rows && rows.length > 0 ? (
                      rows.map((row) => (
                        <RowView
                          key={row.id}
                          row={row}
                          themeId={editingThemeId || 'plain'}
                          onUpdateRow={() => {}}
                          onUpdateCell={() => {}}
                          onUpdateBlock={() => {}}
                          onDeleteRow={() => {}}
                          onDeleteCell={() => {}}
                          onDeleteBlock={() => {}}
                          selectedBlockId={null}
                          selectedRowId={null}
                          selectedCellId={null}
                          renderResource={(resource) => {
                            // Render blocks using the same logic as PreviewStage
                            if (resource.type === 'text' || resource.type === 'header') {
                              return (
                                <TextBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isEditing={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                />
                              );
                            }
                            if (resource.type === 'image') {
                              return (
                                <ImageBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                />
                              );
                            }
                            if (resource.type === 'quiz') {
                              return (
                                <QuizBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isEditing={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                />
                              );
                            }
                            if (resource.type === 'columns') {
                              return (
                                <ColumnsBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                  allBlocks={[]}
                                  showStructureStrokes={false}
                                />
                              );
                            }
                            if (resource.type === 'button') {
                              return (
                                <ButtonBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                  allBlocks={[]}
                                  showStructureStrokes={false}
                                />
                              );
                            }
                            return null;
                          }}
                          activeId={undefined}
                          allBlocks={[]}
                          showStructureStrokes={false}
                        />
                      ))
                    ) : (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#6B6B6B' }}>
                        No content on the page yet. Add some content to see it here.
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'step2') {
    const themeColors = {
      accent: colorConfig.primaryColor,
      surface: colorConfig.pageBackgroundColor,
      border: '#e0e0e0',
    };

    return (
      <div className="theme-editor-overlay" onClick={onClose}>
        <div className="theme-editor-container theme-editor-step1" onClick={(e) => e.stopPropagation()}>
          <div className="theme-editor-header">
            <button className="theme-editor-exit" onClick={() => setStep('step1')}>
              ← Back
            </button>
            <div className="theme-editor-title">
              <DesignIcon />
              <h2>Design</h2>
            </div>
            <div></div>
          </div>
          <div className="theme-editor-main-content">
            <div className="theme-editor-left-panel">
              <div className="theme-editor-sidebar">
                <button className={`theme-editor-sidebar-item ${step === 'step1' ? 'active' : ''}`} onClick={() => setStep('step1')}>
                  <PaletteIcon />
                  <span>Colors</span>
                </button>
                <button className={`theme-editor-sidebar-item ${step === 'step2' ? 'active' : ''}`} onClick={() => setStep('step2')}>
                  <DesignIcon />
                  <span>Design</span>
                </button>
              </div>
              <div className="theme-editor-config-wrapper">
                <div className="theme-editor-config-panel ui-properties-panel">
                <div className="theme-config-section">
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Default Row Style</h3>
                
                {/* Tabs */}
                <div className="theme-preview-tabs" style={{ marginBottom: '24px' }}>
                  <button
                    type="button"
                    className={`theme-preview-tab ${defaultRowStyleType === 'curated' ? 'active' : ''}`}
                    onClick={() => setDefaultRowStyleType('curated')}
                  >
                    Curated
                  </button>
                  <button
                    type="button"
                    className={`theme-preview-tab ${defaultRowStyleType === 'custom' ? 'active' : ''}`}
                    onClick={() => {
                      setDefaultRowStyleType('custom');
                      // Initialize customStyleProperties with row background from Step 1 if empty
                      if (Object.keys(customStyleProperties).length === 0 || (!customStyleProperties.backgroundColor && !customStyleProperties.backgroundImage)) {
                        setCustomStyleProperties({
                          backgroundColor: colorConfig.rowBackgroundColor,
                          backgroundColorOpacity: colorConfig.rowBackgroundColorOpacity ?? 1,
                          backgroundImage: colorConfig.rowBackgroundImage,
                          backgroundImageOpacity: colorConfig.rowBackgroundImageOpacity ?? 1,
                        });
                      }
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
                    <div className="style-popover-list">
                      {curatedStyles.map((style) => {
                        const properties = style.getProperties(themeColors);
                        const isSelected = selectedCuratedStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setSelectedCuratedStyle(style.id as CuratedStyleId)}
                            className={`style-popover-item ${isSelected ? 'active' : ''}`}
                          >
                            <div className="style-popover-item-preview">
                              <StylePreviewInline 
                                properties={properties}
                                themeColors={themeColors}
                                pageBackground={{
                                  backgroundColor: colorConfig.pageBackgroundColor || '#ffffff',
                                  backgroundColorOpacity: colorConfig.pageBackgroundColorOpacity ?? 1,
                                  backgroundImage: colorConfig.pageBackgroundImage,
                                  backgroundImageOpacity: colorConfig.pageBackgroundImageOpacity ?? 1,
                                }}
                                textColors={{
                                  headingColor: colorConfig.headingColor || '#000000',
                                  paragraphColor: colorConfig.paragraphColor || '#272525',
                                  primaryColor: colorConfig.primaryColor || themeColors.accent,
                                }}
                              />
                            </div>
                            <div className="style-popover-item-info">
                              <div className="style-popover-item-name">{style.name}</div>
                              <div className="style-popover-item-description">{style.description}</div>
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
                    colorConfig={colorConfig}
                  />
                )}
              </div>

                </div>
                <div className="theme-editor-footer-sticky">
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
            </div>
            {/* Right Side: Preview - Same as Step 1 but with default row style applied */}
            <div className="theme-editor-preview">
              <div className="theme-preview-header">
                <div className="theme-preview-tabs">
                  <button 
                    className={`theme-preview-tab ${previewTab === 'test' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('test')}
                  >
                    Test page
                  </button>
                  <button 
                    className={`theme-preview-tab ${previewTab === 'current' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('current')}
                  >
                    Current page
                  </button>
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
                      backgroundSize: getBackgroundSize(colorConfig.pageBackgroundImageType),
                      backgroundPosition: 'center',
                      opacity: colorConfig.pageBackgroundImageOpacity ?? 1,
                      zIndex: 0,
                    }}
                  />
                )}
                {previewTab === 'test' ? (
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
                        backgroundSize: getBackgroundSize(rowStyleProps.backgroundImageType || colorConfig.rowBackgroundImageType),
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
                            backgroundSize: getBackgroundSize(colorConfig.cellBackgroundImageType),
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
                            backgroundSize: getBackgroundSize(colorConfig.resourceBackgroundImageType),
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
                            backgroundSize: getBackgroundSize(colorConfig.resourceBackgroundImageType),
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
                            backgroundSize: getBackgroundSize(colorConfig.resourceBackgroundImageType),
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
                ) : (
                  // Current page - render actual canvas content with preview theme CSS variables
                  <div 
                    style={{ 
                      position: 'relative', 
                      zIndex: 1, 
                      padding: '16px', 
                      overflowY: 'auto', 
                      height: '100%',
                      ...(themeToCSSVariables(previewTheme) as React.CSSProperties)
                    }}
                  >
                    {rows && rows.length > 0 ? (
                      rows.map((row) => (
                        <RowView
                          key={row.id}
                          row={row}
                          onUpdateRow={() => {}}
                          onUpdateCell={() => {}}
                          onUpdateBlock={() => {}}
                          onDeleteRow={() => {}}
                          onDeleteCell={() => {}}
                          onDeleteBlock={() => {}}
                          selectedBlockId={null}
                          selectedRowId={null}
                          selectedCellId={null}
                          renderResource={(resource) => {
                            // Render blocks using the same logic as PreviewStage
                            if (resource.type === 'text' || resource.type === 'header') {
                              return (
                                <TextBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isEditing={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                />
                              );
                            }
                            if (resource.type === 'image') {
                              return (
                                <ImageBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                />
                              );
                            }
                            if (resource.type === 'quiz') {
                              return (
                                <QuizBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isEditing={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                />
                              );
                            }
                            if (resource.type === 'columns') {
                              return (
                                <ColumnsBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                  allBlocks={[]}
                                  showStructureStrokes={false}
                                />
                              );
                            }
                            if (resource.type === 'button') {
                              return (
                                <ButtonBlockView
                                  key={resource.id}
                                  block={resource}
                                  isSelected={false}
                                  isPreview={true}
                                  onUpdate={() => {}}
                                  allBlocks={[]}
                                  showStructureStrokes={false}
                                />
                              );
                            }
                            return null;
                          }}
                          activeId={undefined}
                          allBlocks={[]}
                          showStructureStrokes={false}
                        />
                      ))
                    ) : (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#6B6B6B' }}>
                        No content on the page yet. Add some content to see it here.
                      </div>
                    )}
                  </div>
                )}
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
  colorConfig: {
    rowBackgroundColor?: string;
    rowBackgroundColorOpacity?: number;
    rowBackgroundImage?: string;
    rowBackgroundImageOpacity?: number;
  };
}

// Style Preview Component - matches StylePopover's StylePreview
interface StylePreviewInlineProps {
  properties: Partial<ThemeSpecificRowProps>;
  themeColors: { accent: string; surface: string; border: string };
  pageBackground?: {
    backgroundColor?: string;
    backgroundColorOpacity?: number;
    backgroundImage?: string;
    backgroundImageOpacity?: number;
  };
  textColors?: {
    headingColor?: string;
    paragraphColor?: string;
    primaryColor?: string;
  };
}

function StylePreviewInline({ properties, themeColors, pageBackground, textColors }: StylePreviewInlineProps) {
  const hexToRgba = (hex: string, opacity: number = 1): string => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getBoxShadow = (shadow: typeof properties.shadow): string => {
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

  const getBorder = (): string => {
    const border = properties.border;
    if (!border) return 'none';
    const borderWidth = border.width?.mode === 'uniform' ? (border.width?.uniform ?? 0) : 0;
    if (borderWidth > 0) {
      return `${borderWidth}px solid ${border.color || themeColors.border}`;
    }
    return 'none';
  };

  const getBorderRadius = (): string => {
    const borderRadius = properties.borderRadius;
    if (borderRadius?.mode === 'uniform') {
      return `${borderRadius.uniform ?? 0}px`;
    }
    return '8px';
  };

  const rowStyleProps = properties;
  const pageBgColor = pageBackground?.backgroundColor || '#ffffff';
  const pageBgOpacity = pageBackground?.backgroundColorOpacity ?? 1;
  const pageBgImage = pageBackground?.backgroundImage;
  const pageBgImageOpacity = pageBackground?.backgroundImageOpacity ?? 1;
  const pageBgImageType = pageBackground?.backgroundImageType ?? 'fill';
  const headingColor = textColors?.headingColor || '#000000';
  const paragraphColor = textColors?.paragraphColor || '#272525';
  const primaryColor = textColors?.primaryColor || themeColors.accent;

  return (
    <div
      className="style-preview-box"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '4px',
        backgroundColor: hexToRgba(pageBgColor, pageBgOpacity),
      }}
    >
      {pageBgImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${pageBgImage})`,
            backgroundSize: getBackgroundSize(pageBgImageType),
            backgroundPosition: 'center',
            opacity: pageBgImageOpacity,
            zIndex: 0,
          }}
        />
      )}
      <div 
        style={{ 
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          bottom: '16px',
          zIndex: 1,
          transform: 'scale(0.9)',
          transformOrigin: 'center center',
          padding: '8px',
          borderRadius: getBorderRadius(),
          border: getBorder(),
          boxShadow: rowStyleProps.shadow ? getBoxShadow(rowStyleProps.shadow) : undefined,
          backdropFilter: rowStyleProps.bgBlur ? `blur(${rowStyleProps.bgBlur}px)` : undefined,
          WebkitBackdropFilter: rowStyleProps.bgBlur ? `blur(${rowStyleProps.bgBlur}px)` : undefined,
        }}
      >
        {(rowStyleProps.backgroundColor) && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: hexToRgba(
                rowStyleProps.backgroundColor || '#ffffff',
                rowStyleProps.backgroundColorOpacity ?? 1
              ),
              zIndex: 0,
              borderRadius: getBorderRadius(),
              pointerEvents: 'none',
            }}
          />
        )}
        {(rowStyleProps.backgroundImage) && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${rowStyleProps.backgroundImage})`,
              backgroundSize: getBackgroundSize(rowStyleProps.backgroundImageType),
              backgroundPosition: 'center',
              opacity: rowStyleProps.backgroundImageOpacity ?? 1,
              zIndex: 1,
              borderRadius: getBorderRadius(),
              pointerEvents: 'none',
            }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
          <div style={{ position: 'relative', zIndex: 2, padding: '10px', width: '100%' }}>
            <h3 style={{ 
              color: headingColor, 
              position: 'relative', 
              zIndex: 2, 
              margin: 0, 
              marginBottom: '6px', 
              fontSize: '11px', 
              fontWeight: 600,
              lineHeight: '1.2',
            }}>
              This is a theme preview.
            </h3>
            <p style={{ 
              color: paragraphColor, 
              position: 'relative', 
              zIndex: 2, 
              margin: 0, 
              marginBottom: '8px', 
              fontSize: '9px', 
              fontWeight: 400,
              lineHeight: '1.3',
            }}>
              Here's an example of body text. You can change its font and the color. Your accent color will be used for links.
            </p>
            <button
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                fontSize: '9px',
                fontWeight: 500,
              }}
            >
              Primary button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomizeTab({ customStyleProperties = {}, setCustomStyleProperties, themeColors, colorConfig }: CustomizeTabProps) {
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

  // Extract current values - inherit from Step 1 (colorConfig) if not set in customStyleProperties
  const backgroundColor = safeCustomStyleProperties.backgroundColor ?? colorConfig.rowBackgroundColor;
  const backgroundColorOpacity = safeCustomStyleProperties.backgroundColorOpacity ?? colorConfig.rowBackgroundColorOpacity ?? 1;
  const backgroundImage = safeCustomStyleProperties.backgroundImage ?? colorConfig.rowBackgroundImage;
  const backgroundImageOpacity = safeCustomStyleProperties.backgroundImageOpacity ?? colorConfig.rowBackgroundImageOpacity ?? 1;
  // Check if background is explicitly set in customStyleProperties (not just inherited from colorConfig)
  const hasExplicitBackground = safeCustomStyleProperties.backgroundColor !== undefined || safeCustomStyleProperties.backgroundImage !== undefined;

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
      <PanelSection title="Style">
        {/* Fill */}
        <PropertyRow label="Fill">
          <div
            ref={fillPopoverAnchorRef}
            onClick={() => {
              setBorderPopoverOpen(false);
              setShadowPopoverOpen(false);
              setFillPopoverOpen(true);
            }}
            style={{ width: '100%', flex: 1 }}
          >
            <PillSelect
              thumbnail={backgroundImage}
              swatchColor={backgroundColor}
              swatchOpacity={backgroundColorOpacity}
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
        </PropertyRow>

        {/* Radius */}
        <PropertyRow label="Radius">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', flex: 1 }}>
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
        </PropertyRow>

        {/* Border */}
        <PropertyRow label="Border">
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
            style={{ width: '100%', flex: 1 }}
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
        </PropertyRow>

        {/* Shadow */}
        <PropertyRow label="Shadow">
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
            style={{ width: '100%', flex: 1 }}
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
        </PropertyRow>

        {/* BG Blur */}
        <PropertyRow label="BG Blur">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', flex: 1 }}>
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
        </PropertyRow>
      </PanelSection>

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

