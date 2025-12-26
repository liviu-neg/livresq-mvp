import { useRef, useEffect, useState } from 'react';
import type { DeviceType } from './PreviewToolbar';
import { deviceConfigs } from './PreviewToolbar';
import type { Block } from '../types';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';
import { ColumnsBlockView } from './ColumnsBlockView';

interface PreviewStageProps {
  blocks: Block[];
  deviceType: DeviceType;
  deviceConfig: typeof deviceConfigs[DeviceType];
}

export function PreviewStage({ blocks, deviceType, deviceConfig }: PreviewStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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
        <div className="preview-content-wrapper" style={{ width: `${deviceConfig.width}px` }}>
          {blocks.length === 0 ? (
            <div className="preview-empty-state">
              <p>No content to preview</p>
            </div>
          ) : (
            <div className="preview-lesson-content">
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
                        editingBlockId={null}
                        onSelectBlock={() => {}}
                        onEditBlock={() => {}}
                        onUpdateBlock={() => {}}
                        onUpdateColumnsBlock={() => {}}
                        activeId={undefined}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

