import type { Block, TextBlock, HeaderBlock, ImageBlock, QuizBlock, ColumnsBlock, ButtonBlock, Row, Cell, ThemeSpecificCellProps, ThemeSpecificRowProps } from '../types';
import { ImageFillPanel } from './ImageFillPanel';
import { nanoid } from 'nanoid';
import { useTheme, useThemeSwitcher } from '../theme/ThemeProvider';
import type { ThemeId } from '../theme/ThemeProvider';
import { useState, useRef, useEffect, useMemo } from 'react';
import { FillPopover } from './FillPopover';
import { ColorPickerPopover } from './ColorPickerPopover';
import { BorderPopover } from './BorderPopover';
import { PanelSection } from './ui/PanelSection';
import { PropertyRow } from './ui/PropertyRow';
import { SegmentedIconControl } from './ui/SegmentedIconControl';
import { NumberPillInput } from './ui/NumberPillInput';
import { IconButtonGroup } from './ui/IconButtonGroup';
import { PillSelect } from './ui/PillSelect';
import { ShadowPopover, type Shadow } from './ShadowPopover';
import { NumberSliderInput } from './ui/NumberSliderInput';
import { EffectsMenu } from './ui/EffectsMenu';
import { SegmentedTextControl } from './ui/SegmentedTextControl';
import { StylePopover } from './StylePopover';
import { curatedStyles } from '../styles/curatedStyles';

interface PropertiesPanelProps {
  selectedBlock: Block | null;
  selectedRow?: Row | null;
  selectedCell?: Cell | null;
  isPageSelected?: boolean;
  pageProps?: {
    themes?: {
      plain?: {
        backgroundColor?: string;
        backgroundColorOpacity?: number;
        backgroundImage?: string;
        backgroundImageOpacity?: number;
        maxRowWidth?: number;
      };
      neon?: {
        backgroundColor?: string;
        backgroundColorOpacity?: number;
        backgroundImage?: string;
        backgroundImageOpacity?: number;
        maxRowWidth?: number;
      };
      [key: string]: {
        backgroundColor?: string;
        backgroundColorOpacity?: number;
        backgroundImage?: string;
        backgroundImageOpacity?: number;
        maxRowWidth?: number;
      } | undefined;
    };
  };
  onUpdatePageProps?: (props: PropertiesPanelProps['pageProps']) => void;
  onUpdateBlock: (block: Block) => void;
  onUpdateRow?: (row: Row) => void;
  onUpdateCell?: (cell: Cell) => void;
  onDeleteBlock: () => void;
}

