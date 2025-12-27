import { useRef } from 'react';
import type { Editor } from '@tiptap/react';
import type { TextBlock, HeaderBlock } from '../types';
import { RichTextEditor } from './RichTextEditor';

interface TextBlockViewProps {
  block: TextBlock | HeaderBlock;
  isSelected: boolean;
  isEditing: boolean;
  isPreview: boolean;
  onUpdate: (updates: Partial<TextBlock | HeaderBlock>) => void;
  editorRef?: React.RefObject<Editor | null>;
}

export function TextBlockView({ block, isSelected, isEditing, isPreview, onUpdate, editorRef }: TextBlockViewProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    // Blur is handled by parent component - editor will remain but lose focus
  };

  const handleUpdate = (html: string) => {
    onUpdate({ body: html });
  };

  // Read-only view when not editing or in preview
  if (isPreview || !isEditing) {
    return (
      <div 
        className="block-view text-block-view"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--font-size-base-scale)',
          lineHeight: 'var(--line-height-normal)',
          color: 'var(--color-text)',
        }}
      >
        <div 
          className="block-body rich-text-readonly"
          dangerouslySetInnerHTML={{ __html: block.body || '<em class="empty-field">No content</em>' }}
        />
      </div>
    );
  }

  // Inline editing view with rich text editor when in edit mode
  return (
    <div 
      className="block-view text-block-view"
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--font-size-base-scale)',
        lineHeight: 'var(--line-height-normal)',
        color: 'var(--color-text)',
      }}
    >
      <div 
        ref={editorContainerRef} 
        className="rich-text-editor-container"
        onMouseDown={(e) => {
          // Prevent drag when clicking on editor
          e.stopPropagation();
        }}
      >
        <RichTextEditor
          content={block.body || ''}
          isEditable={true}
          onUpdate={handleUpdate}
          onBlur={handleBlur}
          defaultFontSize={block.type === 'header' ? '32' : undefined}
          editorRef={editorRef}
        />
      </div>
    </div>
  );
}
