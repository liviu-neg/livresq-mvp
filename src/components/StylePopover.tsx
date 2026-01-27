import React, { useState } from 'react';
import { Popover } from './Popover';
import { curatedStyles, getCuratedStyle } from '../styles/curatedStyles';
import type { CuratedStyleId, RowStyle, ThemeSpecificRowProps } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import type { Theme } from '../theme/tokens';

interface StylePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  currentStyle: string | null; // 'default' | curated style ID | custom style ID
  themeId: string;
  themeColors: { accent: string; surface: string; border: string };
  availableStyles: RowStyle[]; // Theme-specific and global custom styles
  onSelectStyle: (styleId: string | null) => void; // null = default, string = style ID
  onCreateStyle?: () => void; // Opens create style dialog
  pageBackground?: {
    backgroundColor?: string;
    backgroundColorOpacity?: number;
    backgroundImage?: string;
    backgroundImageOpacity?: number;
  };
  theme?: Theme; // Theme object to get default style
  textColors?: {
    headingColor?: string;
    paragraphColor?: string;
    primaryColor?: string;
  };
}

export function StylePopover({
  isOpen,
  onClose,
  anchorElement,
  currentStyle,
  themeId,
  themeColors,
  availableStyles,
  onSelectStyle,
  onCreateStyle,
  pageBackground,
  theme,
  textColors,
}: StylePopoverProps) {
  const [activeTab, setActiveTab] = useState<'default' | 'curated' | 'custom'>('default');
  
  // Get default style properties from theme
  const getDefaultStyleProperties = (): Partial<ThemeSpecificRowProps> => {
    if (!theme?.defaultRowStyle) return {};
    const defaultStyle = theme.defaultRowStyle;
    if (defaultStyle.type === 'curated' && defaultStyle.curatedId) {
      const curatedStyle = curatedStyles.find(s => s.id === defaultStyle.curatedId);
      if (curatedStyle) {
        return curatedStyle.getProperties(themeColors);
      }
    } else if (defaultStyle.type === 'custom' && defaultStyle.customProperties) {
      return defaultStyle.customProperties;
    }
    return {};
  };
  
  const defaultStyleProperties = getDefaultStyleProperties();

  if (!isOpen) return null;

  const handleSelectDefault = () => {
    onSelectStyle(null);
    onClose();
  };

  const handleSelectCurated = (styleId: CuratedStyleId) => {
    onSelectStyle(styleId);
    onClose();
  };

  const handleSelectCustom = (styleId: string) => {
    onSelectStyle(styleId);
    onClose();
  };

  // Filter custom styles: show theme-specific + global
  const customStyles = availableStyles.filter(
    style => style.themeId === themeId || style.isGlobal
  );

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      anchorElement={anchorElement}
      title="Style"
      className="style-popover"
    >
      <div className="style-popover-content">
        {/* Tabs */}
        <div className="style-popover-tabs">
          <button
            type="button"
            className={`style-popover-tab ${activeTab === 'default' ? 'active' : ''}`}
            onClick={() => setActiveTab('default')}
          >
            Default
          </button>
          <button
            type="button"
            className={`style-popover-tab ${activeTab === 'curated' ? 'active' : ''}`}
            onClick={() => setActiveTab('curated')}
          >
            Curated
          </button>
          {customStyles.length > 0 && (
            <button
              type="button"
              className={`style-popover-tab ${activeTab === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              Custom
            </button>
          )}
        </div>

        {/* Content */}
        <div className="style-popover-tab-content">
          {activeTab === 'default' && (
            <div className="style-popover-list">
              <button
                type="button"
                className={`style-popover-item ${currentStyle === null ? 'active' : ''}`}
                onClick={handleSelectDefault}
              >
                <div className="style-popover-item-preview">
                  <StylePreview 
                    properties={defaultStyleProperties} 
                    themeColors={themeColors} 
                    pageBackground={pageBackground}
                    textColors={textColors}
                  />
                </div>
                <div className="style-popover-item-info">
                  <div className="style-popover-item-name">Default</div>
                  <div className="style-popover-item-description">Theme default style</div>
                </div>
              </button>
            </div>
          )}

          {activeTab === 'curated' && (
            <div className="style-popover-list">
              {curatedStyles.map((style) => {
                const properties = style.getProperties(themeColors);
                const isSelected = currentStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    className={`style-popover-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectCurated(style.id)}
                  >
                    <div className="style-popover-item-preview">
                      <StylePreview 
                        properties={properties} 
                        themeColors={themeColors} 
                        pageBackground={pageBackground}
                        textColors={textColors}
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
          )}

          {activeTab === 'custom' && (
            <div className="style-popover-list">
              {customStyles.map((style) => {
                const isSelected = currentStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    className={`style-popover-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectCustom(style.id)}
                  >
                    <div className="style-popover-item-preview">
                      <StylePreview 
                        properties={style.properties} 
                        themeColors={themeColors} 
                        pageBackground={pageBackground}
                        textColors={textColors}
                      />
                    </div>
                    <div className="style-popover-item-info">
                      <div className="style-popover-item-name">{style.name}</div>
                      <div className="style-popover-item-description">
                        {style.isGlobal ? 'Global style' : 'Theme style'}
                      </div>
                    </div>
                  </button>
                );
              })}
              {onCreateStyle && (
                <button
                  type="button"
                    className="style-popover-create-button"
                    onClick={() => {
                      onCreateStyle();
                      onClose();
                    }}
                  >
                    + Create New Style
                  </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Popover>
  );
}

// Style Preview Component - renders a small preview of the style
interface StylePreviewProps {
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
  };
}

function StylePreview({ properties, themeColors, pageBackground, textColors }: StylePreviewProps) {
  // EXACT copy of hexToRgba from ThemeEditor
  const hexToRgba = (hex: string, opacity: number = 1): string => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // EXACT copy of getBoxShadow from ThemeEditor
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

  // EXACT copy of getBorder from ThemeEditor
  const getBorder = (): string => {
    const border = properties.border;
    if (!border) return 'none';
    const borderWidth = border.width?.mode === 'uniform' ? (border.width?.uniform ?? 0) : 0;
    if (borderWidth > 0) {
      return `${borderWidth}px solid ${border.color || themeColors.border}`;
    }
    return 'none';
  };

  // EXACT copy of getBorderRadius from ThemeEditor
  const getBorderRadius = (): string => {
    const borderRadius = properties.borderRadius;
    if (borderRadius?.mode === 'uniform') {
      return `${borderRadius.uniform ?? 0}px`;
    }
    return '8px'; // Default
  };

  // Use properties directly (rowStyleProps in ThemeEditor)
  const rowStyleProps = properties;

  // Page background - EXACT from ThemeEditor
  const pageBgColor = pageBackground?.backgroundColor || '#ffffff';
  const pageBgOpacity = pageBackground?.backgroundColorOpacity ?? 1;
  const pageBgImage = pageBackground?.backgroundImage;
  const pageBgImageOpacity = pageBackground?.backgroundImageOpacity ?? 1;

  // Use theme colors - EXACT from ThemeEditor (use textColors prop)
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
      {/* Page background image layer - EXACT from ThemeEditor */}
      {pageBgImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${pageBgImage})`,
            backgroundSize: pageBackground?.backgroundImageType === 'fit' ? 'contain' : pageBackground?.backgroundImageType === 'stretch' ? '100% 100%' : 'cover',
            backgroundPosition: 'center',
            opacity: pageBgImageOpacity,
            zIndex: 0,
          }}
        />
      )}
      {/* EXACT copy of ThemeEditor step 2 preview structure */}
      {/* Row container with style properties applied - EXACT from ThemeEditor */}
      {/* Margins: top 16px, left-right 16px */}
      {/* Scale down row to 0.9 (not the background) */}
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
          padding: '8px', // Reduced from 12px to fit content
          borderRadius: getBorderRadius(),
          border: getBorder(),
          boxShadow: rowStyleProps.shadow ? getBoxShadow(rowStyleProps.shadow) : undefined,
          backdropFilter: rowStyleProps.bgBlur ? `blur(${rowStyleProps.bgBlur}px)` : undefined,
          WebkitBackdropFilter: rowStyleProps.bgBlur ? `blur(${rowStyleProps.bgBlur}px)` : undefined,
        }}
      >
        {/* Row background color layer (base layer) - EXACT from ThemeEditor */}
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
        {/* Row background image layer (above color) - EXACT from ThemeEditor */}
        {(rowStyleProps.backgroundImage) && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${rowStyleProps.backgroundImage})`,
              backgroundSize: rowStyleProps.backgroundImageType === 'fit' ? 'contain' : rowStyleProps.backgroundImageType === 'stretch' ? '100% 100%' : 'cover',
              backgroundPosition: 'center',
              opacity: rowStyleProps.backgroundImageOpacity ?? 1,
              zIndex: 1,
              borderRadius: getBorderRadius(),
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Cell view container - simulates .cell-view - EXACT from ThemeEditor */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
          {/* Cell resources container - simulates .cell-resources with padding - EXACT from ThemeEditor */}
          <div style={{ position: 'relative', zIndex: 2, padding: '10px', width: '100%' }}>
            {/* Heading - EXACT from ThemeEditor with scaled font */}
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
            {/* Paragraph - EXACT from ThemeEditor with scaled font */}
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
            {/* Button - EXACT from ThemeEditor with scaled size */}
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