// Helper function to get theme-specific cell properties with fallback to legacy props and theme defaults
function getCellThemeProps(cell: Cell, themeId: ThemeId, theme: any): ThemeSpecificCellProps {
  const themeProps = cell.props?.themes?.[themeId];
  const defaultBackground = theme?.cellBackground || { backgroundColor: undefined, backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
  
  // Get theme defaults for padding
  // CSS default is 8px for .row-cells, so use that if theme padding is 0 or undefined
  const themePadding = theme?.cellPadding;
  const defaultPadding = (themePadding && themePadding.uniform !== undefined && themePadding.uniform !== 0)
    ? themePadding
    : { mode: 'uniform' as const, uniform: 8 }; // CSS default is 8px
  
  // If theme-specific props exist, merge with theme defaults for missing background properties
  if (themeProps) {
    return {
      ...themeProps,
      // Use theme defaults if background properties are not set in theme-specific props
      backgroundColor: themeProps.backgroundColor ?? defaultBackground.backgroundColor,
      backgroundColorOpacity: themeProps.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1,
      backgroundImage: themeProps.backgroundImage ?? defaultBackground.backgroundImage,
      backgroundImageOpacity: themeProps.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1,
      // Merge padding defaults if not explicitly set
      padding: themeProps.padding || defaultPadding,
    };
  }
  
  // Fallback to legacy props for backward compatibility
  const legacyProps = {
    verticalAlign: cell.props?.verticalAlign,
    padding: cell.props?.padding || defaultPadding,
    backgroundColor: cell.props?.backgroundColor,
    backgroundColorOpacity: cell.props?.backgroundColorOpacity,
    backgroundImage: cell.props?.backgroundImage,
    backgroundImageOpacity: cell.props?.backgroundImageOpacity,
    border: cell.props?.border,
    borderRadius: cell.props?.borderRadius,
  };
  
  // If no custom background is set, use theme defaults
  if (!legacyProps.backgroundColor && !legacyProps.backgroundImage) {
    return {
      ...legacyProps,
      backgroundColor: defaultBackground.backgroundColor,
      backgroundColorOpacity: defaultBackground.backgroundColorOpacity,
      backgroundImage: defaultBackground.backgroundImage,
      backgroundImageOpacity: defaultBackground.backgroundImageOpacity,
    };
  }
  
  return legacyProps;
}

// Helper function to get theme-specific row properties with fallback to legacy props and theme defaults
function getRowThemeProps(row: Row, themeId: ThemeId, theme: any): ThemeSpecificRowProps {
  // Try to get theme-specific props (works for 'plain', 'neon', and any custom theme ID)
  const themeProps = row.props?.themes?.[themeId];
  
  // Check if row should use default theme style
  // - styleId === null means explicitly using default style
  // - no themeProps at all means row should inherit default style from theme
  const shouldUseDefaultStyle = themeProps?.styleId === null || (!themeProps && theme?.defaultRowStyle);
  
  // If row should use default style, apply it
  if (shouldUseDefaultStyle && theme?.defaultRowStyle) {
    const defaultStyle = theme.defaultRowStyle;
    let defaultStyleProperties: Partial<ThemeSpecificRowProps> = {};
    
    if (defaultStyle.type === 'curated' && defaultStyle.curatedId) {
      // Get curated style properties
      const curatedStyle = curatedStyles.find(s => s.id === defaultStyle.curatedId);
      if (curatedStyle) {
        defaultStyleProperties = curatedStyle.getProperties({
          accent: theme.colors.accent || '#326CF6',
          surface: theme.colors.surface || '#ffffff',
          border: theme.colors.border || '#e0e0e0',
        });
      }
    } else if (defaultStyle.type === 'custom' && defaultStyle.customProperties) {
      defaultStyleProperties = defaultStyle.customProperties;
    }
    
    // Merge default style properties with any existing theme props
    // Always include styleId: null to mark this as default style
    return {
      ...defaultStyleProperties,
      ...themeProps, // Allow theme-specific props to override default style
      styleId: null, // Ensure styleId is set to null to indicate default style
    };
  }
  
  // Get theme defaults for padding
  // CSS default is 8px for .row-cells, so use that if theme padding is 0 or undefined
  const themePadding = theme?.rowPadding;
  const defaultPadding = (themePadding && themePadding.uniform !== undefined && themePadding.uniform !== 0)
    ? themePadding
    : { mode: 'uniform' as const, uniform: 8 }; // CSS default is 8px
  
  // If theme-specific props exist, merge with theme defaults for missing properties
  if (themeProps) {
    return {
      ...themeProps,
      // Merge padding defaults if not explicitly set
      padding: themeProps.padding || defaultPadding,
    };
  }
  
  // Fallback to legacy props for backward compatibility
  return {
    verticalAlign: row.props?.verticalAlign,
    padding: row.props?.padding || defaultPadding,
    backgroundColor: row.props?.backgroundColor,
    backgroundColorOpacity: row.props?.backgroundColorOpacity,
    backgroundImage: row.props?.backgroundImage,
    backgroundImageOpacity: row.props?.backgroundImageOpacity,
    border: row.props?.border,
    borderRadius: row.props?.borderRadius,
  };
}

export function PropertiesPanel({
  selectedBlock,
  selectedRow,
  selectedCell,
  isPageSelected = false,
  pageProps = {},
  onUpdatePageProps,
  onUpdateBlock,
  onUpdateRow,
  onUpdateCell,
  onDeleteBlock,
}: PropertiesPanelProps) {
  const { themeId } = useThemeSwitcher();
  const theme = useTheme(); // Call useTheme at the top level, before any conditional returns
  // Check if selected row is a columns block
  const isColumnsBlockRow = selectedRow?.props?.isColumnsBlock === true;

  // Popover state management - Row
  const [rowFillPopoverAnchor, setRowFillPopoverAnchor] = useState<HTMLElement | null>(null);
  const [rowFillPopoverOpen, setRowFillPopoverOpen] = useState(false);
  const [rowColorPickerOpen, setRowColorPickerOpen] = useState(false);
  const [rowBorderPopoverAnchor, setRowBorderPopoverAnchor] = useState<HTMLElement | null>(null);
  const [rowBorderPopoverOpen, setRowBorderPopoverOpen] = useState(false);
  const rowFillPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const rowBorderPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const rowBorderInitializedRef = useRef(false);
  const isMountedRef = useRef(true);
  
  // Shadow and BG Blur state - Row
  const [rowShadowPopoverAnchor, setRowShadowPopoverAnchor] = useState<HTMLElement | null>(null);
  const [rowShadowPopoverOpen, setRowShadowPopoverOpen] = useState(false);
  const [rowShadowColorPickerOpen, setRowShadowColorPickerOpen] = useState(false);
  const rowShadowPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const rowShadowInitializedRef = useRef(false);
  
  // Effects menu state - Row
  const [rowStyleEffectsMenuOpen, setRowStyleEffectsMenuOpen] = useState(false);
  const [rowStyleEffectsMenuAnchor, setRowStyleEffectsMenuAnchor] = useState<HTMLElement | null>(null);
  const [rowActiveEffects, setRowActiveEffects] = useState<Set<string>>(new Set());
  
  // Effects menu state - Cell (must be at top level)
  const [cellStyleEffectsMenuOpen, setCellStyleEffectsMenuOpen] = useState(false);
  const [cellStyleEffectsMenuAnchor, setCellStyleEffectsMenuAnchor] = useState<HTMLElement | null>(null);
  const [cellActiveEffects, setCellActiveEffects] = useState<Set<string>>(new Set());
  
  // Cell shadow and bgBlur state (must be at top level, not inside conditional block)
  const [cellShadowPopoverAnchor, setCellShadowPopoverAnchor] = useState<HTMLElement | null>(null);
  const [cellShadowPopoverOpen, setCellShadowPopoverOpen] = useState(false);
  const [cellShadowColorPickerOpen, setCellShadowColorPickerOpen] = useState(false);
  const cellShadowPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const cellShadowInitializedRef = useRef(false);
  
  // Style popover state (must be at top level)
  const [rowStylePopoverAnchor, setRowStylePopoverAnchor] = useState<HTMLElement | null>(null);
  const [rowStylePopoverOpen, setRowStylePopoverOpen] = useState(false);
  const rowStylePopoverAnchorRef = useRef<HTMLDivElement>(null);
  
  const [cellStylePopoverAnchor, setCellStylePopoverAnchor] = useState<HTMLElement | null>(null);
  const [cellStylePopoverOpen, setCellStylePopoverOpen] = useState(false);
  const cellStylePopoverAnchorRef = useRef<HTMLDivElement>(null);
  
  // Compute active effects from props (for persistence) - use useMemo to avoid infinite loops
  const computedRowActiveEffects = useMemo(() => {
    if (selectedRow && selectedRow.id) {
      const currentThemeProps = selectedRow.props?.themes?.[themeId];
      const effects = new Set<string>();
      if (currentThemeProps?.shadow !== null && currentThemeProps?.shadow !== undefined) {
        effects.add('Shadows');
      }
      if (currentThemeProps?.bgBlur !== undefined && currentThemeProps.bgBlur > 0) {
        effects.add('BG Blur');
      }
      return effects;
    }
    return new Set<string>();
  }, [selectedRow?.id, themeId, selectedRow?.props?.themes?.[themeId]?.shadow, selectedRow?.props?.themes?.[themeId]?.bgBlur]);
  
  const computedCellActiveEffects = useMemo(() => {
    if (selectedCell && selectedCell.id) {
      const currentThemeProps = selectedCell.props?.themes?.[themeId];
      const effects = new Set<string>();
      if (currentThemeProps?.shadow !== null && currentThemeProps?.shadow !== undefined) {
        effects.add('Shadows');
      }
      if (currentThemeProps?.bgBlur !== undefined && currentThemeProps.bgBlur > 0) {
        effects.add('BG Blur');
      }
      return effects;
    }
    return new Set<string>();
  }, [selectedCell?.id, themeId, selectedCell?.props?.themes?.[themeId]?.shadow, selectedCell?.props?.themes?.[themeId]?.bgBlur]);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Popover state management - Cell
  const [cellFillPopoverAnchor, setCellFillPopoverAnchor] = useState<HTMLElement | null>(null);
  const [cellFillPopoverOpen, setCellFillPopoverOpen] = useState(false);
  const [cellColorPickerOpen, setCellColorPickerOpen] = useState(false);
  const [cellBorderPopoverAnchor, setCellBorderPopoverAnchor] = useState<HTMLElement | null>(null);
  const [cellBorderPopoverOpen, setCellBorderPopoverOpen] = useState(false);
  const cellFillPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const cellBorderPopoverAnchorRef = useRef<HTMLDivElement>(null);
  const cellBorderInitializedRef = useRef(false);


  // Popover state management - Page
  const [pageFillPopoverAnchor, setPageFillPopoverAnchor] = useState<HTMLElement | null>(null);
  const [pageFillPopoverOpen, setPageFillPopoverOpen] = useState(false);
  const [pageColorPickerOpen, setPageColorPickerOpen] = useState(false);
  const pageFillPopoverAnchorRef = useRef<HTMLDivElement>(null);

  // Close all popovers function
  const closeAllPopovers = () => {
    setRowFillPopoverOpen(false);
    setRowColorPickerOpen(false);
    setRowBorderPopoverOpen(false);
    setRowFillPopoverAnchor(null);
    setRowBorderPopoverAnchor(null);
    
    setCellFillPopoverOpen(false);
    setCellColorPickerOpen(false);
    setCellBorderPopoverOpen(false);
    setCellFillPopoverAnchor(null);
    setCellBorderPopoverAnchor(null);
    
    setPageFillPopoverOpen(false);
    setPageColorPickerOpen(false);
    setPageFillPopoverAnchor(null);
  };

  // Close all popovers when selection changes
  const prevSelectionRef = useRef<{ rowId?: string; cellId?: string; blockId?: string; isPage?: boolean }>({});
  useEffect(() => {
    const currentSelection = {
      rowId: selectedRow?.id,
      cellId: selectedCell?.id,
      blockId: selectedBlock?.id,
      isPage: isPageSelected,
    };
    
    const prevSelection = prevSelectionRef.current;
    const selectionChanged = 
      prevSelection.rowId !== currentSelection.rowId ||
      prevSelection.cellId !== currentSelection.cellId ||
      prevSelection.blockId !== currentSelection.blockId ||
      prevSelection.isPage !== currentSelection.isPage;
    
    if (selectionChanged && (prevSelection.rowId || prevSelection.cellId || prevSelection.blockId || prevSelection.isPage)) {
      // Only close if we had a previous selection (not on initial mount)
      closeAllPopovers();
    }
    
    prevSelectionRef.current = currentSelection;
  }, [selectedRow?.id, selectedCell?.id, selectedBlock?.id, isPageSelected]);

  // Handle ESC key to close all popovers
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllPopovers();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []); // Empty deps - closeAllPopovers is stable (only calls setters)

  // Initialize rowActiveEffects from selectedRow props (for persistence)
  // Must be at top level, not inside conditional block
  useEffect(() => {
    if (selectedRow && selectedRow.id) {
      const currentThemeProps = selectedRow.props?.themes?.[themeId];
      const hasShadow = currentThemeProps?.shadow !== null && currentThemeProps?.shadow !== undefined;
      const hasBgBlur = currentThemeProps?.bgBlur !== undefined && currentThemeProps.bgBlur > 0;
      
      setRowActiveEffects(prev => {
        const newEffects = new Set<string>();
        if (hasShadow) newEffects.add('Shadows');
        if (hasBgBlur) newEffects.add('BG Blur');
        
        // Only update if the effects have actually changed
        const prevArray = Array.from(prev).sort();
        const newArray = Array.from(newEffects).sort();
        if (prevArray.length !== newArray.length || prevArray.some((val, i) => val !== newArray[i])) {
          return newEffects;
        }
        return prev;
      });
    } else {
      // Reset when no row is selected
      setRowActiveEffects(prev => {
        if (prev.size > 0) {
          return new Set();
        }
        return prev;
      });
    }
  }, [selectedRow?.id, themeId, selectedRow?.props?.themes?.[themeId]?.shadow, selectedRow?.props?.themes?.[themeId]?.bgBlur]);

  // Initialize cellActiveEffects from selectedCell props (for persistence)
  // Must be at top level, not inside conditional block
  useEffect(() => {
    if (selectedCell && selectedCell.id) {
      const currentThemeProps = selectedCell.props?.themes?.[themeId];
      const hasShadow = currentThemeProps?.shadow !== null && currentThemeProps?.shadow !== undefined;
      const hasBgBlur = currentThemeProps?.bgBlur !== undefined && currentThemeProps.bgBlur > 0;
      
      setCellActiveEffects(prev => {
        const newEffects = new Set<string>();
        if (hasShadow) newEffects.add('Shadows');
        if (hasBgBlur) newEffects.add('BG Blur');
        
        // Only update if the effects have actually changed
        const prevArray = Array.from(prev).sort();
        const newArray = Array.from(newEffects).sort();
        if (prevArray.length !== newArray.length || prevArray.some((val, i) => val !== newArray[i])) {
          return newEffects;
        }
        return prev;
      });
    } else {
      // Reset when no cell is selected
      setCellActiveEffects(prev => {
        if (prev.size > 0) {
          return new Set();
        }
        return prev;
      });
    }
  }, [selectedCell?.id, themeId, selectedCell?.props?.themes?.[themeId]?.shadow, selectedCell?.props?.themes?.[themeId]?.bgBlur]);

  // Page properties panel - shown when page is selected (and not a row, cell, or block)
  if (isPageSelected && !selectedRow && !selectedCell && !selectedBlock && onUpdatePageProps) {
    const defaultPageBackground = theme.pageBackground || { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1, backgroundImageType: 'fill' };
    
    // Get theme-specific page properties
    const themePageProps = pageProps?.themes?.[themeId] || {};
    const backgroundColor = themePageProps.backgroundColor ?? defaultPageBackground.backgroundColor;
    const backgroundColorOpacity = themePageProps.backgroundColorOpacity ?? defaultPageBackground.backgroundColorOpacity ?? 1;
    const backgroundImage = themePageProps.backgroundImage ?? defaultPageBackground.backgroundImage;
    const backgroundImageOpacity = themePageProps.backgroundImageOpacity ?? defaultPageBackground.backgroundImageOpacity ?? 1;
    const backgroundImageType = themePageProps.backgroundImageType ?? defaultPageBackground.backgroundImageType ?? 'fill';
    // Check if color/image is explicitly set (can be removed) vs just theme default
    const hasExplicitBackground = themePageProps.backgroundColor !== undefined || themePageProps.backgroundImage !== undefined;
    // maxRowWidth: null = full width, 1024 = 1024px max width, undefined = default (1024)
    const maxRowWidth = themePageProps.maxRowWidth;
    const isFullWidth = maxRowWidth === null;

    const handleUpdatePageThemeProps = (updates: Partial<typeof themePageProps>) => {
      if (!onUpdatePageProps) return;
      onUpdatePageProps({
        themes: {
          ...(pageProps?.themes || {}),
          [themeId]: {
            ...themePageProps,
            ...updates,
          },
        },
      });
    };

    const handleBackgroundColorChange = (color: string | undefined) => {
      if (color) {
        handleUpdatePageThemeProps({ 
          backgroundColor: color,
          backgroundImage: undefined, // Clear image when setting color
        });
      } else {
        handleUpdatePageThemeProps({ backgroundColor: undefined });
      }
    };

    const handleBackgroundColorOpacityChange = (opacity: number) => {
      handleUpdatePageThemeProps({ backgroundColorOpacity: opacity });
    };

    const handleBackgroundImageChange = (url: string) => {
      if (url) {
        handleUpdatePageThemeProps({ 
          backgroundImage: url,
          backgroundColor: undefined, // Clear color when setting image
        });
      } else {
        handleUpdatePageThemeProps({ backgroundImage: undefined });
      }
    };

    const handleBackgroundImageTypeChange = (type: string) => {
      const imageType = type === 'Fill' ? 'fill' : type === 'Fit' ? 'fit' : type === 'Stretch' ? 'stretch' : 'fill';
      handleUpdatePageThemeProps({ backgroundImageType: imageType as 'fill' | 'fit' | 'stretch' });
    };

    const handleBackgroundImageOpacityChange = (opacity: number) => {
      handleUpdatePageThemeProps({ backgroundImageOpacity: opacity });
    };

    const handleClearBackground = () => {
      handleUpdatePageThemeProps({
        backgroundColor: undefined,
        backgroundImage: undefined,
      });
    };

    const handleMaxRowWidthChange = (value: string) => {
      // Map "no" to null (full width), "yes" to 1024
      handleUpdatePageThemeProps({ maxRowWidth: value === 'no' ? null : (value === 'yes' ? 1024 : undefined) });
    };
    
    const constrainValue = isFullWidth ? 'no' : 'yes';

    const handleResetBackground = () => {
      handleUpdatePageThemeProps({
        backgroundColor: defaultPageBackground.backgroundColor,
        backgroundColorOpacity: defaultPageBackground.backgroundColorOpacity,
        backgroundImage: defaultPageBackground.backgroundImage,
        backgroundImageOpacity: defaultPageBackground.backgroundImageOpacity,
        maxRowWidth: 1024, // Reset to default
      });
    };

    return (
      <div className="properties-panel ui-properties-panel">
        <div className="properties-content">
          <PanelSection title="Constrain centrally">
            <PropertyRow label="Constrain">
              <SegmentedTextControl
                value={constrainValue}
                segments={[
                  { value: 'no', label: 'No' },
                  { value: 'yes', label: 'Yes' },
                ]}
                onChange={handleMaxRowWidthChange}
              />
            </PropertyRow>
          </PanelSection>

          <PanelSection title="Style">
            <PropertyRow label="Fill">
                <div
                  ref={pageFillPopoverAnchorRef}
                  onClick={() => {
                    const anchor = pageFillPopoverAnchorRef.current;
                    if (anchor) {
                      setPageFillPopoverAnchor(anchor);
                      setPageFillPopoverOpen(true);
                    }
                  }}
                style={{ width: '100%', flex: 1 }}
              >
                <PillSelect
                  thumbnail={backgroundImage}
                  swatchColor={backgroundColor}
                  text={backgroundImage ? 'Image' : backgroundColor ? backgroundColor.toUpperCase() : 'Add...'}
                  onClick={() => {}}
                  onClear={(e) => {
                        e.stopPropagation();
                        handleClearBackground();
                        setPageFillPopoverOpen(false);
                      }}
                  showClear={hasExplicitBackground}
                />
                </div>
            </PropertyRow>
          </PanelSection>

              <FillPopover
                isOpen={pageFillPopoverOpen}
                onClose={() => setPageFillPopoverOpen(false)}
                anchorElement={pageFillPopoverAnchor}
                fillType={backgroundImage ? 'image' : backgroundColor ? 'color' : 'color'}
                imageUrl={backgroundImage}
                imageType={backgroundImageType === 'fill' ? 'Fill' : backgroundImageType === 'fit' ? 'Fit' : 'Stretch'}
                color={backgroundColor}
                onImageUrlChange={(url) => {
                  handleBackgroundImageChange(url);
                }}
                onImageTypeChange={handleBackgroundImageTypeChange}
                onImageDescriptionChange={() => {}}
                onColorChange={(color) => {
                  handleBackgroundColorChange(color);
                }}
                opacity={backgroundColorOpacity}
                onOpacityChange={handleBackgroundColorOpacityChange}
              />
        </div>
      </div>
    );
  }

  // Row properties panel - shown when a row is selected (and not a cell or block)
  // Row properties mirror cell properties: vertical alignment, padding, and background
  // All properties are theme-level configurable with defaults
  if (selectedRow && !selectedCell && !selectedBlock && !isColumnsBlockRow && onUpdateRow) {
    // CSS default is 8px for .row-cells, so use that if theme padding is 0 or undefined
    const themePadding = theme.rowPadding;
    const defaultPadding = (themePadding && themePadding.uniform !== undefined && themePadding.uniform !== 0)
      ? themePadding
      : { mode: 'uniform' as const, uniform: 8 }; // CSS default is 8px
    const defaultBackground = theme.rowBackground || { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1, backgroundImageType: 'fill' };
    const defaultBorder = theme.rowBorder || { color: undefined, width: { mode: 'uniform', uniform: 0 }, style: 'solid' };
    const defaultBorderRadius = theme.rowBorderRadius || { mode: 'uniform', uniform: 0 };
    
    // Get theme-specific properties (pass theme to apply default style if needed)
    const themeProps = getRowThemeProps(selectedRow, themeId, theme);
    const rowThemeProps = selectedRow.props?.themes?.[themeId];
    
    const verticalAlign = themeProps.verticalAlign || 'top';
    // Use padding from themeProps if it exists and has a non-zero value, otherwise use defaultPadding (8px)
    const padding = (themeProps.padding && (
      (themeProps.padding.mode === 'uniform' && themeProps.padding.uniform !== undefined && themeProps.padding.uniform !== 0) ||
      (themeProps.padding.mode === 'individual' && (themeProps.padding.top || themeProps.padding.right || themeProps.padding.bottom || themeProps.padding.left))
    )) ? themeProps.padding : defaultPadding;
    const backgroundColor = themeProps.backgroundColor ?? defaultBackground.backgroundColor;
    const backgroundColorOpacity = themeProps.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1;
    const backgroundImage = themeProps.backgroundImage ?? defaultBackground.backgroundImage;
    const backgroundImageOpacity = themeProps.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1;
    const backgroundImageType = themeProps.backgroundImageType ?? defaultBackground.backgroundImageType ?? 'fill';
    // Check if color/image is explicitly set (can be removed) vs just theme default
    const hasExplicitBackground = rowThemeProps?.backgroundColor !== undefined || rowThemeProps?.backgroundImage !== undefined || 
                                   selectedRow.props?.backgroundColor !== undefined || selectedRow.props?.backgroundImage !== undefined;
    const border = themeProps.border || defaultBorder;
    const borderWidth = border.width || defaultBorder.width || { mode: 'uniform', uniform: 0 };
    const borderWidthMode = borderWidth.mode || defaultBorder.width?.mode || 'uniform';
    const uniformBorderWidth = borderWidth.uniform ?? defaultBorder.width?.uniform ?? 0;
    const topBorderWidth = borderWidth.top ?? defaultBorder.width?.top ?? 0;
    const rightBorderWidth = borderWidth.right ?? defaultBorder.width?.right ?? 0;
    const bottomBorderWidth = borderWidth.bottom ?? defaultBorder.width?.bottom ?? 0;
    const leftBorderWidth = borderWidth.left ?? defaultBorder.width?.left ?? 0;
    // Only show border color if border width is > 0 (border is actually visible)
    const hasVisibleBorder = borderWidthMode === 'uniform' 
      ? uniformBorderWidth > 0 
      : topBorderWidth > 0 || rightBorderWidth > 0 || bottomBorderWidth > 0 || leftBorderWidth > 0;
    const themePrimaryColor = theme?.colors?.accent || '#326CF6';
    // Always use a stable color value for preview - use border color if set, otherwise theme primary
    const borderColorForPreview = border.color ?? defaultBorder.color ?? themePrimaryColor;
    // Only show border color if border width is > 0 (border is actually visible)
    const borderColor = hasVisibleBorder ? borderColorForPreview : themePrimaryColor;
    const borderStyle = border.style || defaultBorder.style || 'solid';
    const borderRadius = themeProps.borderRadius || defaultBorderRadius;
    const borderRadiusMode = borderRadius.mode || defaultBorderRadius.mode || 'uniform';
    const uniformBorderRadius = borderRadius.uniform ?? defaultBorderRadius.uniform ?? 0;
    const topLeftRadius = borderRadius.topLeft ?? defaultBorderRadius.topLeft ?? 0;
    const topRightRadius = borderRadius.topRight ?? defaultBorderRadius.topRight ?? 0;
    const bottomRightRadius = borderRadius.bottomRight ?? defaultBorderRadius.bottomRight ?? 0;
    const bottomLeftRadius = borderRadius.bottomLeft ?? defaultBorderRadius.bottomLeft ?? 0;
    const paddingMode = padding.mode || defaultPadding.mode || 'uniform';
    const uniformPadding = padding.uniform ?? defaultPadding.uniform ?? 0;
    const topPadding = padding.top ?? defaultPadding.top ?? 0;
    const rightPadding = padding.right ?? defaultPadding.right ?? 0;
    const bottomPadding = padding.bottom ?? defaultPadding.bottom ?? 0;
    const leftPadding = padding.left ?? defaultPadding.left ?? 0;
    
    // Shadow and BG Blur
    const shadow = themeProps.shadow ?? null;
    const bgBlur = themeProps.bgBlur ?? 0;
    const hasShadow = shadow !== null;
    
    // Style - use rowThemeProps directly for styleId to get the actual stored value
    // themeProps might be computed and could override the stored styleId
    const actualStyleId = rowThemeProps?.styleId; // Get styleId directly from row props
    const styleId = actualStyleId !== undefined ? actualStyleId : themeProps.styleId; // Fallback to computed if not set
    const hasStyle = styleId !== undefined; // true if a style is applied (default or custom)
    const isDefaultStyle = styleId === null; // true if default style is applied
    const isCustomStyle = styleId !== null && styleId !== undefined; // true if curated/custom style is applied
    
    // Get default style name if it's a curated style
    const getDefaultStyleName = (): string => {
      if (!theme?.defaultRowStyle) return 'Default';
      const defaultStyle = theme.defaultRowStyle;
      if (defaultStyle.type === 'curated' && defaultStyle.curatedId) {
        const curatedStyle = curatedStyles.find(s => s.id === defaultStyle.curatedId);
        return curatedStyle?.name || 'Default';
      }
      return 'Default';
    };
    const defaultStyleName = getDefaultStyleName();

    // Helper to update theme-specific row properties
    const handleUpdateRowThemeProps = (updates: Partial<ThemeSpecificRowProps>) => {
      if (!onUpdateRow || !selectedRow || !isMountedRef.current) return;
      try {
        const currentThemeProps = selectedRow.props?.themes?.[themeId] || {};
        // If updates contains styleId, use it (for style selection)
        // Otherwise, preserve styleId from computed themeProps or current props
        // This ensures that when updating properties like verticalAlign, padding, etc.,
        // the styleId is not lost (especially important for default styles where styleId: null)
        const styleIdToUse = updates.styleId !== undefined 
          ? updates.styleId 
          : (themeProps.styleId !== undefined ? themeProps.styleId : currentThemeProps.styleId);
        onUpdateRow({
          ...selectedRow,
          props: {
            ...selectedRow.props,
            themes: {
              ...selectedRow.props?.themes,
              [themeId]: {
                ...currentThemeProps,
                ...updates,
                // Use the determined styleId
                ...(styleIdToUse !== undefined ? { styleId: styleIdToUse } : {}),
              },
            },
          },
        });
      } catch (error) {
        console.error('Error updating row theme props:', error);
      }
    };

    const handleUpdateRow = (updates: Partial<Row>) => {
      if (!onUpdateRow) return;
      onUpdateRow({
        ...selectedRow,
        ...updates,
        props: {
          ...selectedRow.props,
          ...(updates.props || {}),
        },
      });
    };

    const handlePaddingModeChange = (mode: 'uniform' | 'individual') => {
      handleUpdateRowThemeProps({
        padding: {
          ...padding,
          mode,
          uniform: mode === 'uniform' ? (topPadding || 0) : padding.uniform,
        },
      });
    };

    const handleUniformPaddingChange = (value: number) => {
      handleUpdateRowThemeProps({
        padding: {
          ...padding,
          uniform: value,
          mode: 'uniform',
        },
      });
    };

    const handleIndividualPaddingChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
      handleUpdateRowThemeProps({
        padding: {
          ...padding,
          [side]: value,
          mode: 'individual',
        },
      });
    };

    const handleResetPadding = () => {
      handleUpdateRowThemeProps({
        padding: defaultPadding,
      });
    };

    const handleBackgroundColorChange = (value: string | undefined) => {
      if (value) {
        handleUpdateRowThemeProps({
          backgroundColor: value,
          backgroundImage: undefined, // Clear image when setting color
        });
      } else {
        handleUpdateRowThemeProps({
          backgroundColor: undefined,
        });
      }
    };

    const handleBackgroundColorOpacityChange = (value: number) => {
      handleUpdateRowThemeProps({
        backgroundColorOpacity: value,
      });
    };

    const handleBackgroundImageChange = (value: string) => {
      if (value) {
        handleUpdateRowThemeProps({
          backgroundImage: value,
          backgroundColor: undefined, // Clear color when setting image
        });
      } else {
        handleUpdateRowThemeProps({
          backgroundImage: undefined,
        });
      }
    };

    const handleBackgroundImageTypeChange = (type: string) => {
      const imageType = type === 'Fill' ? 'fill' : type === 'Fit' ? 'fit' : type === 'Stretch' ? 'stretch' : 'fill';
      handleUpdateRowThemeProps({ backgroundImageType: imageType as 'fill' | 'fit' | 'stretch' });
    };

    const handleClearBackground = () => {
      handleUpdateRowThemeProps({
        backgroundColor: undefined,
        backgroundImage: undefined,
      });
    };

    const handleBackgroundImageOpacityChange = (value: number) => {
      handleUpdateRowThemeProps({
        backgroundImageOpacity: value,
      });
    };

    const handleResetBackground = () => {
      handleUpdateRowThemeProps({
        backgroundColor: defaultBackground.backgroundColor,
        backgroundColorOpacity: defaultBackground.backgroundColorOpacity,
        backgroundImage: defaultBackground.backgroundImage,
        backgroundImageOpacity: defaultBackground.backgroundImageOpacity,
      });
    };

    const handleBorderColorChange = (value: string) => {
      // Initialize border if it doesn't exist when user changes color
      if (!hasVisibleBorder && !rowBorderInitializedRef.current) {
        rowBorderInitializedRef.current = true;
        handleUpdateRowThemeProps({
          border: {
            color: value || themePrimaryColor,
            width: { mode: 'uniform', uniform: 2 },
            style: 'solid',
          },
        });
      } else {
        handleUpdateRowThemeProps({
          border: {
            ...border,
            color: value || undefined,
            // Ensure style is set when color is set
            style: border.style || borderStyle || 'solid',
            // Ensure width is set when color is set
            width: border.width || { mode: 'uniform', uniform: 2 },
          },
        });
      }
    };

    const handleBorderWidthModeChange = (mode: 'uniform' | 'individual') => {
      handleUpdateRowThemeProps({
        border: {
          ...border,
          // Ensure color is set if width is being set (use current color or theme primary)
          color: border.color || borderColor || themePrimaryColor,
          width: {
            ...borderWidth,
            mode,
            uniform: mode === 'uniform' ? (topBorderWidth || 0) : borderWidth.uniform,
          },
        },
      });
    };

    const handleUniformBorderWidthChange = (value: number) => {
      handleUpdateRowThemeProps({
        border: {
          ...border,
          // Ensure color is set if width is being set (use current color or theme primary)
          color: border.color || borderColor || themePrimaryColor,
          width: {
            ...borderWidth,
            uniform: value,
            mode: 'uniform',
          },
        },
      });
    };

    const handleIndividualBorderWidthChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
      handleUpdateRowThemeProps({
        border: {
          ...border,
          // Ensure color is set if width is being set (use current color or theme primary)
          color: border.color || borderColor || themePrimaryColor,
          width: {
            ...borderWidth,
            [side]: value,
            mode: 'individual',
          },
        },
      });
    };

    const handleBorderStyleChange = (value: 'solid' | 'dashed' | 'dotted' | 'double') => {
      handleUpdateRowThemeProps({
        border: {
          ...border,
          style: value,
        },
      });
    };

    const handleResetBorder = () => {
      handleUpdateRowThemeProps({
        border: defaultBorder,
      });
    };
    
    // Shadow handlers
    const handleShadowChange = (newShadow: Shadow | null) => {
      handleUpdateRowThemeProps({
        shadow: newShadow,
      });
    };
    
    const handleResetShadow = () => {
      // Only remove shadow from canvas, keep the row visible
      handleUpdateRowThemeProps({
        shadow: null,
      });
      // Remove from active effects
      setRowActiveEffects(prev => {
        const next = new Set(prev);
        next.delete('Shadows');
        return next;
      });
    };
    
    // BG Blur handlers
    const handleBgBlurChange = (value: number) => {
      handleUpdateRowThemeProps({
        bgBlur: value,
      });
    };
    
    const handleResetBgBlur = () => {
      handleUpdateRowThemeProps({
        bgBlur: 0,
      });
      // Remove from active effects
      setRowActiveEffects(prev => {
        const next = new Set(prev);
        next.delete('BG Blur');
        return next;
      });
    };
    
    // Effects menu handlers
    const handleAddEffect = (button: HTMLElement) => {
      setRowStyleEffectsMenuAnchor(button);
      setRowStyleEffectsMenuOpen(true);
    };
    
    const handleSelectEffect = (effect: string) => {
      setRowActiveEffects(prev => {
        const next = new Set(prev);
        next.add(effect);
        return next;
      });
      
      // Initialize default values for new effects
      if (effect === 'Shadows') {
        // Don't initialize shadow yet - it will be initialized when "Add..." is clicked
      } else if (effect === 'BG Blur') {
        handleBgBlurChange(10); // Default blur value
      }
    };
    
    // Calculate available effects (must be after all handlers and before return)
    const availableEffects = ['Shadows', 'BG Blur'].filter(effect => !rowActiveEffects.has(effect));
    
    // Style handlers
    const handleStyleSelect = (selectedStyleId: string | null) => {
      // selectedStyleId: null = default, string = curated/custom style ID
      if (selectedStyleId === null) {
        // Apply default style - we'll need to get default style properties from theme
        // For now, just set styleId to null
        handleUpdateRowThemeProps({
          styleId: null,
        });
      } else {
        // Apply curated or custom style
        // Get style properties and apply them
        const curatedStyle = curatedStyles.find(s => s.id === selectedStyleId);
        if (curatedStyle) {
          const styleProperties = curatedStyle.getProperties({
            accent: themePrimaryColor,
            surface: theme.colors.surface || '#ffffff',
            border: theme.colors.border || '#e0e0e0',
          });
          handleUpdateRowThemeProps({
            styleId: selectedStyleId,
            ...styleProperties,
          });
        } else {
          // Custom style - would need to look up from availableStyles
          // For now, just set the styleId
          handleUpdateRowThemeProps({
            styleId: selectedStyleId,
          });
        }
      }
    };
    
    const handleClearStyle = () => {
      // Clear style - remove styleId but keep all current property values
      // This breaks apart the style to show individual properties
      // We need to save the current computed properties (which may come from default style) to the row
      if (!onUpdateRow || !selectedRow || !isMountedRef.current) return;
      try {
        // Get the current computed properties (from themeProps, which includes default style)
        // Exclude styleId from the properties to save
        const { styleId, ...propertiesToSave } = themeProps;
        
        // Save these properties to the row and remove styleId
        onUpdateRow({
          ...selectedRow,
          props: {
            ...selectedRow.props,
            themes: {
              ...selectedRow.props?.themes,
              [themeId]: {
                ...propertiesToSave,
                styleId: undefined, // Remove style binding, show individual properties
              },
            },
          },
        });
      } catch (error) {
        console.error('Error clearing style:', error);
      }
    };
    
    // Get available styles (curated + custom)
    const availableStyles: Array<{ id: string; name: string; isGlobal?: boolean; themeId?: string; properties: Partial<ThemeSpecificRowProps> }> = [];
    // TODO: Load custom styles from theme or global storage
    // For now, only curated styles are available

    const handleBorderRadiusModeChange = (mode: 'uniform' | 'individual') => {
      handleUpdateRowThemeProps({
        borderRadius: {
          ...borderRadius,
          mode,
          uniform: mode === 'uniform' ? (topLeftRadius || 0) : borderRadius.uniform,
        },
      });
    };

    const handleUniformBorderRadiusChange = (value: number) => {
      handleUpdateRowThemeProps({
        borderRadius: {
          ...borderRadius,
          uniform: value,
          mode: 'uniform',
        },
      });
    };

    const handleIndividualBorderRadiusChange = (corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft', value: number) => {
      handleUpdateRowThemeProps({
        borderRadius: {
          ...borderRadius,
          [corner]: value,
          mode: 'individual',
        },
      });
    };

    const handleResetBorderRadius = () => {
      handleUpdateRowThemeProps({
        borderRadius: defaultBorderRadius,
      });
    };

    // Align icons - larger size for better visibility
    const alignTopIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 10" style={{ width: '16px', height: '16px' }}>
        <path d="M 0 0.75 C 0 0.336 0.336 0 0.75 0 L 13.25 0 C 13.664 0 14 0.336 14 0.75 L 14 0.75 C 14 1.164 13.664 1.5 13.25 1.5 L 0.75 1.5 C 0.336 1.5 0 1.164 0 0.75 Z" fill="currentColor"></path>
        <path d="M 4 5 C 4 3.895 4.895 3 6 3 L 8 3 C 9.105 3 10 3.895 10 5 L 10 8 C 10 9.105 9.105 10 8 10 L 6 10 C 4.895 10 4 9.105 4 8 Z" fill="currentColor"></path>
                </svg>
    );
    const alignMiddleIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 14" style={{ width: '16px', height: '16px' }}>
        <path d="M 0 6.75 C 0 6.336 0.336 6 0.75 6 L 15.25 6 C 15.664 6 16 6.336 16 6.75 L 16 6.75 C 16 7.164 15.664 7.5 15.25 7.5 L 0.75 7.5 C 0.336 7.5 0 7.164 0 6.75 Z" fill="currentColor"></path>
        <path d="M 5 3.5 C 5 2.395 5.895 1.5 7 1.5 L 9 1.5 C 10.105 1.5 11 2.395 11 3.5 L 11 10 C 11 11.105 10.105 12 9 12 L 7 12 C 5.895 12 5 11.105 5 10 Z" fill="currentColor"></path>
                        </svg>
    );
    const alignBottomIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 10" style={{ width: '16px', height: '16px' }}>
        <path d="M 0 9.25 C 0 8.836 0.336 8.5 0.75 8.5 L 13.25 8.5 C 13.664 8.5 14 8.836 14 9.25 L 14 9.25 C 14 9.664 13.664 10 13.25 10 L 0.75 10 C 0.336 10 0 9.664 0 9.25 Z" fill="currentColor"></path>
        <path d="M 4 2 C 4 0.895 4.895 0 6 0 L 8 0 C 9.105 0 10 0.895 10 2 L 10 5 C 10 6.105 9.105 7 8 7 L 6 7 C 4.895 7 4 6.105 4 5 Z" fill="currentColor"></path>
                        </svg>
    );

    // Link/unlink icons - larger size for better visibility
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

    return (
      <div className="properties-panel ui-properties-panel">
        <div className="properties-content">
          <PanelSection 
            title="Style" 
            showAddButton={availableEffects.length > 0}
            onAddEffect={handleAddEffect}
          >
            <PropertyRow label="Style">
              <div
                ref={rowStylePopoverAnchorRef}
                onClick={() => {
                  const anchor = rowStylePopoverAnchorRef.current;
                  if (anchor) {
                    // Close other popovers first
                    setRowFillPopoverOpen(false);
                    setRowBorderPopoverOpen(false);
                    setRowColorPickerOpen(false);
                    setRowShadowPopoverOpen(false);
                    setRowStylePopoverAnchor(anchor);
                    setRowStylePopoverOpen(true);
                  }
                }}
                style={{ width: '100%', flex: 1 }}
              >
                <PillSelect
                  thumbnail={undefined}
                  swatchColor={hasStyle ? '#326CF6' : '#CBCBCB'}
                  text={isDefaultStyle ? defaultStyleName : isCustomStyle ? (curatedStyles.find(s => s.id === styleId)?.name || 'Style') : 'Select...'}
                  onClick={() => {}}
                  onClear={(e) => {
                    e.stopPropagation();
                    handleClearStyle();
                    setRowStylePopoverOpen(false);
                  }}
                  showClear={hasStyle}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                      width="16"
                      height="16"
                    >
                      <path fill="currentColor" d="M464 258.2c0 2.7-1 5.2-4.2 8c-3.8 3.1-10.1 5.8-17.8 5.8H344c-53 0-96 43-96 96c0 6.8 .7 13.4 2.1 19.8c3.3 15.7 10.2 31.1 14.4 40.6l0 0c.7 1.6 1.4 3 1.9 4.3c5 11.5 5.6 15.4 5.6 17.1c0 5.3-1.9 9.5-3.8 11.8c-.9 1.1-1.6 1.6-2 1.8c-.3 .2-.8 .3-1.6 .4c-2.9 .1-5.7 .2-8.6 .2C141.1 464 48 370.9 48 256S141.1 48 256 48s208 93.1 208 208c0 .7 0 1.4 0 2.2zm48 .5c0-.9 0-1.8 0-2.7C512 114.6 397.4 0 256 0S0 114.6 0 256S114.6 512 256 512c3.5 0 7.1-.1 10.6-.2c31.8-1.3 53.4-30.1 53.4-62c0-14.5-6.1-28.3-12.1-42c-4.3-9.8-8.7-19.7-10.8-29.9c-.7-3.2-1-6.5-1-9.9c0-26.5 21.5-48 48-48h97.9c36.5 0 69.7-24.8 70.1-61.3zM160 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm128-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm64 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"></path>
                </svg>
                  }
                />
            </div>
            </PropertyRow>
            
            {/* Only show individual properties when no style is applied (styleId is undefined) */}
            {styleId === undefined && (
              <>
            <PropertyRow label="Fill">
                <div
                  ref={rowFillPopoverAnchorRef}
                  onClick={() => {
                    const anchor = rowFillPopoverAnchorRef.current;
                    if (anchor) {
                      // Close other popovers first
                      setRowBorderPopoverOpen(false);
                      setRowColorPickerOpen(false);
                      setRowShadowPopoverOpen(false);
                      setRowShadowColorPickerOpen(false);
                      setRowStylePopoverOpen(false);
                      setRowFillPopoverAnchor(anchor);
                      setRowFillPopoverOpen(true);
                    }
                  }}
                  style={{ width: '100%', flex: 1 }}
                >
                <PillSelect
                  thumbnail={backgroundImage}
                  swatchColor={backgroundColor}
                  text={backgroundImage ? 'Image' : backgroundColor ? backgroundColor.toUpperCase() : 'Add...'}
                  onClick={() => {}}
                  onClear={(e) => {
                        e.stopPropagation();
                        handleClearBackground();
                        setRowFillPopoverOpen(false);
                      }}
                  showClear={hasExplicitBackground}
                      />
                    </div>
            </PropertyRow>

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

            <PropertyRow label="Border">
              <div
                ref={rowBorderPopoverAnchorRef}
                  onClick={() => {
                  const anchor = rowBorderPopoverAnchorRef.current;
                    if (anchor) {
                    // Close other popovers first
                    setRowFillPopoverOpen(false);
                    setRowColorPickerOpen(false);
                    setRowShadowPopoverOpen(false);
                    setRowShadowColorPickerOpen(false);
                    setRowBorderPopoverAnchor(anchor);
                    if (!hasVisibleBorder && !rowBorderInitializedRef.current && selectedRow) {
                      rowBorderInitializedRef.current = true;
                      handleUpdateRowThemeProps({
                        border: {
                          color: themePrimaryColor,
                          width: { mode: 'uniform', uniform: 2 },
                          style: 'solid',
                        },
                      });
                    }
                    setRowBorderPopoverOpen(true);
                  }
                }}
                style={{ width: '100%', flex: 1 }}
              >
                <PillSelect
                  swatchColor={hasVisibleBorder || rowBorderPopoverOpen ? (borderColorForPreview || themePrimaryColor) : '#CBCBCB'}
                  text={hasVisibleBorder || rowBorderPopoverOpen ? (borderStyle || 'solid') : 'Add...'}
                  onClick={() => {}}
                  onClear={(e) => {
                    e.stopPropagation();
                    handleResetBorder();
                    setRowBorderPopoverOpen(false);
                  }}
                  showClear={hasVisibleBorder || rowBorderPopoverOpen}
                />
                      </div>
            </PropertyRow>
            
            {rowActiveEffects.has('Shadows') && (
              <PropertyRow label="Shadow">
                <div
                  ref={rowShadowPopoverAnchorRef}
                  onClick={() => {
                    const anchor = rowShadowPopoverAnchorRef.current;
                    if (anchor) {
                      // Close other popovers first
                      setRowFillPopoverOpen(false);
                      setRowBorderPopoverOpen(false);
                      setRowColorPickerOpen(false);
                      setRowShadowPopoverAnchor(anchor);
                      // Initialize shadow if it's empty (showing "Add...")
                      if (!hasShadow && !rowShadowInitializedRef.current) {
                        rowShadowInitializedRef.current = true;
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
                      setRowShadowPopoverOpen(true);
                    }
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
            )}
            
            {rowActiveEffects.has('BG Blur') && (
              <PropertyRow label="BG Blur">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', flex: 1 }}>
                  <NumberSliderInput
                    value={bgBlur}
                    onChange={handleBgBlurChange}
                    min={0}
                    max={100}
                    step={1}
                  />
                    <button
                      type="button"
                    className="ui-effect-remove-button"
                    onClick={handleResetBgBlur}
                    aria-label="Remove BG Blur"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8.5" viewBox="0 0 8 8.5">
                        <g fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
                          <path d="m1.5 6.75 5-5M6.5 6.75l-5-5"></path>
                        </g>
                      </svg>
                    </button>
                </div>
              </PropertyRow>
            )}
              </>
            )}
          </PanelSection>
          
          <PanelSection title="Layout">
            <PropertyRow label="Padding">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', flex: 1 }}>
                <NumberPillInput
                  value={uniformPadding}
                  onChange={handleUniformPaddingChange}
                  min={0}
                />
                <IconButtonGroup
                  buttons={[
                    { value: 'uniform', icon: linkIcon, label: 'Uniform padding' },
                    { value: 'individual', icon: unlinkIcon, label: 'Individual padding' },
                  ]}
                  activeValue={paddingMode}
                  onButtonClick={(value) => handlePaddingModeChange(value as 'uniform' | 'individual')}
                      />
                </div>
            </PropertyRow>
          </PanelSection>
          
          <PanelSection title="Vertically align">
            <PropertyRow label="Align">
              <SegmentedIconControl
                value={verticalAlign}
                segments={[
                  { value: 'top', icon: alignTopIcon },
                  { value: 'middle', icon: alignMiddleIcon },
                  { value: 'bottom', icon: alignBottomIcon },
                ]}
                onChange={(value) => handleUpdateRowThemeProps({ verticalAlign: value as 'top' | 'middle' | 'bottom' })}
              />
            </PropertyRow>
          </PanelSection>
          
          <PanelSection title="Effects" />
          
          <PanelSection title="Advanced style" />

              <FillPopover
                isOpen={rowFillPopoverOpen}
                onClose={() => setRowFillPopoverOpen(false)}
                anchorElement={rowFillPopoverAnchor}
                fillType={backgroundImage ? 'image' : backgroundColor ? 'color' : 'color'}
                imageUrl={backgroundImage}
                imageType={backgroundImageType === 'fill' ? 'Fill' : backgroundImageType === 'fit' ? 'Fit' : 'Stretch'}
                color={backgroundColor}
                opacity={backgroundColorOpacity}
                onImageUrlChange={(url) => {
                  handleBackgroundImageChange(url);
                }}
                onImageTypeChange={handleBackgroundImageTypeChange}
                onImageDescriptionChange={() => {}}
                onColorChange={(color) => {
                  handleBackgroundColorChange(color);
                }}
                onOpacityChange={handleBackgroundColorOpacityChange}
              />

              <BorderPopover
                isOpen={rowBorderPopoverOpen}
                onClose={() => {
                  // Just close the popover - do NOT reset the border
                  // Only the clear button on the pill select should reset the border
                  setRowBorderPopoverOpen(false);
                }}
                anchorElement={rowBorderPopoverAnchor}
                color={borderColorForPreview || themePrimaryColor}
                width={hasVisibleBorder ? borderWidth : { mode: 'uniform', uniform: 2 }}
                style={borderStyle}
                onColorChange={handleBorderColorChange}
                onWidthChange={(width) => {
                  // Initialize border if it doesn't exist when user changes width
                  if (!hasVisibleBorder && !rowBorderInitializedRef.current && selectedRow && onUpdateRow) {
                    rowBorderInitializedRef.current = true;
                    handleUpdateRowThemeProps({
                      border: {
                        color: themePrimaryColor,
                        width: width,
                        style: 'solid',
                      },
                    });
                    return; // Don't call the handler again since we just initialized
                  }
                  // Normal width change handler
                  if (width.mode === 'uniform') {
                    handleUniformBorderWidthChange(width.uniform || 0);
                  } else {
                    handleIndividualBorderWidthChange('top', width.top || 0);
                    handleIndividualBorderWidthChange('right', width.right || 0);
                    handleIndividualBorderWidthChange('bottom', width.bottom || 0);
                    handleIndividualBorderWidthChange('left', width.left || 0);
                  }
                }}
                onStyleChange={handleBorderStyleChange}
                onOpenColorPicker={() => {
                  // Close fill popover first, then open color picker
                  setRowFillPopoverOpen(false);
                  setRowColorPickerOpen(true);
                }}
              />

              {rowBorderPopoverOpen && (
                <ColorPickerPopover
                  isOpen={rowColorPickerOpen && rowBorderPopoverOpen}
                  onClose={() => {
                    setRowColorPickerOpen(false);
                    setRowBorderPopoverOpen(true);
                  }}
                  anchorElement={rowBorderPopoverAnchor}
                  color={borderColor || '#326CF6'}
                  opacity={1}
                  onColorChange={handleBorderColorChange}
                  onOpacityChange={() => {}}
                  showBackButton={true}
                  onBack={() => {
                    setRowColorPickerOpen(false);
                    setRowBorderPopoverOpen(true);
                  }}
                  title="Border"
                  hideImageTab={true}
                />
              )}
              
              {hasShadow && (
                <ShadowPopover
                  isOpen={rowShadowPopoverOpen && hasShadow}
                  onClose={() => setRowShadowPopoverOpen(false)}
                  anchorElement={rowShadowPopoverAnchor}
                  shadow={shadow}
                  onShadowChange={handleShadowChange}
                  onOpenColorPicker={() => {
                    setRowShadowPopoverOpen(false);
                    setRowShadowColorPickerOpen(true);
                  }}
                />
              )}
              
              {hasShadow && rowShadowPopoverOpen && (
                <ColorPickerPopover
                  isOpen={rowShadowColorPickerOpen && rowShadowPopoverOpen && hasShadow}
                  onClose={() => {
                    setRowShadowColorPickerOpen(false);
                    setRowShadowPopoverOpen(true);
                  }}
                  anchorElement={rowShadowPopoverAnchor}
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
                    setRowShadowColorPickerOpen(false);
                    setRowShadowPopoverOpen(true);
                  }}
                  title="Shadow"
                  hideImageTab={true}
                />
              )}

              <StylePopover
                isOpen={rowStylePopoverOpen}
                onClose={() => setRowStylePopoverOpen(false)}
                anchorElement={rowStylePopoverAnchor}
                currentStyle={styleId ?? null}
                themeId={themeId}
                themeColors={{
                  accent: themePrimaryColor,
                  surface: theme.colors.surface || '#ffffff',
                  border: theme.colors.border || '#e0e0e0',
                }}
                availableStyles={availableStyles}
                onSelectStyle={handleStyleSelect}
                pageBackground={(() => {
                  const defaultPageBackground = theme.pageBackground || { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
                  const themePageProps = pageProps?.themes?.[themeId] || {};
                  return {
                    backgroundColor: themePageProps.backgroundColor ?? defaultPageBackground.backgroundColor,
                    backgroundColorOpacity: themePageProps.backgroundColorOpacity ?? defaultPageBackground.backgroundColorOpacity ?? 1,
                    backgroundImage: themePageProps.backgroundImage ?? defaultPageBackground.backgroundImage,
                    backgroundImageOpacity: themePageProps.backgroundImageOpacity ?? defaultPageBackground.backgroundImageOpacity ?? 1,
                  };
                })()}
                theme={theme}
                textColors={{
                  headingColor: theme.colors.text || '#000000',
                  paragraphColor: theme.colors.mutedText || '#272525',
                  primaryColor: themePrimaryColor,
                }}
              />
              
              <EffectsMenu
                isOpen={rowStyleEffectsMenuOpen}
                onClose={() => setRowStyleEffectsMenuOpen(false)}
                anchorElement={rowStyleEffectsMenuAnchor}
                availableEffects={availableEffects}
                onSelectEffect={handleSelectEffect}
              />
        </div>
      </div>
    );
  }

  // If cell is selected, show cell properties
  if (selectedCell && !selectedBlock && !isColumnsBlockRow) {
    // CSS default is 8px for .row-cells, so use that if theme padding is 0 or undefined
    const themePadding = theme.cellPadding;
    const defaultPadding = (themePadding && themePadding.uniform !== undefined && themePadding.uniform !== 0)
      ? themePadding
      : { mode: 'uniform' as const, uniform: 8 }; // CSS default is 8px
    const defaultBackground = theme.cellBackground || { backgroundColor: undefined, backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1, backgroundImageType: 'fill' };
    const defaultBorder = theme.cellBorder || { color: undefined, width: { mode: 'uniform', uniform: 0 }, style: 'solid' };
    const defaultBorderRadius = theme.cellBorderRadius || { mode: 'uniform', uniform: 0 };
    
    // Get theme-specific properties with fallback to theme defaults
    const themeProps = getCellThemeProps(selectedCell, themeId, theme);
    const cellThemeProps = selectedCell.props?.themes?.[themeId];
    
    const verticalAlign = themeProps.verticalAlign || 'top';
    // Use padding from themeProps if it exists and has a non-zero value, otherwise use defaultPadding (8px)
    const padding = (themeProps.padding && (
      (themeProps.padding.mode === 'uniform' && themeProps.padding.uniform !== undefined && themeProps.padding.uniform !== 0) ||
      (themeProps.padding.mode === 'individual' && (themeProps.padding.top || themeProps.padding.right || themeProps.padding.bottom || themeProps.padding.left))
    )) ? themeProps.padding : defaultPadding;
    const backgroundColor = themeProps.backgroundColor ?? defaultBackground.backgroundColor;
    const backgroundColorOpacity = themeProps.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1;
    const backgroundImage = themeProps.backgroundImage ?? defaultBackground.backgroundImage;
    const backgroundImageOpacity = themeProps.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1;
    const backgroundImageType = themeProps.backgroundImageType ?? defaultBackground.backgroundImageType ?? 'fill';
    // Check if color/image is explicitly set (can be removed) vs just theme default
    const hasExplicitBackground = cellThemeProps?.backgroundColor !== undefined || cellThemeProps?.backgroundImage !== undefined ||
                                   selectedCell.props?.backgroundColor !== undefined || selectedCell.props?.backgroundImage !== undefined;
    const border = themeProps.border || defaultBorder;
    const borderWidth = border.width || defaultBorder.width || { mode: 'uniform', uniform: 0 };
    const borderWidthMode = borderWidth.mode || defaultBorder.width?.mode || 'uniform';
    const uniformBorderWidth = borderWidth.uniform ?? defaultBorder.width?.uniform ?? 0;
    const topBorderWidth = borderWidth.top ?? defaultBorder.width?.top ?? 0;
    const rightBorderWidth = borderWidth.right ?? defaultBorder.width?.right ?? 0;
    const bottomBorderWidth = borderWidth.bottom ?? defaultBorder.width?.bottom ?? 0;
    const leftBorderWidth = borderWidth.left ?? defaultBorder.width?.left ?? 0;
    // Only show border color if border width is > 0 (border is actually visible)
    const hasVisibleBorder = borderWidthMode === 'uniform' 
      ? uniformBorderWidth > 0 
      : topBorderWidth > 0 || rightBorderWidth > 0 || bottomBorderWidth > 0 || leftBorderWidth > 0;
    const themePrimaryColor = theme?.colors?.accent || '#326CF6';
    // Always use a stable color value for preview - use border color if set, otherwise theme primary
    const borderColorForPreview = border.color ?? defaultBorder.color ?? themePrimaryColor;
    // Only show border color if border width is > 0 (border is actually visible)
    const borderColor = hasVisibleBorder ? borderColorForPreview : themePrimaryColor;
    const borderStyle = border.style || defaultBorder.style || 'solid';
    const borderRadius = themeProps.borderRadius || defaultBorderRadius;
    const borderRadiusMode = borderRadius.mode || defaultBorderRadius.mode || 'uniform';
    const uniformBorderRadius = borderRadius.uniform ?? defaultBorderRadius.uniform ?? 0;
    const topLeftRadius = borderRadius.topLeft ?? defaultBorderRadius.topLeft ?? 0;
    const topRightRadius = borderRadius.topRight ?? defaultBorderRadius.topRight ?? 0;
    const bottomRightRadius = borderRadius.bottomRight ?? defaultBorderRadius.bottomRight ?? 0;
    const bottomLeftRadius = borderRadius.bottomLeft ?? defaultBorderRadius.bottomLeft ?? 0;
    const paddingMode = padding.mode || defaultPadding.mode || 'uniform';
    const uniformPadding = padding.uniform ?? defaultPadding.uniform ?? 0;
    const topPadding = padding.top ?? defaultPadding.top ?? 0;
    const rightPadding = padding.right ?? defaultPadding.right ?? 0;
    const bottomPadding = padding.bottom ?? defaultPadding.bottom ?? 0;
    const leftPadding = padding.left ?? defaultPadding.left ?? 0;
    
    // Shadow and BG Blur
    const shadow = themeProps.shadow ?? null;
    const bgBlur = themeProps.bgBlur ?? 0;
    const hasShadow = shadow !== null;

    // Helper to update theme-specific cell properties
    const handleUpdateCellThemeProps = (updates: Partial<ThemeSpecificCellProps>) => {
      if (!onUpdateCell || !selectedCell || !isMountedRef.current) return;
      try {
        const currentThemeProps = selectedCell.props?.themes?.[themeId] || {};
        // Note: Cells don't have styleId, so we don't need to preserve it here
        onUpdateCell({
          ...selectedCell,
          props: {
            ...selectedCell.props,
            themes: {
              ...selectedCell.props?.themes,
              [themeId]: {
                ...currentThemeProps,
                ...updates,
              },
            },
          },
        });
      } catch (error) {
        console.error('Error updating cell theme props:', error);
      }
    };

    const handleUpdateCell = (updates: Partial<Cell>) => {
      if (!onUpdateCell) return;
      onUpdateCell({
        ...selectedCell,
        ...updates,
        props: {
          ...selectedCell.props,
          ...(updates.props || {}),
        },
      });
    };

    const handlePaddingModeChange = (mode: 'uniform' | 'individual') => {
      handleUpdateCellThemeProps({
        padding: {
          ...padding,
          mode,
          // When switching to uniform, use the first individual value or 0
          uniform: mode === 'uniform' ? (topPadding || 0) : padding.uniform,
        },
      });
    };

    const handleUniformPaddingChange = (value: number) => {
      handleUpdateCellThemeProps({
        padding: {
          ...padding,
          uniform: value,
          mode: 'uniform',
        },
      });
    };

    const handleIndividualPaddingChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
      handleUpdateCellThemeProps({
        padding: {
          ...padding,
          [side]: value,
          mode: 'individual',
        },
      });
    };

    const handleResetPadding = () => {
      handleUpdateCellThemeProps({
        padding: defaultPadding,
      });
    };

    const handleBackgroundColorChange = (value: string | undefined) => {
      if (value) {
        handleUpdateCellThemeProps({
          backgroundColor: value,
          backgroundImage: undefined, // Clear image when setting color
        });
      } else {
        handleUpdateCellThemeProps({
          backgroundColor: undefined,
        });
      }
    };

    const handleBackgroundColorOpacityChange = (value: number) => {
      handleUpdateCellThemeProps({
        backgroundColorOpacity: value,
      });
    };

    const handleBackgroundImageChange = (value: string) => {
      if (value) {
        handleUpdateCellThemeProps({
          backgroundImage: value,
          backgroundColor: undefined, // Clear color when setting image
        });
      } else {
        handleUpdateCellThemeProps({
          backgroundImage: undefined,
        });
      }
    };

    const handleBackgroundImageTypeChange = (type: string) => {
      const imageType = type === 'Fill' ? 'fill' : type === 'Fit' ? 'fit' : type === 'Stretch' ? 'stretch' : 'fill';
      handleUpdateCellThemeProps({ backgroundImageType: imageType as 'fill' | 'fit' | 'stretch' });
    };

    const handleClearBackground = () => {
      handleUpdateCellThemeProps({
        backgroundColor: undefined,
        backgroundImage: undefined,
      });
    };

    const handleBackgroundImageOpacityChange = (value: number) => {
      handleUpdateCellThemeProps({
        backgroundImageOpacity: value,
      });
    };

    const handleResetBackground = () => {
      handleUpdateCellThemeProps({
        backgroundColor: defaultBackground.backgroundColor,
        backgroundColorOpacity: defaultBackground.backgroundColorOpacity,
        backgroundImage: defaultBackground.backgroundImage,
        backgroundImageOpacity: defaultBackground.backgroundImageOpacity,
      });
    };

    const handleBorderColorChange = (value: string) => {
      // Initialize border if it doesn't exist when user changes color
      if (!hasVisibleBorder && !cellBorderInitializedRef.current) {
        cellBorderInitializedRef.current = true;
        handleUpdateCellThemeProps({
          border: {
            color: value || themePrimaryColor,
            width: { mode: 'uniform', uniform: 2 },
            style: 'solid',
          },
        });
      } else {
        handleUpdateCellThemeProps({
          border: {
            ...border,
            color: value || undefined,
            // Ensure style is set when color is set
            style: border.style || borderStyle || 'solid',
            // Ensure width is set when color is set
            width: border.width || { mode: 'uniform', uniform: 2 },
          },
        });
      }
    };

    const handleBorderWidthModeChange = (mode: 'uniform' | 'individual') => {
      handleUpdateCellThemeProps({
        border: {
          ...border,
          // Ensure color is set if width is being set (use current color or theme primary)
          color: border.color || borderColor || themePrimaryColor,
          width: {
            ...borderWidth,
            mode,
            uniform: mode === 'uniform' ? (topBorderWidth || 0) : borderWidth.uniform,
          },
        },
      });
    };

    const handleUniformBorderWidthChange = (value: number) => {
      handleUpdateCellThemeProps({
        border: {
          ...border,
          // Ensure color is set if width is being set (use current color or theme primary)
          color: border.color || borderColor || themePrimaryColor,
          // Ensure style is set
          style: border.style || borderStyle || 'solid',
          width: {
            ...borderWidth,
            uniform: value,
            mode: 'uniform',
          },
        },
      });
    };

    const handleIndividualBorderWidthChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
      handleUpdateCellThemeProps({
        border: {
          ...border,
          // Ensure color is set if width is being set (use current color or theme primary)
          color: border.color || borderColor || themePrimaryColor,
          // Ensure style is set
          style: border.style || borderStyle || 'solid',
          width: {
            ...borderWidth,
            [side]: value,
            mode: 'individual',
          },
        },
      });
    };

    const handleBorderStyleChange = (value: 'solid' | 'dashed' | 'dotted' | 'double') => {
      handleUpdateCellThemeProps({
        border: {
          ...border,
          style: value,
        },
      });
    };

    const handleResetBorder = () => {
      handleUpdateCellThemeProps({
        border: defaultBorder,
      });
    };
    
    // Shadow handlers - Cell
    const handleShadowChange = (newShadow: Shadow | null) => {
      handleUpdateCellThemeProps({
        shadow: newShadow,
      });
    };
    
    const handleResetShadow = () => {
      // Only remove shadow from canvas, keep the row visible
      handleUpdateCellThemeProps({
        shadow: null,
      });
      // Remove from active effects
      setCellActiveEffects(prev => {
        const next = new Set(prev);
        next.delete('Shadows');
        return next;
      });
    };
    
    // BG Blur handlers - Cell
    const handleBgBlurChange = (value: number) => {
      handleUpdateCellThemeProps({
        bgBlur: value,
      });
    };
    
    const handleResetBgBlur = () => {
      handleUpdateCellThemeProps({
        bgBlur: 0,
      });
      // Remove from active effects
      setCellActiveEffects(prev => {
        const next = new Set(prev);
        next.delete('BG Blur');
        return next;
      });
    };
    
    // Effects menu handlers - Cell
    const handleAddEffect = (button: HTMLElement) => {
      setCellStyleEffectsMenuAnchor(button);
      setCellStyleEffectsMenuOpen(true);
    };
    
    const handleSelectEffect = (effect: string) => {
      setCellActiveEffects(prev => {
        const next = new Set(prev);
        next.add(effect);
        return next;
      });
      
      // Initialize default values for new effects
      if (effect === 'Shadows') {
        // Don't initialize shadow yet - it will be initialized when "Add..." is clicked
      } else if (effect === 'BG Blur') {
        handleBgBlurChange(10); // Default blur value
      }
    };

    const handleBorderRadiusModeChange = (mode: 'uniform' | 'individual') => {
      handleUpdateCellThemeProps({
        borderRadius: {
          ...borderRadius,
          mode,
          uniform: mode === 'uniform' ? (topLeftRadius || 0) : borderRadius.uniform,
        },
      });
    };

    const handleUniformBorderRadiusChange = (value: number) => {
      handleUpdateCellThemeProps({
        borderRadius: {
          ...borderRadius,
          uniform: value,
          mode: 'uniform',
        },
      });
    };

    const handleIndividualBorderRadiusChange = (corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft', value: number) => {
      handleUpdateCellThemeProps({
        borderRadius: {
          ...borderRadius,
          [corner]: value,
          mode: 'individual',
        },
      });
    };

    const handleResetBorderRadius = () => {
      handleUpdateCellThemeProps({
        borderRadius: defaultBorderRadius,
      });
    };

    // Align icons (reuse same icons) - larger size for better visibility
    const alignTopIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 10" style={{ width: '16px', height: '16px' }}>
        <path d="M 0 0.75 C 0 0.336 0.336 0 0.75 0 L 13.25 0 C 13.664 0 14 0.336 14 0.75 L 14 0.75 C 14 1.164 13.664 1.5 13.25 1.5 L 0.75 1.5 C 0.336 1.5 0 1.164 0 0.75 Z" fill="currentColor"></path>
        <path d="M 4 5 C 4 3.895 4.895 3 6 3 L 8 3 C 9.105 3 10 3.895 10 5 L 10 8 C 10 9.105 9.105 10 8 10 L 6 10 C 4.895 10 4 9.105 4 8 Z" fill="currentColor"></path>
                </svg>
    );
    const alignMiddleIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 14" style={{ width: '16px', height: '16px' }}>
        <path d="M 0 6.75 C 0 6.336 0.336 6 0.75 6 L 15.25 6 C 15.664 6 16 6.336 16 6.75 L 16 6.75 C 16 7.164 15.664 7.5 15.25 7.5 L 0.75 7.5 C 0.336 7.5 0 7.164 0 6.75 Z" fill="currentColor"></path>
        <path d="M 5 3.5 C 5 2.395 5.895 1.5 7 1.5 L 9 1.5 C 10.105 1.5 11 2.395 11 3.5 L 11 10 C 11 11.105 10.105 12 9 12 L 7 12 C 5.895 12 5 11.105 5 10 Z" fill="currentColor"></path>
                        </svg>
    );
    const alignBottomIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 10" style={{ width: '16px', height: '16px' }}>
        <path d="M 0 9.25 C 0 8.836 0.336 8.5 0.75 8.5 L 13.25 8.5 C 13.664 8.5 14 8.836 14 9.25 L 14 9.25 C 14 9.664 13.664 10 13.25 10 L 0.75 10 C 0.336 10 0 9.664 0 9.25 Z" fill="currentColor"></path>
        <path d="M 4 2 C 4 0.895 4.895 0 6 0 L 8 0 C 9.105 0 10 0.895 10 2 L 10 5 C 10 6.105 9.105 7 8 7 L 6 7 C 4.895 7 4 6.105 4 5 Z" fill="currentColor"></path>
                        </svg>
    );

    // Link/unlink icons - larger size for better visibility
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
    
    // Calculate available effects (must be after all handlers and before return)
    const availableEffects = ['Shadows', 'BG Blur'].filter(effect => !cellActiveEffects.has(effect));

    return (
      <div className="properties-panel ui-properties-panel">
        <div className="properties-content">
          <PanelSection 
            title="Style" 
            showAddButton={availableEffects.length > 0}
            onAddEffect={handleAddEffect}
          >
            <PropertyRow label="Fill">
                <div
                  ref={cellFillPopoverAnchorRef}
                  onClick={() => {
                    const anchor = cellFillPopoverAnchorRef.current;
                    if (anchor) {
                      // Close other popovers first
                      setCellBorderPopoverOpen(false);
                      setCellColorPickerOpen(false);
                      setCellShadowPopoverOpen(false);
                      setCellShadowColorPickerOpen(false);
                      setCellFillPopoverAnchor(anchor);
                      setCellFillPopoverOpen(true);
                    }
                  }}
                  style={{ width: '100%', flex: 1 }}
                >
                <PillSelect
                  thumbnail={backgroundImage}
                  swatchColor={backgroundColor}
                  text={backgroundImage ? 'Image' : backgroundColor ? backgroundColor.toUpperCase() : 'Add...'}
                  onClick={() => {}}
                  onClear={(e) => {
                        e.stopPropagation();
                        handleClearBackground();
                        setCellFillPopoverOpen(false);
                      }}
                  showClear={hasExplicitBackground}
                />
                  </div>
            </PropertyRow>

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

            <PropertyRow label="Border">
              <div
                ref={cellBorderPopoverAnchorRef}
                  onClick={() => {
                  const anchor = cellBorderPopoverAnchorRef.current;
                    if (anchor) {
                    // Close other popovers first
                    setCellFillPopoverOpen(false);
                    setCellColorPickerOpen(false);
                    setCellShadowPopoverOpen(false);
                    setCellShadowColorPickerOpen(false);
                    setCellBorderPopoverAnchor(anchor);
                    if (!hasVisibleBorder && !cellBorderInitializedRef.current && selectedCell) {
                      cellBorderInitializedRef.current = true;
                      handleUpdateCellThemeProps({
                        border: {
                          color: themePrimaryColor,
                          width: { mode: 'uniform', uniform: 2 },
                          style: 'solid',
                        },
                      });
                    }
                    setCellBorderPopoverOpen(true);
                  }
                }}
                style={{ width: '100%', flex: 1 }}
              >
                <PillSelect
                  swatchColor={hasVisibleBorder || cellBorderPopoverOpen ? (borderColorForPreview || themePrimaryColor) : '#CBCBCB'}
                  text={hasVisibleBorder || cellBorderPopoverOpen ? (borderStyle || 'solid') : 'Add...'}
                  onClick={() => {}}
                  onClear={(e) => {
                    e.stopPropagation();
                    handleResetBorder();
                    setCellBorderPopoverOpen(false);
                  }}
                  showClear={hasVisibleBorder || cellBorderPopoverOpen}
                />
                      </div>
            </PropertyRow>
            
            {cellActiveEffects.has('Shadows') && (
              <PropertyRow label="Shadow">
                <div
                  ref={cellShadowPopoverAnchorRef}
                  onClick={() => {
                    const anchor = cellShadowPopoverAnchorRef.current;
                    if (anchor) {
                      // Close other popovers first
                      setCellFillPopoverOpen(false);
                      setCellBorderPopoverOpen(false);
                      setCellColorPickerOpen(false);
                      setCellShadowPopoverAnchor(anchor);
                      // Initialize shadow if it's empty (showing "Add...")
                      if (!hasShadow && !cellShadowInitializedRef.current) {
                        cellShadowInitializedRef.current = true;
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
                      setCellShadowPopoverOpen(true);
                    }
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
            )}
            
            {cellActiveEffects.has('BG Blur') && (
              <PropertyRow label="BG Blur">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', flex: 1 }}>
                  <NumberSliderInput
                    value={bgBlur}
                    onChange={handleBgBlurChange}
                    min={0}
                    max={100}
                    step={1}
                  />
                    <button
                      type="button"
                    className="ui-effect-remove-button"
                    onClick={handleResetBgBlur}
                    aria-label="Remove BG Blur"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8.5" viewBox="0 0 8 8.5">
                        <g fill="transparent" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
                          <path d="m1.5 6.75 5-5M6.5 6.75l-5-5"></path>
                        </g>
                      </svg>
                    </button>
                </div>
              </PropertyRow>
            )}
          </PanelSection>
          
          <PanelSection title="Layout">
            <PropertyRow label="Padding">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', flex: 1 }}>
                <NumberPillInput
                  value={uniformPadding}
                  onChange={handleUniformPaddingChange}
                  min={0}
                />
                <IconButtonGroup
                  buttons={[
                    { value: 'uniform', icon: linkIcon, label: 'Uniform padding' },
                    { value: 'individual', icon: unlinkIcon, label: 'Individual padding' },
                  ]}
                  activeValue={paddingMode}
                  onButtonClick={(value) => handlePaddingModeChange(value as 'uniform' | 'individual')}
                />
                </div>
            </PropertyRow>
          </PanelSection>
          
          <PanelSection title="Vertically align">
            <PropertyRow label="Align">
              <SegmentedIconControl
                value={verticalAlign}
                segments={[
                  { value: 'top', icon: alignTopIcon },
                  { value: 'middle', icon: alignMiddleIcon },
                  { value: 'bottom', icon: alignBottomIcon },
                ]}
                onChange={(value) => handleUpdateCellThemeProps({ verticalAlign: value as 'top' | 'middle' | 'bottom' })}
              />
            </PropertyRow>
          </PanelSection>
          
          <PanelSection title="Effects" />
          
          <PanelSection title="Advanced style" />

              <FillPopover
                isOpen={cellFillPopoverOpen}
                onClose={() => setCellFillPopoverOpen(false)}
                anchorElement={cellFillPopoverAnchor}
                fillType={backgroundImage ? 'image' : backgroundColor ? 'color' : 'color'}
                imageUrl={backgroundImage}
                imageType={backgroundImageType === 'fill' ? 'Fill' : backgroundImageType === 'fit' ? 'Fit' : 'Stretch'}
                color={backgroundColor}
                opacity={backgroundColorOpacity}
                onImageUrlChange={(url) => {
                  handleBackgroundImageChange(url);
                }}
                onImageTypeChange={handleBackgroundImageTypeChange}
                onImageDescriptionChange={() => {}}
                onColorChange={(color) => {
                  handleBackgroundColorChange(color);
                }}
                onOpacityChange={handleBackgroundColorOpacityChange}
              />

              <BorderPopover
                isOpen={cellBorderPopoverOpen}
                onClose={() => {
                  // Just close the popover - do NOT reset the border
                  // Only the clear button on the pill select should reset the border
                  setCellBorderPopoverOpen(false);
                }}
                anchorElement={cellBorderPopoverAnchor}
                color={borderColorForPreview}
                width={hasVisibleBorder ? borderWidth : { mode: 'uniform', uniform: 2 }}
                style={borderStyle}
                onColorChange={handleBorderColorChange}
                onWidthChange={(width) => {
                  // Initialize border if it doesn't exist when user changes width
                  if (!hasVisibleBorder && !cellBorderInitializedRef.current && selectedCell) {
                    cellBorderInitializedRef.current = true;
                    handleUpdateCellThemeProps({
                      border: {
                        color: themePrimaryColor,
                        width: width,
                        style: 'solid',
                      },
                    });
                    return; // Don't call the handler again since we just initialized
                  }
                  // Normal width change handler
                  if (width.mode === 'uniform') {
                    handleUniformBorderWidthChange(width.uniform || 0);
                  } else {
                    handleIndividualBorderWidthChange('top', width.top || 0);
                    handleIndividualBorderWidthChange('right', width.right || 0);
                    handleIndividualBorderWidthChange('bottom', width.bottom || 0);
                    handleIndividualBorderWidthChange('left', width.left || 0);
                  }
                }}
                onStyleChange={handleBorderStyleChange}
                onOpenColorPicker={() => {
                  // Close fill popover first, then open color picker
                  setCellFillPopoverOpen(false);
                  setCellColorPickerOpen(true);
                }}
              />

              {cellBorderPopoverOpen && (
                <ColorPickerPopover
                  isOpen={cellColorPickerOpen && cellBorderPopoverOpen}
                  onClose={() => {
                    setCellColorPickerOpen(false);
                    setCellBorderPopoverOpen(true);
                  }}
                  anchorElement={cellBorderPopoverAnchor}
                  color={borderColor || '#326CF6'}
                  opacity={1}
                  onColorChange={handleBorderColorChange}
                  onOpacityChange={() => {}}
                  showBackButton={true}
                  onBack={() => {
                    setCellColorPickerOpen(false);
                    setCellBorderPopoverOpen(true);
                  }}
                  title="Border"
                  hideImageTab={true}
                />
              )}
              
              {hasShadow && (
                <ShadowPopover
                  isOpen={cellShadowPopoverOpen && hasShadow}
                  onClose={() => setCellShadowPopoverOpen(false)}
                  anchorElement={cellShadowPopoverAnchor}
                  shadow={shadow}
                  onShadowChange={handleShadowChange}
                  onOpenColorPicker={() => {
                    setCellShadowPopoverOpen(false);
                    setCellShadowColorPickerOpen(true);
                  }}
                />
              )}
              
              {hasShadow && cellShadowPopoverOpen && (
                <ColorPickerPopover
                  isOpen={cellShadowColorPickerOpen && cellShadowPopoverOpen && hasShadow}
                  onClose={() => {
                    setCellShadowColorPickerOpen(false);
                    setCellShadowPopoverOpen(true);
                  }}
                  anchorElement={cellShadowPopoverAnchor}
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
                    setCellShadowColorPickerOpen(false);
                    setCellShadowPopoverOpen(true);
                  }}
                  title="Shadow"
                  hideImageTab={true}
                />
              )}
              
              <EffectsMenu
                isOpen={cellStyleEffectsMenuOpen}
                onClose={() => setCellStyleEffectsMenuOpen(false)}
                anchorElement={cellStyleEffectsMenuAnchor}
                availableEffects={availableEffects}
                onSelectEffect={handleSelectEffect}
              />
        </div>
      </div>
    );
  }

  if (!selectedBlock && !isColumnsBlockRow) {
    return (
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <p className="properties-empty">Select a block or row to edit</p>
        </div>
      </div>
    );
  }

  // If columns block row is selected, show column controls
  if (isColumnsBlockRow && selectedRow) {
    const columns = (selectedRow.props?.columns as number) || 2;
    const columnGap = (selectedRow.props?.columnGap as number) || 16;

    const handleUpdateColumns = (updates: { columns?: number; columnGap?: number }) => {
      if (!onUpdateRow) return;
      
      if (updates.columns !== undefined) {
        const currentColumns = columns;
        const newColumns = updates.columns;
        
        if (newColumns > currentColumns) {
          // Add empty cells
          const newCells = [...selectedRow.cells];
          for (let i = currentColumns; i < newColumns; i++) {
            newCells.push({ id: nanoid(), resources: [] });
          }
          onUpdateRow({
            ...selectedRow,
            cells: newCells,
            props: {
              ...selectedRow.props,
              columns: newColumns,
            },
          });
        } else if (newColumns < currentColumns) {
          // Merge extra cells into the last remaining cell
          const newCells = [...selectedRow.cells];
          const lastCell = newCells[newColumns - 1];
          for (let i = newColumns; i < currentColumns; i++) {
            lastCell.resources.push(...newCells[i].resources);
          }
          newCells.splice(newColumns);
          onUpdateRow({
            ...selectedRow,
            cells: newCells,
            props: {
              ...selectedRow.props,
              columns: newColumns,
            },
          });
        }
      } else if (updates.columnGap !== undefined) {
        onUpdateRow({
          ...selectedRow,
          props: {
            ...selectedRow.props,
            columnGap: updates.columnGap,
          },
        });
      }
    };

    return (
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <div className="property-group">
            <label htmlFor="columns-count">Number of Columns</label>
            <div className="columns-count-selector">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`column-count-button ${columns === count ? 'active' : ''}`}
                  onClick={() => handleUpdateColumns({ columns: count })}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <div className="property-group">
            <label htmlFor="column-gap">
              Column Gap: {columnGap}px
            </label>
            <input
              id="column-gap"
              type="range"
              min="8"
              max="32"
              step="4"
              value={columnGap}
              onChange={(e) =>
                handleUpdateColumns({ columnGap: parseInt(e.target.value, 10) })
              }
              className="property-range"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!selectedBlock) {
    return (
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <p className="properties-empty">Select a block to edit</p>
        </div>
      </div>
    );
  }

  // Safety check - should not reach here if selectedBlock is null
  if (!selectedBlock) {
    return (
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <p className="properties-empty">Select a block to edit</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<Block>) => {
    onUpdateBlock({ ...selectedBlock, ...updates });
  };

  return (
    <div className="properties-panel">
      <h2 className="properties-title">Properties</h2>
      <div className="properties-content">
        <div className="property-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={selectedBlock.title}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            className="property-input"
          />
        </div>

        {(selectedBlock.type === 'text' || selectedBlock.type === 'header') && (
          <div className="property-group">
            <label htmlFor="body">Body</label>
            <textarea
              id="body"
              value={(selectedBlock as TextBlock | HeaderBlock).body}
              onChange={(e) =>
                handleUpdate({ body: e.target.value } as Partial<TextBlock | HeaderBlock>)
              }
              className="property-textarea"
              rows={6}
            />
          </div>
        )}

        {selectedBlock.type === 'image' && (
          <ImageFillPanel
            block={selectedBlock as ImageBlock}
            onUpdate={handleUpdate}
          />
        )}

        {selectedBlock.type === 'button' && (
          <div className="property-group">
            <label htmlFor="button-label">Label</label>
            <input
              id="button-label"
              type="text"
              value={(selectedBlock as ButtonBlock).label || ''}
              onChange={(e) =>
                handleUpdate({
                  label: e.target.value,
                } as Partial<ButtonBlock>)
              }
              className="property-input"
              placeholder="Write a continuation"
            />
          </div>
        )}

        {selectedBlock.type === 'quiz' && (
          <>
            <div className="property-group">
              <label htmlFor="quiz-type">Quiz Type</label>
              <select
                id="quiz-type"
                value={(selectedBlock as QuizBlock).quizType || 'multiple-choice'}
                onChange={(e) =>
                  handleUpdate({
                    quizType: e.target.value as 'multiple-choice' | 'other',
                  } as Partial<QuizBlock>)
                }
                className="property-select"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="property-group">
              <label htmlFor="question">Question</label>
              <textarea
                id="question"
                value={(selectedBlock as QuizBlock).question}
                onChange={(e) =>
                  handleUpdate({
                    question: e.target.value,
                  } as Partial<QuizBlock>)
                }
                className="property-textarea"
                rows={3}
              />
            </div>
            {(selectedBlock as QuizBlock).quizType === 'multiple-choice' && (
              <div className="property-group">
                <label>Options</label>
                {(selectedBlock as QuizBlock).options.map((option, index) => (
                  <div key={index} className="option-row">
                    <input
                      type="radio"
                      name="correct"
                      checked={(selectedBlock as QuizBlock).correctIndex === index}
                      onChange={() =>
                        handleUpdate({
                          correctIndex: index,
                        } as Partial<QuizBlock>)
                      }
                      className="option-radio"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [
                          ...(selectedBlock as QuizBlock).options,
                        ];
                        newOptions[index] = e.target.value;
                        handleUpdate({ options: newOptions } as Partial<QuizBlock>);
                      }}
                      className="property-input option-input"
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {selectedBlock.type === 'columns' && (
          <>
            <div className="property-group">
              <label htmlFor="columns-count">Number of Columns</label>
              <div className="columns-count-selector">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`column-count-button ${(selectedBlock as ColumnsBlock).columns === count ? 'active' : ''}`}
                    onClick={() => {
                      const columnsBlock = selectedBlock as ColumnsBlock;
                      const currentColumns = columnsBlock.columns;
                      const newColumns = count;
                      
                      if (newColumns > currentColumns) {
                        // Add empty cells (columns)
                        const newCells = [...columnsBlock.row.cells];
                        for (let i = currentColumns; i < newColumns; i++) {
                          newCells.push({ id: crypto.randomUUID(), resources: [] });
                        }
                        handleUpdate({
                          columns: newColumns,
                          row: {
                            ...columnsBlock.row,
                            cells: newCells,
                            props: {
                              ...columnsBlock.row.props,
                              columns: newColumns,
                            },
                          },
                        } as Partial<ColumnsBlock>);
                      } else if (newColumns < currentColumns) {
                        // Merge extra cells into the last remaining cell
                        const newCells = [...columnsBlock.row.cells];
                        const lastCell = newCells[newColumns - 1];
                        for (let i = newColumns; i < currentColumns; i++) {
                          lastCell.resources.push(...newCells[i].resources);
                        }
                        newCells.splice(newColumns);
                        handleUpdate({
                          columns: newColumns,
                          row: {
                            ...columnsBlock.row,
                            cells: newCells,
                            props: {
                              ...columnsBlock.row.props,
                              columns: newColumns,
                            },
                          },
                        } as Partial<ColumnsBlock>);
                      }
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
            <div className="property-group">
              <label htmlFor="column-gap">
                Column Gap: {(selectedBlock as ColumnsBlock).columnGap}px
              </label>
              <input
                id="column-gap"
                type="range"
                min="8"
                max="32"
                step="4"
                value={(selectedBlock as ColumnsBlock).columnGap}
                onChange={(e) =>
                  handleUpdate({
                    columnGap: parseInt(e.target.value, 10),
                    row: {
                      ...(selectedBlock as ColumnsBlock).row,
                      props: {
                        ...(selectedBlock as ColumnsBlock).row.props,
                        columnGap: parseInt(e.target.value, 10),
                      },
                    },
                  } as Partial<ColumnsBlock>)
                }
                className="property-range"
              />
            </div>
          </>
        )}

        <button
          className="delete-button"
          onClick={onDeleteBlock}
          type="button"
        >
          Delete Block
        </button>
      </div>
    </div>
  );

  // Fallback: always render something to prevent blank page
  return (
    <div className="properties-panel">
      <h2 className="properties-title">Properties</h2>
      <div className="properties-content">
        <p style={{ padding: '16px', color: '#666' }}>No selection</p>
      </div>
    </div>
  );
}
