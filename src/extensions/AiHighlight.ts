import { Mark } from '@tiptap/core';

export const AiHighlight = Mark.create({
  name: 'aiHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-ai-highlight]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
        'data-ai-highlight': '',
        class: 'ai-highlight-mark',
      },
      0,
    ];
  },

  addCommands() {
    return {
      setAiHighlight:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleAiHighlight:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetAiHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

