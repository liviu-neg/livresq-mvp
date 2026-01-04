import type { Block, TextBlock, HeaderBlock, ImageBlock, QuizBlock, ColumnsBlock, Row, Cell } from '../types';
import { ImageFillPanel } from './ImageFillPanel';
import { nanoid } from 'nanoid';
import { useTheme } from '../theme/ThemeProvider';

interface PropertiesPanelProps {
  selectedBlock: Block | null;
  selectedRow?: Row | null;
  selectedCell?: Cell | null;
  onUpdateBlock: (block: Block) => void;
  onUpdateRow?: (row: Row) => void;
  onUpdateCell?: (cell: Cell) => void;
  onDeleteBlock: () => void;
}

export function PropertiesPanel({
  selectedBlock,
  selectedRow,
  selectedCell,
  onUpdateBlock,
  onUpdateRow,
  onUpdateCell,
  onDeleteBlock,
}: PropertiesPanelProps) {
  // Check if selected row is a columns block
  const isColumnsBlockRow = selectedRow?.props?.isColumnsBlock === true;

  // Row properties panel - shown when a row is selected (and not a cell or block)
  // Row properties mirror cell properties: vertical alignment, padding, and background
  // All properties are theme-level configurable with defaults
  if (selectedRow && !selectedCell && !selectedBlock && !isColumnsBlockRow && onUpdateRow) {
    const theme = useTheme();
    const defaultPadding = theme.rowPadding || { mode: 'uniform', uniform: 0 };
    const defaultBackground = theme.rowBackground || { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
    
    const verticalAlign = selectedRow.props?.verticalAlign || 'top';
    const padding = selectedRow.props?.padding || defaultPadding;
    const backgroundColor = selectedRow.props?.backgroundColor ?? defaultBackground.backgroundColor;
    const backgroundColorOpacity = selectedRow.props?.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1;
    const backgroundImage = selectedRow.props?.backgroundImage ?? defaultBackground.backgroundImage;
    const backgroundImageOpacity = selectedRow.props?.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1;
    const paddingMode = padding.mode || defaultPadding.mode || 'uniform';
    const uniformPadding = padding.uniform ?? defaultPadding.uniform ?? 0;
    const topPadding = padding.top ?? defaultPadding.top ?? 0;
    const rightPadding = padding.right ?? defaultPadding.right ?? 0;
    const bottomPadding = padding.bottom ?? defaultPadding.bottom ?? 0;
    const leftPadding = padding.left ?? defaultPadding.left ?? 0;

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
      handleUpdateRow({
        props: {
          ...selectedRow.props,
          padding: {
            ...padding,
            mode,
            uniform: mode === 'uniform' ? (topPadding || 0) : padding.uniform,
          },
        },
      });
    };

    const handleUniformPaddingChange = (value: number) => {
      handleUpdateRow({
        props: {
          ...selectedRow.props,
          padding: {
            ...padding,
            uniform: value,
            mode: 'uniform',
          },
        },
      });
    };

    const handleIndividualPaddingChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
      handleUpdateRow({
        props: {
          ...selectedRow.props,
          padding: {
            ...padding,
            [side]: value,
            mode: 'individual',
          },
        },
      });
    };

    const handleResetPadding = () => {
      handleUpdateRow({
        props: {
          ...selectedRow.props,
          padding: defaultPadding,
        },
      });
    };

    const handleBackgroundColorChange = (value: string) => {
      handleUpdateRow({
        props: {
          ...selectedRow.props,
          backgroundColor: value || undefined,
        },
      });
    };

    const handleBackgroundColorOpacityChange = (value: number) => {
      handleUpdateRow({
        props: {
          ...selectedRow.props,
          backgroundColorOpacity: value,
        },
      });
    };

    const handleBackgroundImageChange = (value: string) => {
      handleUpdateRow({
        props: {
          ...selectedRow.props,
          backgroundImage: value || undefined,
        },
      });
    };

    const handleBackgroundImageOpacityChange = (value: number) => {
      handleUpdateRow({
        props: {
          ...selectedRow.props,
          backgroundImageOpacity: value,
        },
      });
    };

    const handleResetBackground = () => {
      handleUpdateRow({
        props: {
          ...selectedRow.props,
          backgroundColor: defaultBackground.backgroundColor,
          backgroundColorOpacity: defaultBackground.backgroundColorOpacity,
          backgroundImage: defaultBackground.backgroundImage,
          backgroundImageOpacity: defaultBackground.backgroundImageOpacity,
        },
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
                  onClick={() => handleUpdateRow({
                    props: {
                      ...selectedRow.props,
                      verticalAlign: align,
                    },
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
                  />
                  <input
                    type="text"
                    value={backgroundColor || ''}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="property-input color-text-input"
                    placeholder="#ffffff"
                  />
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
        </div>
      </div>
    );
  }

  // If cell is selected, show cell properties
  if (selectedCell && !selectedBlock && !isColumnsBlockRow) {
    const theme = useTheme();
    const defaultPadding = theme.cellPadding || { mode: 'uniform', uniform: 0 };
    const defaultBackground = theme.cellBackground || { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
    
    const verticalAlign = selectedCell.props?.verticalAlign || 'top';
    const padding = selectedCell.props?.padding || defaultPadding;
    const backgroundColor = selectedCell.props?.backgroundColor ?? defaultBackground.backgroundColor;
    const backgroundColorOpacity = selectedCell.props?.backgroundColorOpacity ?? defaultBackground.backgroundColorOpacity ?? 1;
    const backgroundImage = selectedCell.props?.backgroundImage ?? defaultBackground.backgroundImage;
    const backgroundImageOpacity = selectedCell.props?.backgroundImageOpacity ?? defaultBackground.backgroundImageOpacity ?? 1;
    const paddingMode = padding.mode || defaultPadding.mode || 'uniform';
    const uniformPadding = padding.uniform ?? defaultPadding.uniform ?? 0;
    const topPadding = padding.top ?? defaultPadding.top ?? 0;
    const rightPadding = padding.right ?? defaultPadding.right ?? 0;
    const bottomPadding = padding.bottom ?? defaultPadding.bottom ?? 0;
    const leftPadding = padding.left ?? defaultPadding.left ?? 0;

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
      handleUpdateCell({
        props: {
          ...selectedCell.props,
          padding: {
            ...padding,
            mode,
            // When switching to uniform, use the first individual value or 0
            uniform: mode === 'uniform' ? (topPadding || 0) : padding.uniform,
          },
        },
      });
    };

    const handleUniformPaddingChange = (value: number) => {
      handleUpdateCell({
        props: {
          ...selectedCell.props,
          padding: {
            ...padding,
            uniform: value,
            mode: 'uniform',
          },
        },
      });
    };

    const handleIndividualPaddingChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
      handleUpdateCell({
        props: {
          ...selectedCell.props,
          padding: {
            ...padding,
            [side]: value,
            mode: 'individual',
          },
        },
      });
    };

    const handleResetPadding = () => {
      handleUpdateCell({
        props: {
          ...selectedCell.props,
          padding: defaultPadding,
        },
      });
    };

    const handleBackgroundColorChange = (value: string) => {
      handleUpdateCell({
        props: {
          ...selectedCell.props,
          backgroundColor: value || undefined,
        },
      });
    };

    const handleBackgroundColorOpacityChange = (value: number) => {
      handleUpdateCell({
        props: {
          ...selectedCell.props,
          backgroundColorOpacity: value,
        },
      });
    };

    const handleBackgroundImageChange = (value: string) => {
      handleUpdateCell({
        props: {
          ...selectedCell.props,
          backgroundImage: value || undefined,
        },
      });
    };

    const handleBackgroundImageOpacityChange = (value: number) => {
      handleUpdateCell({
        props: {
          ...selectedCell.props,
          backgroundImageOpacity: value,
        },
      });
    };

    const handleResetBackground = () => {
      handleUpdateCell({
        props: {
          ...selectedCell.props,
          backgroundColor: defaultBackground.backgroundColor,
          backgroundColorOpacity: defaultBackground.backgroundColorOpacity,
          backgroundImage: defaultBackground.backgroundImage,
          backgroundImageOpacity: defaultBackground.backgroundImageOpacity,
        },
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
                  onClick={() => handleUpdateCell({
                    props: {
                      ...selectedCell.props,
                      verticalAlign: align,
                    },
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
                  />
                  <input
                    type="text"
                    value={backgroundColor || ''}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="property-input color-text-input"
                    placeholder="#ffffff"
                  />
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
