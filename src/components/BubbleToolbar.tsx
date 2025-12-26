import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Eraser,
  Undo,
  Redo,
  Type,
  Minus,
  Sparkles,
} from 'lucide-react';
import { AiEditPopover } from './AiEditPopover';

interface BubbleToolbarProps {
  editor: Editor;
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [showAiPopover, setShowAiPopover] = useState(false);
  const [aiSelection, setAiSelection] = useState<{
    from: number;
    to: number;
    text: string;
  } | null>(null);
  
  // Use ref to track AI modal state so shouldShow callback can access it
  const isAiModalOpenRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    isAiModalOpenRef.current = showAiPopover;
  }, [showAiPopover]);

  // Helper function to get font size from current selection
  const getCurrentFontSize = (): string => {
    // First check if fontSize is in textStyle mark
    const textStyleFontSize = editor.getAttributes('textStyle').fontSize;
    if (textStyleFontSize) {
      return textStyleFontSize;
    }

    // If not found, try to get it from the paragraph element's style
    try {
      const { from } = editor.state.selection;
      const $pos = editor.state.doc.resolve(from);
      const node = $pos.node($pos.depth);
      
      // Check if the node has a style attribute with font-size
      if (node.attrs && node.attrs.style) {
        const styleMatch = node.attrs.style.match(/font-size:\s*(\d+)px/);
        if (styleMatch && styleMatch[1]) {
          return styleMatch[1];
        }
      }

      // Try to get from DOM element
      const domNode = editor.view.nodeDOM(from);
      if (domNode && domNode instanceof HTMLElement) {
        const computedStyle = window.getComputedStyle(domNode);
        const fontSize = computedStyle.fontSize;
        if (fontSize) {
          return fontSize.replace('px', '');
        }
      }
    } catch (e) {
      // Fall through to default
    }

    // Default to 20px
    return '20';
  };

  return (
    <>
    <BubbleMenu
      editor={editor}
      options={{
        placement: 'top',
        offset: 8,
      }}
      shouldShow={({ editor, state }) => {
        // Hide bubble toolbar when AI modal is open
        if (isAiModalOpenRef.current) {
          return false;
        }
        const { selection } = state;
        const { from, to } = selection;
        return from !== to && !selection.empty;
      }}
    >
      <div className="bubble-toolbar">
        <div className="bubble-toolbar-row">
          {/* Row 1 */}
          <button
            type="button"
            className="bubble-toolbar-ai-pill"
            onClick={() => {
              const { from, to } = editor.state.selection;
              const selectedText = editor.state.doc.textBetween(from, to);
              if (selectedText) {
                // Apply highlight mark to the selection
                editor
                  .chain()
                  .setTextSelection({ from, to })
                  .setAiHighlight()
                  .run();
                
                setAiSelection({ from, to, text: selectedText });
                setShowAiPopover(true);
              }
            }}
          >
            <Sparkles size={18} className="ai-pill-icon" />
            <span className="ai-pill-text">AI Assistant</span>
          </button>
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive('bold') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive('italic') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive('underline') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive('strike') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive('subscript') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            title="Subscript"
          >
            <Subscript size={16} />
          </button>
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive('superscript') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            title="Superscript"
          >
            <Superscript size={16} />
          </button>
          <div className="bubble-toolbar-divider" />
          <select
            className="bubble-toolbar-select"
            value={getCurrentFontSize()}
            onChange={(e) => {
              const size = e.target.value;
              editor.chain().focus().setFontSize(size).run();
            }}
            title="Font Size"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="17">17</option>
            <option value="18">18</option>
            <option value="20">20</option>
            <option value="22">22</option>
            <option value="24">24</option>
            <option value="28">28</option>
            <option value="32">32</option>
            <option value="36">36</option>
          </select>
          <div className="bubble-toolbar-divider" />
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
          <div className="bubble-toolbar-divider" />
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive('link') ? 'is-active' : ''}`}
            onClick={() => {
              const url = window.prompt('Enter URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            title="Link"
          >
            <Link size={16} />
          </button>
        </div>
        <div className="bubble-toolbar-row">
          {/* Row 2 */}
          <button
            type="button"
            className="bubble-toolbar-button"
            title="Paragraph Style"
            disabled
          >
            <Type size={16} />
          </button>
          <div className="bubble-toolbar-divider" />
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            className={`bubble-toolbar-button ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <div className="bubble-toolbar-divider" />
          <button
            type="button"
            className="bubble-toolbar-button"
            onClick={() => editor.chain().focus().liftListItem('listItem').run()}
            title="Decrease Indent"
            disabled={!editor.can().liftListItem('listItem')}
          >
            <Outdent size={16} />
          </button>
          <button
            type="button"
            className="bubble-toolbar-button"
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
            title="Increase Indent"
            disabled={!editor.can().sinkListItem('listItem')}
          >
            <Indent size={16} />
          </button>
          <div className="bubble-toolbar-divider" />
          <button
            type="button"
            className="bubble-toolbar-button"
            title="Math"
            disabled
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            className="bubble-toolbar-button"
            title="Select"
            disabled
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            className="bubble-toolbar-button"
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            title="Clear Formatting"
          >
            <Eraser size={16} />
          </button>
          <div className="bubble-toolbar-divider" />
          <button
            type="button"
            className="bubble-toolbar-button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            type="button"
            className="bubble-toolbar-button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>
      </div>
    </BubbleMenu>
    {/* Render AI popover outside BubbleMenu using portal so it doesn't disappear when toolbar hides */}
    {showAiPopover && aiSelection && createPortal(
      <AiEditPopover
        editor={editor}
        selectionFrom={aiSelection.from}
        selectionTo={aiSelection.to}
        selectedText={aiSelection.text}
        onClose={() => {
          // Remove highlight mark
          editor.chain().unsetAiHighlight().run();
          setShowAiPopover(false);
          setAiSelection(null);
        }}
        onApply={(action, text) => {
          const { from, to } = editor.state.selection;
          
          // Verify selection is still valid
          if (from !== aiSelection.from || to !== aiSelection.to) {
            alert('Selection changed. Please try again.');
            setShowAiPopover(false);
            setAiSelection(null);
            return;
          }

          if (action === 'replace') {
            // Replace the selected text
            editor
              .chain()
              .focus()
              .setTextSelection({ from, to })
              .unsetAiHighlight()
              .deleteSelection()
              .insertContent(text)
              .run();
          } else if (action === 'insert-below') {
            // Insert as a new paragraph below
            const $to = editor.state.doc.resolve(to);
            const insertPos = $to.after($to.depth);
            editor
              .chain()
              .focus()
              .unsetAiHighlight()
              .setTextSelection(insertPos)
              .insertContent(`<p>${text}</p>`)
              .run();
          } else if (action === 'continue') {
            // Append after selection and keep focus
            editor
              .chain()
              .focus()
              .unsetAiHighlight()
              .setTextSelection(to)
              .insertContent(` ${text}`)
              .setTextSelection(to + text.length + 1)
              .run();
          }

          setShowAiPopover(false);
          setAiSelection(null);
        }}
      />,
      document.body
    )}
  </>
  );
}

