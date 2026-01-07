import React from 'react';
import type { SectionTemplate } from '../types';
import { createBlock } from '../types';
import { TextBlockView } from './TextBlockView';
import { ImageBlockView } from './ImageBlockView';
import { QuizBlockView } from './QuizBlockView';
import { ColumnsBlockView } from './ColumnsBlockView';
import { isBlock } from '../utils/sections';
import { useTheme } from '../theme/ThemeProvider';

interface SectionPreviewProps {
  section: SectionTemplate;
}

export function SectionPreview({ section }: SectionPreviewProps) {
  const theme = useTheme();
  // Create preview blocks for the section
  const previewBlocks = section.blocks.map((blockType) => createBlock(blockType));

  return (
    <div className="section-preview">
      <div className="section-preview-content">
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

