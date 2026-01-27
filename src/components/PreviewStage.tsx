import { useRef, useEffect, useState } from 'react';
import type { DeviceType } from './PreviewToolbar';
import { deviceConfigs } from './PreviewToolbar';
import type { Block, Resource, Row } from '../types';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';
import { ColumnsBlockView } from './ColumnsBlockView';
import { RowView } from './RowView';
import { isBlock } from '../utils/sections';
import { useTheme } from '../theme/ThemeProvider';
import { useThemeSwitcher } from '../theme/ThemeProvider';

interface PreviewStageProps {
  blocks?: Block[]; // For backward compatibility
  rows?: Row[]; // New: Use rows for proper structure
  deviceType: DeviceType;
  deviceConfig: typeof deviceConfigs[DeviceType];
  pageProps?: {
    themes?: {
      [key: string]: {
        backgroundColor?: string;
        backgroundColorOpacity?: number;
        backgroundImage?: string;
        backgroundImageOpacity?: number;
        maxRowWidth?: number | null;
      } | undefined;
    };
  };
}

export function PreviewStage({ blocks, rows, deviceType, deviceConfig, pageProps }: PreviewStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { themeId } = useThemeSwitcher();
  const theme = useTheme();
  
  // Get page background from pageProps or theme defaults
  const defaultPageBackground = theme.pageBackground || { backgroundColor: '#ffffff', backgroundColorOpacity: 1, backgroundImage: undefined, backgroundImageOpacity: 1 };
  const themePageProps = pageProps?.themes?.[themeId] || {};
  const backgroundColor = themePageProps.backgroundColor ?? defaultPageBackground.backgroundColor;
  const backgroundColorOpacity = themePageProps.backgroundColorOpacity ?? defaultPageBackground.backgroundColorOpacity ?? 1;
  const backgroundImage = themePageProps.backgroundImage ?? defaultPageBackground.backgroundImage;
  const backgroundImageOpacity = themePageProps.backgroundImageOpacity ?? defaultPageBackground.backgroundImageOpacity ?? 1;
  const backgroundImageType = themePageProps.backgroundImageType ?? defaultPageBackground.backgroundImageType ?? 'fill';

  // Calculate scale to fit device viewport in stage
  useEffect(() => {
    const updateScale = () => {
      if (!stageRef.current) return;

      const stageRect = stageRef.current.getBoundingClientRect();
      const stageWidth = stageRect.width;
      const stageHeight = stageRect.height;

      // Calculate scale to fit device viewport (with padding)
      const padding = 40;
      const availableWidth = stageWidth - padding * 2;
      const availableHeight = stageHeight - padding * 2;
      
      const scaleX = availableWidth / deviceConfig.width;
      const scaleY = availableHeight / deviceConfig.height;
      const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1

      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [deviceConfig.width, deviceConfig.height]);

  return (
    <div ref={stageRef} className="preview-stage">
      <div
        className="preview-device-frame"
        style={{
          width: `${deviceConfig.width}px`,
          minHeight: `${deviceConfig.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        <div className="preview-content-wrapper" style={{ width: `${deviceConfig.width}px`, position: 'relative' }}>
          {/* Page background color layer */}
          {backgroundColor && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: backgroundColor || 'transparent',
                opacity: backgroundColorOpacity,
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Page background image layer */}
          {backgroundImage && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: backgroundImageType === 'fit' ? 'contain' : backgroundImageType === 'stretch' ? '100% 100%' : 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: backgroundImageOpacity,
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
          )}
          {rows && rows.length > 0 ? (
            <div className="preview-lesson-content" style={{ position: 'relative', zIndex: 2 }}>
              {rows.map((row) => (
                <RowView
                  key={row.id}
                  row={row}
                  selectedBlockId={null}
                  selectedCellId={null}
                  selectedRowId={null}
                  editingBlockId={null}
                  isPreview={true}
                  onSelectBlock={() => {}}
                  onSelectCell={() => {}}
                  onSelectRow={() => {}}
                  onEditBlock={() => {}}
                  onUpdateBlock={() => {}}
                  onDeleteCell={() => {}}
                  onDuplicateCell={() => {}}
                  onDeleteRow={() => {}}
                  onDuplicateRow={() => {}}
                  onAddEmptyStateRow={() => {}}
                  renderResource={(resource) => {
                    if (isBlock(resource)) {
                      switch (resource.type) {
                        case 'text':
                        case 'header':
                          return (
                            <TextBlockView
                              block={resource}
                              isSelected={false}
                              isEditing={false}
                              isPreview={true}
                              onUpdate={() => {}}
                            />
                          );
                        case 'image':
                          return (
                            <ImageBlockView
                              block={resource}
                              isSelected={false}
                              isPreview={true}
                              onUpdate={() => {}}
                            />
                          );
                        case 'quiz':
                          return (
                            <QuizBlockView
                              block={resource}
                              isSelected={false}
                              isEditing={false}
                              isPreview={true}
                              onUpdate={() => {}}
                            />
                          );
                        case 'columns':
                          return (
                            <ColumnsBlockView
                              block={resource}
                              isSelected={false}
                              isPreview={true}
                              selectedBlockId={null}
                              selectedCellId={null}
                              editingBlockId={null}
                              onSelectBlock={() => {}}
                              onSelectCell={() => {}}
                              onEditBlock={() => {}}
                              onUpdateBlock={() => {}}
                              renderResource={(nestedResource) => {
                                if (isBlock(nestedResource)) {
                                  switch (nestedResource.type) {
                                    case 'text':
                                    case 'header':
                                      return (
                                        <TextBlockView
                                          block={nestedResource}
                                          isSelected={false}
                                          isEditing={false}
                                          isPreview={true}
                                          onUpdate={() => {}}
                                        />
                                      );
                                    case 'image':
                                      return (
                                        <ImageBlockView
                                          block={nestedResource}
                                          isSelected={false}
                                          isPreview={true}
                                          onUpdate={() => {}}
                                        />
                                      );
                                    case 'quiz':
                                      return (
                                        <QuizBlockView
                                          block={nestedResource}
                                          isSelected={false}
                                          isEditing={false}
                                          isPreview={true}
                                          onUpdate={() => {}}
                                        />
                                      );
                                    default:
                                      return null;
                                  }
                                }
                                return null;
                              }}
                              activeId={undefined}
                              allBlocks={[]}
                              showStructureStrokes={false}
                            />
                          );
                        default:
                          return null;
                      }
                    }
                    return null;
                  }}
                  activeId={undefined}
                  allBlocks={[]}
                  showStructureStrokes={false}
                />
              ))}
            </div>
          ) : blocks && blocks.length > 0 ? (
            <div className="preview-lesson-content" style={{ position: 'relative', zIndex: 2 }}>
              {blocks.map((block) => {
                switch (block.type) {
                  case 'text':
                  case 'header':
                    return (
                      <TextBlockView
                        key={block.id}
                        block={block}
                        isSelected={false}
                        isEditing={false}
                        isPreview={true}
                        onUpdate={() => {}}
                      />
                    );
                  case 'image':
                    return (
                      <ImageBlockView
                        key={block.id}
                        block={block}
                        isSelected={false}
                        isPreview={true}
                        onUpdate={() => {}}
                      />
                    );
                  case 'quiz':
                    return (
                      <QuizBlockView
                        key={block.id}
                        block={block}
                        isSelected={false}
                        isPreview={true}
                        onUpdate={() => {}}
                      />
                    );
                  case 'columns':
                    return (
                      <ColumnsBlockView
                        key={block.id}
                        block={block}
                        isSelected={false}
                        isPreview={true}
                        selectedBlockId={null}
                        selectedCellId={null}
                        editingBlockId={null}
                        onSelectBlock={() => {}}
                        onSelectCell={() => {}}
                        onEditBlock={() => {}}
                        onUpdateBlock={() => {}}
                        renderResource={(resource) => {
                          if (isBlock(resource)) {
                            switch (resource.type) {
                              case 'text':
                              case 'header':
                                return (
                                  <TextBlockView
                                    block={resource}
                                    isSelected={false}
                                    isEditing={false}
                                    isPreview={true}
                                    onUpdate={() => {}}
                                  />
                                );
                              case 'image':
                                return (
                                  <ImageBlockView
                                    block={resource}
                                    isSelected={false}
                                    isPreview={true}
                                    onUpdate={() => {}}
                                  />
                                );
                              case 'quiz':
                                return (
                                  <QuizBlockView
                                    block={resource}
                                    isSelected={false}
                                    isEditing={false}
                                    isPreview={true}
                                    onUpdate={() => {}}
                                  />
                                );
                              default:
                                return null;
                            }
                          }
                          return null;
                        }}
                        activeId={undefined}
                        allBlocks={blocks}
                        showStructureStrokes={false}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </div>
          ) : (
            <div className="preview-empty-state">
              <p>No content to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

