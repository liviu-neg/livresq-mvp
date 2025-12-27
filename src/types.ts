import { nanoid } from 'nanoid';

export type BlockType = 'text' | 'header' | 'image' | 'quiz' | 'columns';

export interface BaseBlock {
  id: string;
  type: BlockType;
  title: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  body: string;
}

export interface HeaderBlock extends BaseBlock {
  type: 'header';
  body: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  imageUrl: string;
  caption: string;
  // Image fill properties (Framer-style)
  imageResolution?: 'auto' | '1x' | '2x' | '3x';
  imageType?: 'fill' | 'fit' | 'stretch';
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  altText?: string;
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz';
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export interface ColumnsBlock extends BaseBlock {
  type: 'columns';
  columns: number; // 2-4
  columnGap: number; // 8-32px, default 16
  children: Block[][]; // Array of columns, each column is an array of blocks
}

export type Block = TextBlock | HeaderBlock | ImageBlock | QuizBlock | ColumnsBlock;

export interface Lesson {
  blocks: Block[];
  sections?: Section[]; // New: sections-based structure
}

/**
 * Section Types
 * Sections are layout + styling containers that hold blocks
 */
export type SectionType = 'simple' | 'two-column';

export interface BaseSection {
  id: string;
  type: SectionType;
  props?: Record<string, unknown>; // Future: section-specific props (padding, background, etc.)
}

export interface SimpleSection extends BaseSection {
  type: 'simple';
  slots: {
    main: Block[]; // Vertical stack of blocks
  };
}

export interface TwoColumnSection extends BaseSection {
  type: 'two-column';
  slots: {
    left: Block[];
    right: Block[];
  };
}

export type Section = SimpleSection | TwoColumnSection;

export function createBlock(type: BlockType): Block {
  const id = nanoid();
  const base: BaseBlock = { id, type, title: 'Untitled' };

  switch (type) {
    case 'text':
      return { 
        ...base, 
        body: '<p>When we show up to the present moment with all of our senses, we invite the world to fill us with joy. The pains of the past are behind us. The future has yet to unfold. But the now is full of beauty simply waiting for our attention.</p>' 
      };
    case 'header':
      return { 
        ...base, 
        body: '<p style="font-size: 32px;">Section title</p>' 
      };
    case 'image':
      return { 
        ...base, 
        imageUrl: '', 
        caption: '',
        imageResolution: 'auto',
        imageType: 'fill',
        imagePosition: 'center',
        altText: '',
      };
    case 'quiz':
      return {
        ...base,
        question: '',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctIndex: 0,
      };
    case 'columns':
      return {
        ...base,
        columns: 2,
        columnGap: 16,
        children: [[], []], // Two empty columns
      };
  }
}
