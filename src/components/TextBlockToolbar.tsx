import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import { AiEditPopover } from './AiEditPopover';

// SVG Icons
const TrashIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24">
    <path fill="currentColor" d="M11 8v7H9V8h2Zm7.997.077L18.14 19.23A3 3 0 0 1 15.148 22H8.853a3 3 0 0 1-2.992-2.77L5.003 8.077l1.994-.154.858 11.154a1 1 0 0 0 .998.923h6.295a1 1 0 0 0 .997-.923l.858-11.154 1.994.154ZM15 1l.948.684L16.721 4H21v2H3V4h4.28l.772-2.316L9 1h6ZM9.387 4h5.226l-.334-1H9.721l-.334 1ZM15 8v7h-2V8h2Z"></path>
  </svg>
);

const DuplicateIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24">
    <path fill="currentColor" fillRule="evenodd" d="M13.154 6.004A3 3 0 0 1 16 9v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h8l.154.004ZM5 8a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9a1 1 0 0 0-.898-.995L13 8H5Zm14.154-5.996A3 3 0 0 1 22 5v10a3 3 0 0 1-3 3h-1v-2h1a1 1 0 0 0 1-1V5a1 1 0 0 0-.898-.995L19 4h-8a1 1 0 0 0-1 1H8a3 3 0 0 1 3-3h8l.154.004Z" clipRule="evenodd"></path>
  </svg>
);

const DragHandleIcon = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <path d="M4.26314 13.8631L0.899994 10.5M0.899994 10.5L4.26314 7.13685M0.899994 10.5H20.1M16.7368 13.8631L20.1 10.5M20.1 10.5L16.7368 7.13685M7.13685 4.26314L10.5 0.899994M10.5 0.899994L13.8631 4.26314M10.5 0.899994L10.5 20.1M7.13685 16.7368L10.5 20.1M10.5 20.1L13.8631 16.7368" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AiEditIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24">
    <path fill="currentColor" d="M5.5 16A2.5 2.5 0 0 0 8 18.5v1A2.5 2.5 0 0 0 5.5 22h-1A2.5 2.5 0 0 0 2 19.5v-1A2.5 2.5 0 0 0 4.5 16h1Zm5.178-10.793c.325-1.368 2.319-1.37 2.644 0l.027.142.042.255a6.26 6.26 0 0 0 5.26 5.046c1.553.224 1.561 2.473 0 2.699a6.26 6.26 0 0 0-5.302 5.301c-.225 1.563-2.475 1.554-2.699 0a6.26 6.26 0 0 0-5.3-5.3c-1.56-.225-1.557-2.474 0-2.699l.255-.042a6.26 6.26 0 0 0 5.046-5.26l.028-.141ZM19.5 2A2.5 2.5 0 0 0 22 4.5v1A2.5 2.5 0 0 0 19.5 8h-1A2.5 2.5 0 0 0 16 5.5v-1A2.5 2.5 0 0 0 18.5 2h1Z"></path>
  </svg>
);

const MoreOptionsIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="24" height="24">
    <path fill="currentColor" d="M12 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"></path>
  </svg>
);

interface TextBlockToolbarProps {
  blockContainerRef: React.RefObject<HTMLElement>;
  blockType: 'text' | 'header';
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  editor: Editor | null;
  editorRef?: React.RefObject<Editor | null>;
  onOpenAiEdit: () => void;
}

