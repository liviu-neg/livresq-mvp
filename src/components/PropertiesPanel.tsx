import type { Block, TextBlock, HeaderBlock, ImageBlock, QuizBlock, ColumnsBlock, ButtonBlock, Row, Cell, ThemeSpecificCellProps, ThemeSpecificRowProps } from '../types';
import { ImageFillPanel } from './ImageFillPanel';
import { nanoid } from 'nanoid';
import { useTheme, useThemeSwitcher } from '../theme/ThemeProvider';
import type { ThemeId } from '../theme/ThemeProvider';

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
  
  // If theme-specific props exist, merge with theme defaults for missing background properties
  if (themeProps) {
    return {
      ...themeProps,
      // Use theme defaults if background properties are not set in theme-specific props
      backgroundColor: themeProps.backgroundColor ?? defaultBackground.backgroundColor,
      backgroundColorOpacity: themeProps.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1,
      backgroundImage: themeProps.backgroundImage ?? defaultBackground.backgroundImage,
      backgroundImageOpacity: themeProps.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1,
    };
  }
  
  // Fallback to legacy props for backward compatibility
  const legacyProps = {
    verticalAlign: cell.props?.verticalAlign,
    padding: cell.props?.padding,
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

// Helper function to get theme-specific row properties with fallback to legacy props
function getRowThemeProps(row: Row, themeId: ThemeId): ThemeSpecificRowProps {
  const themeProps = row.props?.themes?.[themeId];
  // If theme-specific props exist, use them; otherwise fall back to legacy props
  if (themeProps) {
    return themeProps;
  }
  // Fallback to legacy props for backward compatibility
  return {
    verticalAlign: row.props?.verticalAlign,
    padding: row.props?.padding,
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
  // Check if selected row is a columns block
  const isColumnsBlockRow = selectedRow?.props?.isColumnsBlock === true;

  // Page properties panel - shown when page is selected (and not a row, cell, or block)
  if (isPageSelected && !selectedRow && !selectedCell && !selectedBlock && onUpdatePageProps) {
    const theme = useTheme();
    const defaultPageBackground = theme.pageBackground || { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
    
    // Get theme-specific page properties
    const themePageProps = pageProps?.themes?.[themeId] || {};
    const backgroundColor = themePageProps.backgroundColor ?? defaultPageBackground.backgroundColor;
    const backgroundColorOpacity = themePageProps.backgroundColorOpacity ?? defaultPageBackground.backgroundColorOpacity ?? 1;
    const backgroundImage = themePageProps.backgroundImage ?? defaultPageBackground.backgroundImage;
    const backgroundImageOpacity = themePageProps.backgroundImageOpacity ?? defaultPageBackground.backgroundImageOpacity ?? 1;
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
      handleUpdatePageThemeProps({ backgroundColor: color });
    };

    const handleBackgroundColorOpacityChange = (opacity: number) => {
      handleUpdatePageThemeProps({ backgroundColorOpacity: opacity });
    };

    const handleBackgroundImageChange = (url: string) => {
      handleUpdatePageThemeProps({ backgroundImage: url || undefined });
    };

    const handleBackgroundImageOpacityChange = (opacity: number) => {
      handleUpdatePageThemeProps({ backgroundImageOpacity: opacity });
    };

    const handleMaxRowWidthChange = (isFull: boolean) => {
      handleUpdatePageThemeProps({ maxRowWidth: isFull ? null : 1024 });
    };

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
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <div className="property-section">
            <div className="property-section-header">
              <div className="property-section-title">
                <span className="property-icon">+</span>
                <label htmlFor="page-background">Background</label>
              </div>
              <button
                type="button"
                className="property-reset-button"
                onClick={handleResetBackground}
                aria-label="Reset to default"
                title="Reset to theme default"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0 1 6-6v2M14 8a6 6 0 0 1-6 6v-2M8 2L6 4M8 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="background-controls">
              <div className="property-group">
                <label htmlFor="page-background-color">Background Color</label>
                <div className="color-input-wrapper">
                  <input
                    id="page-background-color"
                    type="color"
                    value={backgroundColor || '#ffffff'}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="property-color-input"
                    disabled={!backgroundColor}
                  />
                  <input
                    type="text"
                    value={backgroundColor || ''}
                    onChange={(e) => handleBackgroundColorChange(e.target.value || undefined)}
                    className="property-input color-text-input"
                    placeholder={backgroundColor ? "#ffffff" : "Transparent"}
                  />
                  <button
                    type="button"
                    onClick={() => handleBackgroundColorChange(undefined as any)}
                    className="transparent-button"
                    title="Set to transparent"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: !backgroundColor ? '#f0f0f0' : 'transparent',
                      color: !backgroundColor ? '#666' : '#333',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {backgroundColor ? 'Set transparent' : 'Transparent'}
                  </button>
                </div>
                <div className="opacity-control">
                  <label htmlFor="page-background-color-opacity">Opacity: {Math.round(backgroundColorOpacity * 100)}%</label>
                  <input
                    id="page-background-color-opacity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={backgroundColorOpacity}
                    onChange={(e) => handleBackgroundColorOpacityChange(parseFloat(e.target.value))}
                    className="opacity-range"
                  />
                </div>
              </div>
              <div className="property-group">
                <label htmlFor="page-background-image">Background Image URL</label>
                <input
                  id="page-background-image"
                  type="text"
                  value={backgroundImage || ''}
                  onChange={(e) => handleBackgroundImageChange(e.target.value)}
                  className="property-input"
                  placeholder="https://example.com/image.jpg"
                />
                {backgroundImage && (
                  <div className="opacity-control">
                    <label htmlFor="page-background-image-opacity">Opacity: {Math.round(backgroundImageOpacity * 100)}%</label>
                    <input
                      id="page-background-image-opacity"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={backgroundImageOpacity}
                      onChange={(e) => handleBackgroundImageOpacityChange(parseFloat(e.target.value))}
                      className="opacity-range"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="property-section">
              <div className="property-section-header">
                <div className="property-section-title">
                  <span className="property-icon">📐</span>
                  <label>Layout</label>
                </div>
              </div>
              <div className="property-group">
                <label>Row Width</label>
                <div className="row-width-selector" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className={`row-width-button ${isFullWidth ? 'active' : ''}`}
                    onClick={() => handleMaxRowWidthChange(true)}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      border: `1px solid ${isFullWidth ? '#8b5cf6' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      background: isFullWidth ? '#8b5cf6' : 'transparent',
                      color: isFullWidth ? '#ffffff' : '#333',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isFullWidth ? '500' : '400',
                      transition: 'all 0.15s',
                    }}
                  >
                    Full width
                  </button>
                  <button
                    type="button"
                    className={`row-width-button ${!isFullWidth ? 'active' : ''}`}
                    onClick={() => handleMaxRowWidthChange(false)}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      border: `1px solid ${!isFullWidth ? '#8b5cf6' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      background: !isFullWidth ? '#8b5cf6' : 'transparent',
                      color: !isFullWidth ? '#ffffff' : '#333',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: !isFullWidth ? '500' : '400',
                      transition: 'all 0.15s',
                    }}
                  >
                    1024
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Row properties panel - shown when a row is selected (and not a cell or block)
  // Row properties mirror cell properties: vertical alignment, padding, and background
  // All properties are theme-level configurable with defaults
  if (selectedRow && !selectedCell && !selectedBlock && !isColumnsBlockRow && onUpdateRow) {
    const theme = useTheme();
    const defaultPadding = theme.rowPadding || { mode: 'uniform', uniform: 0 };
    const defaultBackground = theme.rowBackground || { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
    const defaultBorder = theme.rowBorder || { color: undefined, width: { mode: 'uniform', uniform: 0 }, style: 'solid' };
    const defaultBorderRadius = theme.rowBorderRadius || { mode: 'uniform', uniform: 0 };
    
    // Get theme-specific properties
    const themeProps = getRowThemeProps(selectedRow, themeId);
    
    const verticalAlign = themeProps.verticalAlign || 'top';
    const padding = themeProps.padding || defaultPadding;
    const backgroundColor = themeProps.backgroundColor ?? defaultBackground.backgroundColor;
    const backgroundColorOpacity = themeProps.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1;
    const backgroundImage = themeProps.backgroundImage ?? defaultBackground.backgroundImage;
    const backgroundImageOpacity = themeProps.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1;
    const border = themeProps.border || defaultBorder;
    const borderColor = border.color ?? defaultBorder.color ?? '#222222';
    const borderWidth = border.width || defaultBorder.width || { mode: 'uniform', uniform: 0 };
    const borderWidthMode = borderWidth.mode || defaultBorder.width?.mode || 'uniform';
    const uniformBorderWidth = borderWidth.uniform ?? defaultBorder.width?.uniform ?? 0;
    const topBorderWidth = borderWidth.top ?? defaultBorder.width?.top ?? 0;
    const rightBorderWidth = borderWidth.right ?? defaultBorder.width?.right ?? 0;
    const bottomBorderWidth = borderWidth.bottom ?? defaultBorder.width?.bottom ?? 0;
    const leftBorderWidth = borderWidth.left ?? defaultBorder.width?.left ?? 0;
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

    // Helper to update theme-specific row properties
    const handleUpdateRowThemeProps = (updates: Partial<ThemeSpecificRowProps>) => {
      if (!onUpdateRow) return;
      const currentThemeProps = selectedRow.props?.themes?.[themeId] || {};
      onUpdateRow({
        ...selectedRow,
        props: {
          ...selectedRow.props,
          themes: {
            ...selectedRow.props?.themes,
            [themeId]: {
              ...currentThemeProps,
              ...updates,
            },
          },
        },
      });
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
      handleUpdateRowThemeProps({
        backgroundColor: value || undefined,
      });
    };

    const handleBackgroundColorOpacityChange = (value: number) => {
      handleUpdateRowThemeProps({
        backgroundColorOpacity: value,
      });
    };

    const handleBackgroundImageChange = (value: string) => {
      handleUpdateRowThemeProps({
        backgroundImage: value || undefined,
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
      handleUpdateRowThemeProps({
        border: {
          ...border,
          color: value || undefined,
        },
      });
    };

    const handleBorderWidthModeChange = (mode: 'uniform' | 'individual') => {
      handleUpdateRowThemeProps({
        border: {
          ...border,
          // Ensure color is set if width is being set (use current color or default)
          color: border.color || borderColor || '#222222',
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
          // Ensure color is set if width is being set (use current color or default)
          color: border.color || borderColor || '#222222',
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
          // Ensure color is set if width is being set (use current color or default)
          color: border.color || borderColor || '#222222',
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

    return (
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <div className="property-group">
            <label htmlFor="row-vertical-align">Vertical Align</label>
            <div className="vertical-align-selector">
              {(['top', 'middle', 'bottom'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  className={`vertical-align-button ${verticalAlign === align ? 'active' : ''}`}
                  onClick={() => handleUpdateRowThemeProps({
                    verticalAlign: align,
                  })}
                >
                  {align === 'top' && 'Top'}
                  {align === 'middle' && 'Middle'}
                  {align === 'bottom' && 'Bottom'}
                </button>
              ))}
            </div>
          </div>
          <div className="property-group">
            <div className="property-label-with-icon">
              <span className="property-icon">+</span>
              <label htmlFor="row-padding">Padding</label>
              <button
                type="button"
                className="property-reset-button"
                onClick={handleResetPadding}
                aria-label="Reset to default"
                title="Reset to theme default"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0 1 6-6v2M14 8a6 6 0 0 1-6 6v-2M8 2L6 4M8 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="padding-controls">
              <div className="padding-top-row">
                {paddingMode === 'uniform' ? (
                  <>
                    <input
                      id="row-padding-uniform"
                      type="number"
                      min="0"
                      value={uniformPadding}
                      onChange={(e) => handleUniformPaddingChange(parseInt(e.target.value, 10) || 0)}
                      className="property-input padding-input"
                    />
                    <div className="padding-mode-toggle">
                      <button
                        type="button"
                        className={`padding-mode-button ${paddingMode === 'uniform' ? 'active' : ''}`}
                        onClick={() => handlePaddingModeChange('uniform')}
                        aria-label="Uniform padding"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`padding-mode-button ${paddingMode === 'individual' ? 'active' : ''}`}
                        onClick={() => handlePaddingModeChange('individual')}
                        aria-label="Individual padding"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="padding-individual-row">
                    <div className="padding-input-group">
                      <label className="padding-label">Top</label>
                      <input
                        id="row-padding-top"
                        type="number"
                        min="0"
                        value={topPadding}
                        onChange={(e) => handleIndividualPaddingChange('top', parseInt(e.target.value, 10) || 0)}
                        className="property-input padding-input"
                      />
                    </div>
                    <div className="padding-input-group">
                      <label className="padding-label">Right</label>
                      <input
                        id="row-padding-right"
                        type="number"
                        min="0"
                        value={rightPadding}
                        onChange={(e) => handleIndividualPaddingChange('right', parseInt(e.target.value, 10) || 0)}
                        className="property-input padding-input"
                      />
                    </div>
                    <div className="padding-input-group">
                      <label className="padding-label">Bottom</label>
                      <input
                        id="row-padding-bottom"
                        type="number"
                        min="0"
                        value={bottomPadding}
                        onChange={(e) => handleIndividualPaddingChange('bottom', parseInt(e.target.value, 10) || 0)}
                        className="property-input padding-input"
                      />
                    </div>
                    <div className="padding-input-group">
                      <label className="padding-label">Left</label>
                      <input
                        id="row-padding-left"
                        type="number"
                        min="0"
                        value={leftPadding}
                        onChange={(e) => handleIndividualPaddingChange('left', parseInt(e.target.value, 10) || 0)}
                        className="property-input padding-input"
                      />
                    </div>
                    <div className="padding-mode-toggle">
                      <button
                        type="button"
                        className={`padding-mode-button ${paddingMode === 'uniform' ? 'active' : ''}`}
                        onClick={() => handlePaddingModeChange('uniform')}
                        aria-label="Uniform padding"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`padding-mode-button ${paddingMode === 'individual' ? 'active' : ''}`}
                        onClick={() => handlePaddingModeChange('individual')}
                        aria-label="Individual padding"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="property-group">
            <div className="property-label-with-icon">
              <span className="property-icon">+</span>
              <label htmlFor="row-background">Background</label>
              <button
                type="button"
                className="property-reset-button"
                onClick={handleResetBackground}
                aria-label="Reset to default"
                title="Reset to theme default"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0 1 6-6v2M14 8a6 6 0 0 1-6 6v-2M8 2L6 4M8 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="background-controls">
              <div className="property-group">
                <label htmlFor="row-background-color">Background Color</label>
                <div className="color-input-wrapper">
                  <input
                    id="row-background-color"
                    type="color"
                    value={backgroundColor || '#ffffff'}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="property-color-input"
                    disabled={!backgroundColor}
                  />
                  <input
                    type="text"
                    value={backgroundColor || ''}
                    onChange={(e) => handleBackgroundColorChange(e.target.value || undefined)}
                    className="property-input color-text-input"
                    placeholder={backgroundColor ? "#ffffff" : "Transparent"}
                  />
                  <button
                    type="button"
                    onClick={() => handleBackgroundColorChange(undefined as any)}
                    className="transparent-button"
                    title="Set to transparent"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: !backgroundColor ? '#f0f0f0' : 'transparent',
                      color: !backgroundColor ? '#666' : '#333',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {backgroundColor ? 'Set transparent' : 'Transparent'}
                  </button>
                </div>
                <div className="opacity-control">
                  <label htmlFor="row-background-color-opacity">Opacity: {Math.round(backgroundColorOpacity * 100)}%</label>
                  <input
                    id="row-background-color-opacity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={backgroundColorOpacity}
                    onChange={(e) => handleBackgroundColorOpacityChange(parseFloat(e.target.value))}
                    className="property-range opacity-range"
                  />
                </div>
              </div>
              <div className="property-group">
                <label htmlFor="row-background-image">Background Image URL</label>
                <input
                  id="row-background-image"
                  type="text"
                  value={backgroundImage || ''}
                  onChange={(e) => handleBackgroundImageChange(e.target.value)}
                  className="property-input"
                  placeholder="https://example.com/image.jpg"
                />
                {backgroundImage && (
                  <>
                    <div className="background-image-preview">
                      <img
                        src={backgroundImage}
                        alt="Background preview"
                        className="background-preview-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="opacity-control">
                      <label htmlFor="row-background-image-opacity">Opacity: {Math.round(backgroundImageOpacity * 100)}%</label>
                      <input
                        id="row-background-image-opacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={backgroundImageOpacity}
                        onChange={(e) => handleBackgroundImageOpacityChange(parseFloat(e.target.value))}
                        className="property-range opacity-range"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="property-group">
            <div className="property-label-with-icon">
              <span className="property-icon">+</span>
              <label htmlFor="row-border">Border</label>
              <button
                type="button"
                className="property-reset-button"
                onClick={handleResetBorder}
                aria-label="Reset to default"
                title="Reset to theme default"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0 1 6-6v2M14 8a6 6 0 0 1-6 6v-2M8 2L6 4M8 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="border-controls">
              <div className="property-group">
                <label htmlFor="row-border-color">Color</label>
                <div className="color-input-wrapper">
                  <input
                    id="row-border-color"
                    type="color"
                    value={borderColor || '#222222'}
                    onChange={(e) => handleBorderColorChange(e.target.value)}
                    className="property-color-input"
                  />
                  <input
                    type="text"
                    value={borderColor || ''}
                    onChange={(e) => handleBorderColorChange(e.target.value)}
                    className="property-input color-text-input"
                    placeholder="#222222"
                  />
                </div>
              </div>
              <div className="property-group">
                <label htmlFor="row-border-width">Width</label>
                <div className="border-width-controls">
                  <div className="border-width-top-row">
                    {borderWidthMode === 'uniform' ? (
                      <>
                        <input
                          id="row-border-width-uniform"
                          type="number"
                          min="0"
                          value={uniformBorderWidth}
                          onChange={(e) => handleUniformBorderWidthChange(parseInt(e.target.value, 10) || 0)}
                          className="property-input border-width-input"
                        />
                        <div className="border-width-mode-toggle">
                          <button
                            type="button"
                            className={`border-width-mode-button ${borderWidthMode === 'uniform' ? 'active' : ''}`}
                            onClick={() => handleBorderWidthModeChange('uniform')}
                            aria-label="Uniform border width"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`border-width-mode-button ${borderWidthMode === 'individual' ? 'active' : ''}`}
                            onClick={() => handleBorderWidthModeChange('individual')}
                            aria-label="Individual border width"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="border-width-individual-row">
                        <div className="border-width-input-group">
                          <input
                            id="row-border-width-top"
                            type="number"
                            min="0"
                            value={topBorderWidth}
                            onChange={(e) => handleIndividualBorderWidthChange('top', parseInt(e.target.value, 10) || 0)}
                            className="property-input border-width-input"
                          />
                        </div>
                        <div className="border-width-input-group">
                          <input
                            id="row-border-width-right"
                            type="number"
                            min="0"
                            value={rightBorderWidth}
                            onChange={(e) => handleIndividualBorderWidthChange('right', parseInt(e.target.value, 10) || 0)}
                            className="property-input border-width-input"
                          />
                        </div>
                        <div className="border-width-input-group">
                          <input
                            id="row-border-width-bottom"
                            type="number"
                            min="0"
                            value={bottomBorderWidth}
                            onChange={(e) => handleIndividualBorderWidthChange('bottom', parseInt(e.target.value, 10) || 0)}
                            className="property-input border-width-input"
                          />
                        </div>
                        <div className="border-width-input-group">
                          <input
                            id="row-border-width-left"
                            type="number"
                            min="0"
                            value={leftBorderWidth}
                            onChange={(e) => handleIndividualBorderWidthChange('left', parseInt(e.target.value, 10) || 0)}
                            className="property-input border-width-input"
                          />
                        </div>
                        <div className="border-width-labels">
                          <span className="border-width-label">T</span>
                          <span className="border-width-label">R</span>
                          <span className="border-width-label">B</span>
                          <span className="border-width-label">L</span>
                        </div>
                        <div className="border-width-mode-toggle">
                          <button
                            type="button"
                            className={`border-width-mode-button ${borderWidthMode === 'uniform' ? 'active' : ''}`}
                            onClick={() => handleBorderWidthModeChange('uniform')}
                            aria-label="Uniform border width"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`border-width-mode-button ${borderWidthMode === 'individual' ? 'active' : ''}`}
                            onClick={() => handleBorderWidthModeChange('individual')}
                            aria-label="Individual border width"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="property-group">
                <label htmlFor="row-border-style">Style</label>
                <select
                  id="row-border-style"
                  value={borderStyle}
                  onChange={(e) => handleBorderStyleChange(e.target.value as 'solid' | 'dashed' | 'dotted' | 'double')}
                  className="property-select"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>
              </div>
            </div>
          </div>
          {/* Border Radius */}
          <div className="property-section">
            <div className="property-section-header">
              <div className="property-section-title">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: '6px' }}>
                  <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
                <label htmlFor="row-border-radius">Radius</label>
              </div>
              <button
                type="button"
                className="property-reset-button"
                onClick={handleResetBorderRadius}
                aria-label="Reset to default"
                title="Reset to theme default"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0 1 6-6v2M14 8a6 6 0 0 1-6 6v-2M8 2L6 4M8 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="border-radius-controls">
              <div className="border-radius-top-row">
                {borderRadiusMode === 'uniform' ? (
                  <>
                    <input
                      id="row-border-radius-uniform"
                      type="number"
                      min="0"
                      value={uniformBorderRadius}
                      onChange={(e) => handleUniformBorderRadiusChange(parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <div className="border-radius-mode-toggle">
                      <button
                        type="button"
                        className={`border-radius-mode-button ${borderRadiusMode === 'uniform' ? 'active' : ''}`}
                        onClick={() => handleBorderRadiusModeChange('uniform')}
                        aria-label="Uniform border radius"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`border-radius-mode-button ${borderRadiusMode === 'individual' ? 'active' : ''}`}
                        onClick={() => handleBorderRadiusModeChange('individual')}
                        aria-label="Individual border radius"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1"/>
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      value=""
                      readOnly
                      className="property-input border-radius-input"
                      style={{ opacity: 0.5, pointerEvents: 'none' }}
                    />
                    <div className="border-radius-mode-toggle">
                      <button
                        type="button"
                        className={`border-radius-mode-button ${borderRadiusMode === 'uniform' ? 'active' : ''}`}
                        onClick={() => handleBorderRadiusModeChange('uniform')}
                        aria-label="Uniform border radius"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`border-radius-mode-button ${borderRadiusMode === 'individual' ? 'active' : ''}`}
                        onClick={() => handleBorderRadiusModeChange('individual')}
                        aria-label="Individual border radius"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1"/>
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
              {borderRadiusMode === 'individual' && (
                <div className="border-radius-individual-row">
                  <div className="border-radius-input-group">
                    <input
                      id="row-border-radius-top-left"
                      type="number"
                      min="0"
                      value={topLeftRadius}
                      onChange={(e) => handleIndividualBorderRadiusChange('topLeft', parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <label htmlFor="row-border-radius-top-left" className="border-radius-label">TL</label>
                  </div>
                  <div className="border-radius-input-group">
                    <input
                      id="row-border-radius-top-right"
                      type="number"
                      min="0"
                      value={topRightRadius}
                      onChange={(e) => handleIndividualBorderRadiusChange('topRight', parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <label htmlFor="row-border-radius-top-right" className="border-radius-label">TR</label>
                  </div>
                  <div className="border-radius-input-group">
                    <input
                      id="row-border-radius-bottom-right"
                      type="number"
                      min="0"
                      value={bottomRightRadius}
                      onChange={(e) => handleIndividualBorderRadiusChange('bottomRight', parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <label htmlFor="row-border-radius-bottom-right" className="border-radius-label">BR</label>
                  </div>
                  <div className="border-radius-input-group">
                    <input
                      id="row-border-radius-bottom-left"
                      type="number"
                      min="0"
                      value={bottomLeftRadius}
                      onChange={(e) => handleIndividualBorderRadiusChange('bottomLeft', parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <label htmlFor="row-border-radius-bottom-left" className="border-radius-label">BL</label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If cell is selected, show cell properties
  if (selectedCell && !selectedBlock && !isColumnsBlockRow) {
    const theme = useTheme();
    const defaultPadding = theme.cellPadding || { mode: 'uniform', uniform: 0 };
    const defaultBackground = theme.cellBackground || { backgroundColor: undefined, backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
    const defaultBorder = theme.cellBorder || { color: undefined, width: { mode: 'uniform', uniform: 0 }, style: 'solid' };
    const defaultBorderRadius = theme.cellBorderRadius || { mode: 'uniform', uniform: 0 };
    
    // Get theme-specific properties with fallback to theme defaults
    const themeProps = getCellThemeProps(selectedCell, themeId, theme);
    
    const verticalAlign = themeProps.verticalAlign || 'top';
    const padding = themeProps.padding || defaultPadding;
    const backgroundColor = themeProps.backgroundColor ?? defaultBackground.backgroundColor;
    const backgroundColorOpacity = themeProps.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1;
    const backgroundImage = themeProps.backgroundImage ?? defaultBackground.backgroundImage;
    const backgroundImageOpacity = themeProps.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1;
    const border = themeProps.border || defaultBorder;
    const borderColor = border.color ?? defaultBorder.color ?? '#222222';
    const borderWidth = border.width || defaultBorder.width || { mode: 'uniform', uniform: 0 };
    const borderWidthMode = borderWidth.mode || defaultBorder.width?.mode || 'uniform';
    const uniformBorderWidth = borderWidth.uniform ?? defaultBorder.width?.uniform ?? 0;
    const topBorderWidth = borderWidth.top ?? defaultBorder.width?.top ?? 0;
    const rightBorderWidth = borderWidth.right ?? defaultBorder.width?.right ?? 0;
    const bottomBorderWidth = borderWidth.bottom ?? defaultBorder.width?.bottom ?? 0;
    const leftBorderWidth = borderWidth.left ?? defaultBorder.width?.left ?? 0;
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

    // Helper to update theme-specific cell properties
    const handleUpdateCellThemeProps = (updates: Partial<ThemeSpecificCellProps>) => {
      if (!onUpdateCell) return;
      const currentThemeProps = selectedCell.props?.themes?.[themeId] || {};
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
      handleUpdateCellThemeProps({
        backgroundColor: value || undefined,
      });
    };

    const handleBackgroundColorOpacityChange = (value: number) => {
      handleUpdateCellThemeProps({
        backgroundColorOpacity: value,
      });
    };

    const handleBackgroundImageChange = (value: string) => {
      handleUpdateCellThemeProps({
        backgroundImage: value || undefined,
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
      handleUpdateCellThemeProps({
        border: {
          ...border,
          color: value || undefined,
        },
      });
    };

    const handleBorderWidthModeChange = (mode: 'uniform' | 'individual') => {
      handleUpdateCellThemeProps({
        border: {
          ...border,
          // Ensure color is set if width is being set (use current color or default)
          color: border.color || borderColor || '#222222',
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
          // Ensure color is set if width is being set (use current color or default)
          color: border.color || borderColor || '#222222',
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
          // Ensure color is set if width is being set (use current color or default)
          color: border.color || borderColor || '#222222',
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

    return (
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <div className="property-group">
            <label htmlFor="cell-vertical-align">Vertical Align</label>
            <div className="vertical-align-selector">
              {(['top', 'middle', 'bottom'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  className={`vertical-align-button ${verticalAlign === align ? 'active' : ''}`}
                  onClick={() => handleUpdateCellThemeProps({
                    verticalAlign: align,
                  })}
                >
                  {align === 'top' && 'Top'}
                  {align === 'middle' && 'Middle'}
                  {align === 'bottom' && 'Bottom'}
                </button>
              ))}
            </div>
          </div>
          <div className="property-group">
            <div className="property-label-with-icon">
              <span className="property-icon">+</span>
              <label htmlFor="cell-padding">Padding</label>
              <button
                type="button"
                className="property-reset-button"
                onClick={handleResetPadding}
                aria-label="Reset to default"
                title="Reset to theme default"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0 1 6-6v2M14 8a6 6 0 0 1-6 6v-2M8 2L6 4M8 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="padding-controls">
              <div className="padding-top-row">
                {paddingMode === 'uniform' ? (
                  <>
                    <input
                      id="cell-padding-uniform"
                      type="number"
                      min="0"
                      value={uniformPadding}
                      onChange={(e) => handleUniformPaddingChange(parseInt(e.target.value, 10) || 0)}
                      className="property-input padding-input"
                    />
                    <div className="padding-mode-toggle">
                      <button
                        type="button"
                        className={`padding-mode-button ${paddingMode === 'uniform' ? 'active' : ''}`}
                        onClick={() => handlePaddingModeChange('uniform')}
                        aria-label="Uniform padding"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`padding-mode-button ${paddingMode === 'individual' ? 'active' : ''}`}
                        onClick={() => handlePaddingModeChange('individual')}
                        aria-label="Individual padding"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 2"/>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1"/>
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      value=""
                      readOnly
                      className="property-input padding-input"
                      style={{ opacity: 0.5, pointerEvents: 'none' }}
                    />
                    <input
                      type="number"
                      min="0"
                      value="0"
                      readOnly
                      className="property-input padding-input"
                      style={{ opacity: 0.5, pointerEvents: 'none' }}
                    />
                    <div className="padding-mode-toggle">
                      <button
                        type="button"
                        className={`padding-mode-button ${paddingMode === 'uniform' ? 'active' : ''}`}
                        onClick={() => handlePaddingModeChange('uniform')}
                        aria-label="Uniform padding"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`padding-mode-button ${paddingMode === 'individual' ? 'active' : ''}`}
                        onClick={() => handlePaddingModeChange('individual')}
                        aria-label="Individual padding"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 2"/>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1"/>
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
              {paddingMode === 'individual' && (
                <div className="padding-individual-row">
                  <div className="padding-input-group">
                    <input
                      id="cell-padding-top"
                      type="number"
                      min="0"
                      value={topPadding}
                      onChange={(e) => handleIndividualPaddingChange('top', parseInt(e.target.value, 10) || 0)}
                      className="property-input padding-input"
                    />
                    <label htmlFor="cell-padding-top" className="padding-label">T</label>
                  </div>
                  <div className="padding-input-group">
                    <input
                      id="cell-padding-right"
                      type="number"
                      min="0"
                      value={rightPadding}
                      onChange={(e) => handleIndividualPaddingChange('right', parseInt(e.target.value, 10) || 0)}
                      className="property-input padding-input"
                    />
                    <label htmlFor="cell-padding-right" className="padding-label">R</label>
                  </div>
                  <div className="padding-input-group">
                    <input
                      id="cell-padding-bottom"
                      type="number"
                      min="0"
                      value={bottomPadding}
                      onChange={(e) => handleIndividualPaddingChange('bottom', parseInt(e.target.value, 10) || 0)}
                      className="property-input padding-input"
                    />
                    <label htmlFor="cell-padding-bottom" className="padding-label">B</label>
                  </div>
                  <div className="padding-input-group">
                    <input
                      id="cell-padding-left"
                      type="number"
                      min="0"
                      value={leftPadding}
                      onChange={(e) => handleIndividualPaddingChange('left', parseInt(e.target.value, 10) || 0)}
                      className="property-input padding-input"
                    />
                    <label htmlFor="cell-padding-left" className="padding-label">L</label>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="property-group">
            <div className="property-label-with-icon">
              <span className="property-icon">+</span>
              <label htmlFor="cell-background">Background</label>
              <button
                type="button"
                className="property-reset-button"
                onClick={handleResetBackground}
                aria-label="Reset to default"
                title="Reset to theme default"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0 1 6-6v2M14 8a6 6 0 0 1-6 6v-2M8 2L6 4M8 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="background-controls">
              <div className="property-group">
                <label htmlFor="cell-background-color">Background Color</label>
                <div className="color-input-wrapper">
                  <input
                    id="cell-background-color"
                    type="color"
                    value={backgroundColor || '#ffffff'}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="property-color-input"
                    disabled={!backgroundColor}
                  />
                  <input
                    type="text"
                    value={backgroundColor || ''}
                    onChange={(e) => handleBackgroundColorChange(e.target.value || undefined)}
                    className="property-input color-text-input"
                    placeholder={backgroundColor ? "#ffffff" : "Transparent"}
                  />
                  <button
                    type="button"
                    onClick={() => handleBackgroundColorChange(undefined as any)}
                    className="transparent-button"
                    title="Set to transparent"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: !backgroundColor ? '#f0f0f0' : 'transparent',
                      color: !backgroundColor ? '#666' : '#333',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {backgroundColor ? 'Set transparent' : 'Transparent'}
                  </button>
                </div>
                <div className="opacity-control">
                  <label htmlFor="cell-background-color-opacity">Opacity: {Math.round(backgroundColorOpacity * 100)}%</label>
                  <input
                    id="cell-background-color-opacity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={backgroundColorOpacity}
                    onChange={(e) => handleBackgroundColorOpacityChange(parseFloat(e.target.value))}
                    className="property-range opacity-range"
                  />
                </div>
              </div>
              <div className="property-group">
                <label htmlFor="cell-background-image">Background Image URL</label>
                <input
                  id="cell-background-image"
                  type="text"
                  value={backgroundImage || ''}
                  onChange={(e) => handleBackgroundImageChange(e.target.value)}
                  className="property-input"
                  placeholder="https://example.com/image.jpg"
                />
                {backgroundImage && (
                  <>
                    <div className="background-image-preview">
                      <img
                        src={backgroundImage}
                        alt="Background preview"
                        className="background-preview-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="opacity-control">
                      <label htmlFor="cell-background-image-opacity">Opacity: {Math.round(backgroundImageOpacity * 100)}%</label>
                      <input
                        id="cell-background-image-opacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={backgroundImageOpacity}
                        onChange={(e) => handleBackgroundImageOpacityChange(parseFloat(e.target.value))}
                        className="property-range opacity-range"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="property-group">
            <div className="property-label-with-icon">
              <span className="property-icon">+</span>
              <label htmlFor="cell-border">Border</label>
              <button
                type="button"
                className="property-reset-button"
                onClick={handleResetBorder}
                aria-label="Reset to default"
                title="Reset to theme default"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0 1 6-6v2M14 8a6 6 0 0 1-6 6v-2M8 2L6 4M8 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="border-controls">
              <div className="property-group">
                <label htmlFor="cell-border-color">Color</label>
                <div className="color-input-wrapper">
                  <input
                    id="cell-border-color"
                    type="color"
                    value={borderColor || '#222222'}
                    onChange={(e) => handleBorderColorChange(e.target.value)}
                    className="property-color-input"
                  />
                  <input
                    type="text"
                    value={borderColor || ''}
                    onChange={(e) => handleBorderColorChange(e.target.value)}
                    className="property-input color-text-input"
                    placeholder="#222222"
                  />
                </div>
              </div>
              <div className="property-group">
                <label htmlFor="cell-border-width">Width</label>
                <div className="border-width-controls">
                  <div className="border-width-top-row">
                    {borderWidthMode === 'uniform' ? (
                      <>
                        <input
                          id="cell-border-width-uniform"
                          type="number"
                          min="0"
                          value={uniformBorderWidth}
                          onChange={(e) => handleUniformBorderWidthChange(parseInt(e.target.value, 10) || 0)}
                          className="property-input border-width-input"
                        />
                        <div className="border-width-mode-toggle">
                          <button
                            type="button"
                            className={`border-width-mode-button ${borderWidthMode === 'uniform' ? 'active' : ''}`}
                            onClick={() => handleBorderWidthModeChange('uniform')}
                            aria-label="Uniform border width"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`border-width-mode-button ${borderWidthMode === 'individual' ? 'active' : ''}`}
                            onClick={() => handleBorderWidthModeChange('individual')}
                            aria-label="Individual border width"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="border-width-individual-row">
                        <div className="border-width-input-group">
                          <input
                            id="cell-border-width-top"
                            type="number"
                            min="0"
                            value={topBorderWidth}
                            onChange={(e) => handleIndividualBorderWidthChange('top', parseInt(e.target.value, 10) || 0)}
                            className="property-input border-width-input"
                          />
                        </div>
                        <div className="border-width-input-group">
                          <input
                            id="cell-border-width-right"
                            type="number"
                            min="0"
                            value={rightBorderWidth}
                            onChange={(e) => handleIndividualBorderWidthChange('right', parseInt(e.target.value, 10) || 0)}
                            className="property-input border-width-input"
                          />
                        </div>
                        <div className="border-width-input-group">
                          <input
                            id="cell-border-width-bottom"
                            type="number"
                            min="0"
                            value={bottomBorderWidth}
                            onChange={(e) => handleIndividualBorderWidthChange('bottom', parseInt(e.target.value, 10) || 0)}
                            className="property-input border-width-input"
                          />
                        </div>
                        <div className="border-width-input-group">
                          <input
                            id="cell-border-width-left"
                            type="number"
                            min="0"
                            value={leftBorderWidth}
                            onChange={(e) => handleIndividualBorderWidthChange('left', parseInt(e.target.value, 10) || 0)}
                            className="property-input border-width-input"
                          />
                        </div>
                        <div className="border-width-labels">
                          <span className="border-width-label">T</span>
                          <span className="border-width-label">R</span>
                          <span className="border-width-label">B</span>
                          <span className="border-width-label">L</span>
                        </div>
                        <div className="border-width-mode-toggle">
                          <button
                            type="button"
                            className={`border-width-mode-button ${borderWidthMode === 'uniform' ? 'active' : ''}`}
                            onClick={() => handleBorderWidthModeChange('uniform')}
                            aria-label="Uniform border width"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`border-width-mode-button ${borderWidthMode === 'individual' ? 'active' : ''}`}
                            onClick={() => handleBorderWidthModeChange('individual')}
                            aria-label="Individual border width"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="property-group">
                <label htmlFor="cell-border-style">Style</label>
                <select
                  id="cell-border-style"
                  value={borderStyle}
                  onChange={(e) => handleBorderStyleChange(e.target.value as 'solid' | 'dashed' | 'dotted' | 'double')}
                  className="property-select"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>
              </div>
            </div>
          </div>
          {/* Border Radius */}
          <div className="property-section">
            <div className="property-section-header">
              <div className="property-section-title">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: '6px' }}>
                  <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
                <label htmlFor="cell-border-radius">Radius</label>
              </div>
              <button
                type="button"
                className="property-reset-button"
                onClick={handleResetBorderRadius}
                aria-label="Reset to default"
                title="Reset to theme default"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0 1 6-6v2M14 8a6 6 0 0 1-6 6v-2M8 2L6 4M8 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="border-radius-controls">
              <div className="border-radius-top-row">
                {borderRadiusMode === 'uniform' ? (
                  <>
                    <input
                      id="cell-border-radius-uniform"
                      type="number"
                      min="0"
                      value={uniformBorderRadius}
                      onChange={(e) => handleUniformBorderRadiusChange(parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <div className="border-radius-mode-toggle">
                      <button
                        type="button"
                        className={`border-radius-mode-button ${borderRadiusMode === 'uniform' ? 'active' : ''}`}
                        onClick={() => handleBorderRadiusModeChange('uniform')}
                        aria-label="Uniform border radius"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`border-radius-mode-button ${borderRadiusMode === 'individual' ? 'active' : ''}`}
                        onClick={() => handleBorderRadiusModeChange('individual')}
                        aria-label="Individual border radius"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1"/>
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      value=""
                      readOnly
                      className="property-input border-radius-input"
                      style={{ opacity: 0.5, pointerEvents: 'none' }}
                    />
                    <div className="border-radius-mode-toggle">
                      <button
                        type="button"
                        className={`border-radius-mode-button ${borderRadiusMode === 'uniform' ? 'active' : ''}`}
                        onClick={() => handleBorderRadiusModeChange('uniform')}
                        aria-label="Uniform border radius"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`border-radius-mode-button ${borderRadiusMode === 'individual' ? 'active' : ''}`}
                        onClick={() => handleBorderRadiusModeChange('individual')}
                        aria-label="Individual border radius"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1"/>
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
              {borderRadiusMode === 'individual' && (
                <div className="border-radius-individual-row">
                  <div className="border-radius-input-group">
                    <input
                      id="cell-border-radius-top-left"
                      type="number"
                      min="0"
                      value={topLeftRadius}
                      onChange={(e) => handleIndividualBorderRadiusChange('topLeft', parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <label htmlFor="cell-border-radius-top-left" className="border-radius-label">TL</label>
                  </div>
                  <div className="border-radius-input-group">
                    <input
                      id="cell-border-radius-top-right"
                      type="number"
                      min="0"
                      value={topRightRadius}
                      onChange={(e) => handleIndividualBorderRadiusChange('topRight', parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <label htmlFor="cell-border-radius-top-right" className="border-radius-label">TR</label>
                  </div>
                  <div className="border-radius-input-group">
                    <input
                      id="cell-border-radius-bottom-right"
                      type="number"
                      min="0"
                      value={bottomRightRadius}
                      onChange={(e) => handleIndividualBorderRadiusChange('bottomRight', parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <label htmlFor="cell-border-radius-bottom-right" className="border-radius-label">BR</label>
                  </div>
                  <div className="border-radius-input-group">
                    <input
                      id="cell-border-radius-bottom-left"
                      type="number"
                      min="0"
                      value={bottomLeftRadius}
                      onChange={(e) => handleIndividualBorderRadiusChange('bottomLeft', parseInt(e.target.value, 10) || 0)}
                      className="property-input border-radius-input"
                    />
                    <label htmlFor="cell-border-radius-bottom-left" className="border-radius-label">BL</label>
                  </div>
                </div>
              )}
            </div>
          </div>
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
}
