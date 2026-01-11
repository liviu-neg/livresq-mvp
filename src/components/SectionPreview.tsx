import React from 'react';
import type { SectionTemplate } from '../types';
import { createBlock } from '../types';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';
import { ColumnsBlockView } from './ColumnsBlockView';
import { isBlock } from '../utils/sections';
import { useTheme } from '../theme/ThemeProvider';

// Helper function to convert hex color to rgba with opacity
function hexToRgba(hex: string, opacity: number = 1): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

interface SectionPreviewProps {
  section: SectionTemplate;
}

export function SectionPreview({ section }: SectionPreviewProps) {
  const theme = useTheme();
  // Create preview blocks for the section
  const previewBlocks = section.blocks.map((blockType) => createBlock(blockType));

  // Get row background from theme
  const rowBackground = theme?.rowBackground || {};
  const backgroundColor = rowBackground.backgroundColor;
  const backgroundColorOpacity = rowBackground.backgroundColorOpacity ?? 1;
  const backgroundImage = rowBackground.backgroundImage;
  const backgroundImageOpacity = rowBackground.backgroundImageOpacity ?? 1;

  return (
    <div 
      className="section-preview"
      style={{
        position: 'relative',
      }}
    >
      {/* Row background color layer */}
      {backgroundColor && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: hexToRgba(backgroundColor, backgroundColorOpacity),
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Row background image layer */}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: backgroundImageOpacity,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
      <div 
        className="section-preview-content"
        style={{
          position: 'relative',
          zIndex: 2,
        }}
      >
        {previewBlocks.map((block) => {
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
                  isEditing={false}
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
                  allBlocks={[]}
                  showStructureStrokes={false}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