export function TextBlockToolbar({
  blockContainerRef,
  blockType,
  onDelete,
  onDuplicate,
  onDragStart,
  editor,
  editorRef,
  onOpenAiEdit,
}: TextBlockToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showAiPopover, setShowAiPopover] = useState(false);
  const [aiSelection, setAiSelection] = useState<{
    from: number;
    to: number;
    text: string;
  } | null>(null);

  // Position toolbar at top-right of block container
  useEffect(() => {
    if (!toolbarRef.current || !blockContainerRef.current) return;

    const updatePosition = () => {
      const container = blockContainerRef.current;
      const toolbar = toolbarRef.current;
      if (!container || !toolbar) return;

      const containerRect = container.getBoundingClientRect();
      const toolbarRect = toolbar.getBoundingClientRect();

      // Position at top-right, with small offset (8px above, aligned to right edge)
      const top = containerRect.top - toolbarRect.height - 8;
      const right = window.innerWidth - containerRect.right;

      // Ensure toolbar doesn't go off-screen
      const minTop = 8;
      const finalTop = Math.max(minTop, top);

      toolbar.style.position = 'fixed';
      toolbar.style.top = `${finalTop}px`;
      toolbar.style.right = `${right}px`;
      toolbar.style.zIndex = '1000';
    };

    updatePosition();
    
    // Use requestAnimationFrame for smooth updates
    const rafId = requestAnimationFrame(updatePosition);
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [blockContainerRef]);

  const handleAiEdit = () => {
    const currentEditor = editor || editorRef?.current;
    
    if (!currentEditor) {
      // If no editor, trigger the callback to enter edit mode first
      onOpenAiEdit();
      // Poll for editor to be ready
      const checkEditor = setInterval(() => {
        const ed = editorRef?.current;
        if (ed) {
          clearInterval(checkEditor);
          const docSize = ed.state.doc.content.size;
          if (docSize > 0) {
            const from = 0;
            const to = docSize;
            const selectedText = ed.state.doc.textBetween(from, to);
            
            if (selectedText) {
              ed
                .chain()
                .setTextSelection({ from, to })
                .setAiHighlight()
                .run();
              
              setAiSelection({ from, to, text: selectedText });
              setShowAiPopover(true);
            }
          }
        }
      }, 50);
      
      // Stop polling after 2 seconds
      setTimeout(() => clearInterval(checkEditor), 2000);
      return;
    }

    // Select all text
    const docSize = currentEditor.state.doc.content.size;
    if (docSize > 0) {
      const from = 0;
      const to = docSize;
      const selectedText = currentEditor.state.doc.textBetween(from, to);
      
      if (selectedText) {
        currentEditor
          .chain()
          .setTextSelection({ from, to })
          .setAiHighlight()
          .run();
        
        setAiSelection({ from, to, text: selectedText });
        setShowAiPopover(true);
      }
    }
  };

  return (
    <>
      <div 
        ref={toolbarRef} 
        className="text-block-toolbar"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="text-block-toolbar-button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete"
        >
          <TrashIcon />
        </button>
        <div className="text-block-toolbar-divider"></div>
        <button
          type="button"
          className="text-block-toolbar-button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          aria-label="Duplicate"
        >
          <DuplicateIcon />
        </button>
        <div className="text-block-toolbar-divider"></div>
        <button
          type="button"
          className="text-block-toolbar-button text-block-toolbar-drag"
          onMouseDown={(e) => {
            e.stopPropagation();
            onDragStart(e);
          }}
          aria-label="Drag"
        >
          <DragHandleIcon />
        </button>
        <div className="text-block-toolbar-divider"></div>
        <button
          type="button"
          className="text-block-toolbar-button text-block-toolbar-ai"
          onClick={(e) => {
            e.stopPropagation();
            handleAiEdit();
          }}
          aria-label="Edit with AI"
        >
          <AiEditIcon />
        </button>
        <div className="text-block-toolbar-divider"></div>
        <button
          type="button"
          className="text-block-toolbar-button"
          aria-label="More options"
        >
          <MoreOptionsIcon />
        </button>
        <div className="text-block-toolbar-divider"></div>
        <button
          type="button"
          className="text-block-toolbar-button text-block-toolbar-label-button"
          aria-label="Block type"
        >
          <span className="text-block-toolbar-label-text">{blockType === 'header' ? 'Header' : 'Texta'}</span>
        </button>
      </div>
      {showAiPopover && aiSelection && (editor || editorRef?.current) && createPortal(
        <AiEditPopover
          editor={editor || editorRef?.current!}
          selectionFrom={aiSelection.from}
          selectionTo={aiSelection.to}
          selectedText={aiSelection.text}
          onClose={() => {
            const ed = editor || editorRef?.current;
            if (ed) {
              ed.chain().unsetAiHighlight().run();
            }
            setShowAiPopover(false);
            setAiSelection(null);
          }}
          onApply={(action, text) => {
            const ed = editor || editorRef?.current;
            if (!ed) return;
            const { from, to } = ed.state.selection;
            
            if (from !== aiSelection.from || to !== aiSelection.to) {
              alert('Selection changed. Please try again.');
              setShowAiPopover(false);
              setAiSelection(null);
              return;
            }

            if (action === 'replace') {
              ed
                .chain()
                .focus()
                .setTextSelection({ from, to })
                .unsetAiHighlight()
                .deleteSelection()
                .insertContent(text)
                .run();
            } else if (action === 'insert-below') {
              const $to = ed.state.doc.resolve(to);
              const insertPos = $to.after($to.depth);
              ed
                .chain()
                .focus()
                .unsetAiHighlight()
                .setTextSelection(insertPos)
                .insertContent(`<p>${text}</p>`)
                .run();
            } else if (action === 'continue') {
              ed
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

