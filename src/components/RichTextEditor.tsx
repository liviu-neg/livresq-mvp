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
  onEditorReady?: (editor: any) => void;
  triggerSelectAllAndAI?: boolean;
  triggerSelectAll?: boolean;
}

export function RichTextEditor({ content, isEditable, onUpdate, onBlur, defaultFontSize, onEditorReady, triggerSelectAllAndAI, triggerSelectAll }: RichTextEditorProps) {
  // Track if we're in "select all" mode to prevent other effects from interfering
  const isSelectingAllRef = React.useRef(false);
  
  // Pre-process content: convert paragraph-level font-size to span-level BEFORE ProseMirror parses it
  // This ensures ProseMirror's FontSize extension can parse it correctly from the start
  const processedContent = React.useMemo(() => {
    if (!content || typeof document === 'undefined') return content;
    
    // Check if content has paragraph-level font-size
    if (!/<p[^>]*style[^>]*font-size[^>]*>/i.test(content)) {
      return content; // No conversion needed
    }
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
      const container = doc.body.firstChild as HTMLElement;
      
      if (!container) return content;
      
      // Find paragraphs with font-size
      const paragraphs = Array.from(container.querySelectorAll('p')).filter(p => {
        return (p.getAttribute('style') || '').includes('font-size');
      });
      
      paragraphs.forEach((p) => {
        const style = p.getAttribute('style') || '';
        const fontSizeMatch = style.match(/font-size:\s*(\d+)px/i);
        
        if (fontSizeMatch) {
          const fontSize = fontSizeMatch[1];
          
          // Remove font-size from paragraph
          const remainingStyles = style
            .replace(/font-size:\s*\d+px;?\s*/gi, '')
            .replace(/;\s*;/g, ';')
            .trim()
            .replace(/^;|;$/g, '');
          
          if (remainingStyles) {
            p.setAttribute('style', remainingStyles);
          } else {
            p.removeAttribute('style');
          }
          
          // Wrap all content in a span with font-size
          const span = doc.createElement('span');
          span.setAttribute('style', `font-size: ${fontSize}px`);
          while (p.firstChild) {
            span.appendChild(p.firstChild);
          }
          p.appendChild(span);
        }
      });
      
      return container.innerHTML;
    } catch (e) {
      console.warn('Failed to pre-process content:', e);
      return content;
    }
  }, [content]);

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
    content: processedContent,
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
      handleDOMEvents: {
        // Prevent selection from being cleared when editor becomes editable
        focus: (view, event) => {
          // If we're in select-all mode, re-apply selection on focus
          if (isSelectingAllRef.current) {
            requestAnimationFrame(() => {
              const docSize = view.state.doc.content.size;
              if (docSize > 0) {
                const { tr } = view.state;
                const TextSelection = view.state.selection.constructor;
                const newSelection = TextSelection.create(view.state.doc, 0, docSize);
                view.dispatch(tr.setSelection(newSelection));
              }
            });
          }
          return false;
        },
      },
    },
  });

  // Sync content when it changes externally - use processed content
  React.useEffect(() => {
    if (editor && processedContent !== editor.getHTML()) {
      editor.commands.setContent(processedContent, false);
    }
  }, [processedContent, editor]);

  // Expose editor instance to parent
  React.useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Trigger select all and AI assistant
  React.useEffect(() => {
    if (triggerSelectAllAndAI && editor && isEditable) {
      // Wait for editor and BubbleToolbar to be fully ready
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          const docSize = editor.state.doc.content.size;
          if (docSize > 0) {
            // Select all text
            editor.chain()
              .setTextSelection({ from: 0, to: docSize })
              .setAiHighlight()
              .focus()
              .run();
            
            // Trigger AI assistant by dispatching a custom event
            // Use multiple attempts to ensure BubbleToolbar listener catches it
            const dispatchAIEvent = () => {
              // Verify editor DOM is ready
              if (!editor.view.dom || !editor.view.dom.isConnected) {
                return;
              }
              
              const selectedText = editor.state.doc.textBetween(0, docSize);
              if (selectedText) {
                const event = new CustomEvent('trigger-ai-assistant', {
                  detail: { from: 0, to: docSize, text: selectedText },
                  bubbles: true,
                  cancelable: true
                });
                // Dispatch on both the editor DOM and document to ensure it's caught
                editor.view.dom.dispatchEvent(event);
                document.dispatchEvent(event);
              }
            };
            
            // Wait a bit longer to ensure BubbleToolbar is fully mounted and listener is set up
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
              setTimeout(() => {
                dispatchAIEvent();
                // Also dispatch again after short delays as backup
                setTimeout(dispatchAIEvent, 150);
                setTimeout(dispatchAIEvent, 300);
                setTimeout(dispatchAIEvent, 500);
              }, 200);
            });
          }
        }, 100);
      });
    }
  }, [triggerSelectAllAndAI, editor, isEditable]);

  // Trigger select all (without AI) - for double-click
  React.useEffect(() => {
    if (triggerSelectAll && editor && isEditable && !triggerSelectAllAndAI) {
      isSelectingAllRef.current = true;
      
      // Function to apply selection using transaction for immediate effect
      const applySelection = () => {
        const docSize = editor.state.doc.content.size;
        if (docSize > 0) {
          const { state, dispatch } = editor.view;
          const { tr } = state;
          const TextSelection = state.selection.constructor;
          const newSelection = TextSelection.create(state.doc, 0, docSize);
          
          // Apply selection via transaction
          dispatch(tr.setSelection(newSelection));
          
          // Also focus the editor
          editor.view.focus();
        }
      };
      
      // Apply immediately
      applySelection();
      
      // Set up listeners to re-apply selection if it gets cleared
      const handleUpdate = () => {
        if (!isSelectingAllRef.current) return;
        
        const docSize = editor.state.doc.content.size;
        if (docSize > 0) {
          const currentSelection = editor.state.selection;
          // If selection is not full, re-apply it immediately
          if (currentSelection.from !== 0 || currentSelection.to !== docSize) {
            applySelection();
          }
        }
      };
      
      // Listen to editor updates and selection changes
      editor.on('update', handleUpdate);
      editor.on('selectionUpdate', handleUpdate);
      
      // Also intercept ProseMirror transactions to catch selection changes at the lowest level
      const originalDispatch = editor.view.dispatch;
      let transactionInterceptCount = 0;
      
      editor.view.dispatch = function(tr: any) {
        // Call original dispatch first
        originalDispatch.call(this, tr);
        
        // If we're in select-all mode and selection was changed by this transaction
        if (isSelectingAllRef.current && tr.selectionSet && transactionInterceptCount < 20) {
          transactionInterceptCount++;
          const docSize = editor.state.doc.content.size;
          if (docSize > 0) {
            const newSelection = tr.selection;
            // If the new selection is not full document, re-apply immediately
            if (newSelection.from !== 0 || newSelection.to !== docSize) {
              // Use next tick to avoid re-entrancy
              setTimeout(() => {
                if (isSelectingAllRef.current) {
                  applySelection();
                }
              }, 0);
            }
          }
        }
      };
      
      // Also use requestAnimationFrame for immediate re-application
      requestAnimationFrame(() => {
        applySelection();
        
        // Continue re-applying multiple times
        const reapplySelection = () => {
          if (!isSelectingAllRef.current) return;
          applySelection();
        };
        
        // Re-apply multiple times with increasing intervals
        setTimeout(reapplySelection, 10);
        setTimeout(reapplySelection, 30);
        setTimeout(reapplySelection, 60);
        setTimeout(reapplySelection, 120);
        setTimeout(reapplySelection, 250);
        setTimeout(reapplySelection, 500);
        
        // Clear the flag and restore original dispatch after all re-applications are done
        setTimeout(() => {
          // Remove event listeners
          editor.off('update', handleUpdate);
          editor.off('selectionUpdate', handleUpdate);
          
          // Restore original dispatch
          if (editor.view.dispatch !== originalDispatch) {
            editor.view.dispatch = originalDispatch;
          }
          isSelectingAllRef.current = false;
        }, 1000); // Increased to 1000ms to ensure selection persists longer
      });
      
      return () => {
        // Cleanup: remove event listeners and restore dispatch
        editor.off('update', handleUpdate);
        editor.off('selectionUpdate', handleUpdate);
        
        if (editor.view.dispatch !== originalDispatch) {
          editor.view.dispatch = originalDispatch;
        }
      };
    } else if (!triggerSelectAll) {
      isSelectingAllRef.current = false;
    }
  }, [triggerSelectAll, editor, isEditable, triggerSelectAllAndAI]);

  // Auto-focus when editor becomes editable - DO NOT apply default font size if content exists
  // This should NOT run when triggerSelectAll is active
  React.useEffect(() => {
    // Only run if triggerSelectAll is false and we're not in the middle of selecting all
    if (isEditable && editor && !triggerSelectAllAndAI && !triggerSelectAll && !isSelectingAllRef.current) {
      // Use a longer delay to ensure select-all has priority
      const timeoutId = setTimeout(() => {
        // Double-check the ref hasn't changed
        if (isSelectingAllRef.current) return;
        
        // Only apply default font size if content is completely empty
        if (defaultFontSize) {
          const htmlContent = editor.getHTML();
          const isEmpty = htmlContent === '<p></p>' || htmlContent === '<p><br></p>' || htmlContent.trim() === '';
          
          if (isEmpty) {
            // Only apply default font size to completely empty content
            const docSize = editor.state.doc.content.size;
            if (docSize > 0) {
              const { from, to } = editor.state.selection;
              editor.chain()
                .setTextSelection({ from: 0, to: docSize })
                .setFontSize(defaultFontSize)
                .setTextSelection({ from, to })
                .run();
            }
          }
        }
        editor.commands.focus('end');
      }, 300); // Increased delay to ensure select-all runs first
      
      return () => clearTimeout(timeoutId);
    }
  }, [isEditable, editor, defaultFontSize, triggerSelectAllAndAI, triggerSelectAll]);

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

