import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize } from '../extensions/FontSize';
import { AiHighlight } from '../extensions/AiHighlight';
import { BubbleToolbar } from './BubbleToolbar';

interface RichTextEditorProps {
  content: string;
  isEditable: boolean;
  onUpdate: (html: string) => void;
  onBlur?: () => void;
  defaultFontSize?: string;
  editorRef?: React.RefObject<Editor | null>;
}

export function RichTextEditor({ content, isEditable, onUpdate, onBlur, defaultFontSize, editorRef }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      TextStyle,
      FontSize,
      AiHighlight,
      Underline,
      Strike,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'rich-text-link',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    editable: isEditable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(html);
    },
    onBlur,
    editorProps: {
      attributes: {
        class: 'rich-text-editor',
      },
      handleKeyDown: (view, event) => {
        // Escape key exits edit mode
        if (event.key === 'Escape') {
          event.preventDefault();
          view.dom.blur();
          onBlur?.();
          return true;
        }
        return false;
      },
    },
  });

  // Sync content when it changes externally
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const hasParagraphFontSize = content.includes('font-size: 32px') || content.includes('font-size:32px');
      editor.commands.setContent(content, false);
      
      // If content has paragraph with font-size: 32px, ensure it's applied as a mark (for header blocks)
      // This converts paragraph-level font-size to textStyle marks
      if (hasParagraphFontSize) {
        setTimeout(() => {
          const docSize = editor.state.doc.content.size;
          if (docSize > 0) {
            // Check if text already has fontSize mark
            const { from, to } = editor.state.selection;
            let hasFontSizeMark = false;
            editor.state.doc.nodesBetween(0, docSize, (node, pos) => {
              if (node.isText && node.marks.some(mark => mark.type.name === 'textStyle' && mark.attrs.fontSize === '32')) {
                hasFontSizeMark = true;
                return false; // Stop traversing
              }
            });
            
            // Only apply if no fontSize mark exists
            if (!hasFontSizeMark) {
              editor.chain()
                .setTextSelection({ from: 0, to: docSize })
                .setFontSize('32')
                .setTextSelection({ from, to })
                .run();
            }
          }
        }, 50);
      }
    }
  }, [content, editor]);

  // Auto-focus when editor becomes editable and apply default font size if needed
  React.useEffect(() => {
    if (isEditable && editor) {
      setTimeout(() => {
        const docSize = editor.state.doc.content.size;
        
        // Apply default font size if specified and not already set
        if (defaultFontSize && docSize > 0) {
          // Check if any text has a fontSize mark
          let hasFontSizeMark = false;
          editor.state.doc.nodesBetween(0, docSize, (node) => {
            if (node.isText && node.marks.some(mark => mark.type.name === 'textStyle' && mark.attrs.fontSize)) {
              hasFontSizeMark = true;
              return false;
            }
          });
          
          // Apply default font size if no fontSize mark exists
          if (!hasFontSizeMark) {
            const { from, to } = editor.state.selection;
            editor.chain()
              .setTextSelection({ from: 0, to: docSize })
              .setFontSize(defaultFontSize)
              .setTextSelection({ from, to })
              .run();
          }
        }
        
        // Select all text when entering edit mode
        if (docSize > 0) {
          editor.chain()
            .setTextSelection({ from: 0, to: docSize })
            .focus()
            .run();
        } else {
          editor.commands.focus('end');
        }
      }, 0);
    }
  }, [isEditable, editor, defaultFontSize]);

  // Expose editor via ref
  React.useEffect(() => {
    if (editorRef) {
      (editorRef as React.MutableRefObject<Editor | null>).current = editor;
    }
  }, [editor, editorRef]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <EditorContent editor={editor} />
      {isEditable && <BubbleToolbar editor={editor} />}
    </>
  );
}

