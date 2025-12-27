import React, { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { Sparkles, Replace, ArrowDown, Copy, ArrowRight, X, Send, Loader2, Wand2, SpellCheck, Minus, Plus, MessageSquare, Users, Sparkles as SparklesIcon } from 'lucide-react';
import { generateTextEdit } from '../utils/ai';

type PopoverState = 'idle' | 'loading' | 'result';

interface Suggestion {
  label: string;
  instruction: string;
  icon: React.ReactNode;
}

const suggestions: Suggestion[] = [
  { label: 'Improve writing', instruction: 'Improve the writing', icon: <Wand2 size={16} /> },
  { label: 'Fix spelling and grammar', instruction: 'Fix spelling and grammar', icon: <SpellCheck size={16} /> },
  { label: 'Make shorter', instruction: 'Make it shorter', icon: <Minus size={16} /> },
  { label: 'Make longer', instruction: 'Make it longer', icon: <Plus size={16} /> },
  { label: 'Change tone', instruction: 'Change the tone', icon: <MessageSquare size={16} /> },
  { label: 'Change audience', instruction: 'Change the audience', icon: <Users size={16} /> },
  { label: 'Simplify writing', instruction: 'Simplify the writing', icon: <SparklesIcon size={16} /> },
];

interface AiEditPopoverProps {
  editor: Editor;
  selectionFrom: number;
  selectionTo: number;
  selectedText: string;
  onClose: () => void;
  onApply: (action: 'replace' | 'insert-below' | 'continue', text: string) => void;
}

export function AiEditPopover({
  editor,
  selectionFrom,
  selectionTo,
  selectedText,
  onClose,
  onApply,
}: AiEditPopoverProps) {
  const [state, setState] = useState<PopoverState>('idle');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);


  // Focus input when entering idle or result state
  useEffect(() => {
    if ((state === 'idle' || state === 'result') && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [state]);

  const handleSuggestionClick = React.useCallback((suggestion: Suggestion) => {
    // Auto-fill and submit directly
    const submitPrompt = async () => {
      setState('loading');
      setError(null);
      setSelectedSuggestionIndex(null);

      try {
        // Restore selection if it changed
        const currentSelection = editor.state.selection;
        if (currentSelection.from !== selectionFrom || currentSelection.to !== selectionTo) {
          // Restore the original selection
          editor
            .chain()
            .setTextSelection({ from: selectionFrom, to: selectionTo })
            .setAiHighlight()
            .run();
        }

        const aiResult = await generateTextEdit(selectedText, suggestion.instruction);
        setResult(aiResult);
        setState('result');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate text');
        setState('idle');
      }
    };

    setPrompt(suggestion.instruction);
    submitPrompt();
  }, [editor, selectionFrom, selectionTo, selectedText]);

  // Handle keyboard navigation for suggestions
  useEffect(() => {
    if (state !== 'idle') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Only handle arrow keys when input is empty or focused
      if (inputRef.current === document.activeElement || !prompt.trim()) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => {
            if (prev === null) return 0;
            return prev < suggestions.length - 1 ? prev + 1 : prev;
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => {
            if (prev === null || prev === 0) return null;
            return prev - 1;
          });
        } else if (e.key === 'Enter' && selectedSuggestionIndex !== null && !prompt.trim()) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, selectedSuggestionIndex, prompt, onClose, handleSuggestionClick]);

  // Reset selected suggestion when prompt changes
  useEffect(() => {
    if (prompt.trim()) {
      setSelectedSuggestionIndex(null);
    }
  }, [prompt]);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestionIndex !== null && suggestionsRef.current) {
      const selectedButton = suggestionsRef.current.children[selectedSuggestionIndex] as HTMLElement;
      if (selectedButton) {
        selectedButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedSuggestionIndex]);

  // Handle click outside and selection changes
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the editor or bubble toolbar
        const target = e.target as HTMLElement;
        if (!target.closest('.ProseMirror') && !target.closest('.bubble-toolbar')) {
          onClose();
        }
      }
    };

    // Check if selection becomes empty
    const checkSelection = () => {
      const { from, to } = editor.state.selection;
      if (from === to || from !== selectionFrom || to !== selectionTo) {
        // Selection changed or became empty
        if (from === to) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    editor.on('selectionUpdate', checkSelection);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      editor.off('selectionUpdate', checkSelection);
    };
  }, [onClose, editor, selectionFrom, selectionTo]);

  // Helper to ensure selection and modal are in viewport
  const ensureModalInView = React.useCallback(() => {
    if (!popoverRef.current) return;

    try {
      const { from, to } = editor.state.selection;
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      
      const popover = popoverRef.current;
      if (!popover) return;

      const viewportHeight = window.innerHeight;
      const topPadding = 80; // Padding from top when scrolling
      
      // Calculate selection top
      const selectionTop = Math.min(start.top, end.top);
      
      // Get popover dimensions (measure after render)
      const rect = popover.getBoundingClientRect();
      const estimatedModalHeight = rect.height || 400; // Fallback if not measured yet
      
      // Calculate desired position: selection near top with padding
      const desiredTop = selectionTop - topPadding;
      
      // Check if modal would overflow bottom
      const modalBottom = desiredTop + estimatedModalHeight;
      const wouldOverflowBottom = modalBottom > viewportHeight - 20;
      
      // Calculate scroll needed
      let scrollY = window.scrollY;
      if (desiredTop < topPadding) {
        // Need to scroll up to show selection near top
        scrollY = window.scrollY + (desiredTop - topPadding);
      } else if (wouldOverflowBottom) {
        // Need to scroll down to fit modal
        const overflow = modalBottom - (viewportHeight - 20);
        scrollY = window.scrollY + overflow;
      }
      
      // Perform scroll if needed
      if (Math.abs(scrollY - window.scrollY) > 5) {
        window.scrollTo({
          top: Math.max(0, scrollY),
          behavior: 'smooth',
        });
      }
    } catch (e) {
      console.warn('Could not scroll to selection:', e);
    }
  }, [editor]);

  // Position popover near selection
  const updatePosition = React.useCallback(() => {
    if (!popoverRef.current) return;

    try {
      const { from, to } = editor.state.selection;
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);

      const popover = popoverRef.current;
      if (!popover) return;

      const rect = popover.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const topPadding = 80;

      // Calculate position: prefer above selection, fallback to below
      let top = start.top - rect.height - 12;
      let left = start.left;

      // If not enough space above, position below
      if (top < topPadding) {
        top = end.bottom + 12;
      }
      
      // Ensure modal fits in viewport vertically
      if (top + rect.height > viewportHeight - 20) {
        top = Math.max(topPadding, viewportHeight - rect.height - 20);
      }
      
      // Ensure modal fits in viewport horizontally
      if (left + rect.width > viewportWidth - 10) {
        left = viewportWidth - rect.width - 10;
      }
      if (left < 10) {
        left = 10;
      }

      popover.style.position = 'fixed';
      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
    } catch (e) {
      console.warn('Could not position popover:', e);
    }
  }, [editor]);

  // Initial positioning and scroll when modal opens
  useEffect(() => {
    if (!popoverRef.current) return;
    
    // First, ensure selection is in view
    ensureModalInView();
    
    // Then update position after a short delay to allow for scroll
    const timeoutId = setTimeout(() => {
      updatePosition();
    }, 150);
    
    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [editor, state, ensureModalInView, updatePosition]);

  const handleSubmit = async (e?: React.FormEvent, promptText?: string) => {
    e?.preventDefault();
    const textToSubmit = promptText || prompt;
    if (!textToSubmit.trim()) return;

    setState('loading');
    setError(null);
    setSelectedSuggestionIndex(null);

    try {
      // Restore selection if it changed
      const currentSelection = editor.state.selection;
      if (currentSelection.from !== selectionFrom || currentSelection.to !== selectionTo) {
        // Restore the original selection
        editor
          .chain()
          .setTextSelection({ from: selectionFrom, to: selectionTo })
          .setAiHighlight()
          .run();
      }

      const aiResult = await generateTextEdit(selectedText, textToSubmit);
      setResult(aiResult);
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
      setState('idle');
    }
  };


  const handleAction = (action: 'replace' | 'insert-below' | 'continue') => {
    // Restore selection if it changed before applying
    const currentSelection = editor.state.selection;
    if (currentSelection.from !== selectionFrom || currentSelection.to !== selectionTo) {
      // Restore the original selection
      editor
        .chain()
        .setTextSelection({ from: selectionFrom, to: selectionTo })
        .run();
    }

    onApply(action, result);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      // Optional: show a brief success message
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div ref={popoverRef} className="ai-edit-popover">
      <div className="ai-popover-content">
        {/* Preview Area - shows selected text in idle, result in result state */}
        <div className="ai-preview-area">
          {state === 'idle' && (
            <div className="ai-preview-text">{selectedText}</div>
          )}
          {state === 'loading' && (
            <div className="ai-loading">
              <Loader2 size={20} className="ai-spinner-icon" />
              <div className="ai-loading-text">Working...</div>
            </div>
          )}
          {state === 'result' && (
            <div className="ai-result-preview">{result}</div>
          )}
        </div>

        {/* Command Row - only show in idle state */}
        {state === 'idle' && (
          <>
            <form onSubmit={handleSubmit} className="ai-command-row">
              <div className="ai-input-wrapper">
                <Sparkles size={16} className="ai-input-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell me how to edit this text"
                  className="ai-prompt-input"
                />
                <button
                  type="submit"
                  className="ai-send-button"
                  disabled={!prompt.trim()}
                  title="Send (Enter)"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="ai-prompt-hint">
                Press Enter to submit, Esc to cancel
              </div>
              {error && <div className="ai-error">{error}</div>}
            </form>
            
            {/* Suggestions List */}
            <div ref={suggestionsRef} className="ai-suggestions">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className={`ai-action-button ${selectedSuggestionIndex === index ? 'ai-suggestion-selected' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  onMouseLeave={() => setSelectedSuggestionIndex(null)}
                >
                  {suggestion.icon}
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Result State: Input + Actions */}
        {state === 'result' && (
          <>
            {/* Input for making adjustments */}
            <form onSubmit={handleSubmit} className="ai-command-row">
              <div className="ai-input-wrapper">
                <Sparkles size={16} className="ai-input-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask a follow-up question or edit the text..."
                  className="ai-prompt-input"
                />
                <button
                  type="submit"
                  className="ai-send-button"
                  disabled={!prompt.trim()}
                  title="Send (Enter)"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="ai-prompt-hint">
                Press Enter to submit, Esc to cancel
              </div>
              {error && <div className="ai-error">{error}</div>}
            </form>

            {/* Actions List */}
            <div className="ai-popover-divider"></div>
            <div className="ai-actions">
              <button
                type="button"
                className="ai-action-button ai-action-primary"
                onClick={() => handleAction('replace')}
              >
                <Replace size={16} />
                <span>Replace selection</span>
              </button>
              <button
                type="button"
                className="ai-action-button"
                onClick={() => handleAction('insert-below')}
              >
                <ArrowDown size={16} />
                <span>Insert below</span>
              </button>
              <button
                type="button"
                className="ai-action-button"
                onClick={handleCopy}
              >
                <Copy size={16} />
                <span>Copy</span>
              </button>
              <button
                type="button"
                className="ai-action-button"
                onClick={() => handleAction('continue')}
              >
                <ArrowRight size={16} />
                <span>Continue writing</span>
              </button>
              <button
                type="button"
                className="ai-action-button ai-action-cancel"
                onClick={onClose}
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

