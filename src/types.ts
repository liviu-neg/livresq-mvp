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
  quizType: 'multiple-choice' | 'other'; // Type of quiz
  question: string;
  options: string[]; // Dynamic array of options
  correctIndex: number;
}

export interface ColumnsBlock extends BaseBlock {
  type: 'columns';
  columns: number; // 2-4
  columnGap: number; // 8-32px, default 16
  row: Row; // The row containing the cells (one cell per column)
}

export type Block = TextBlock | HeaderBlock | ImageBlock | QuizBlock | ColumnsBlock;

export interface Lesson {
  blocks: Block[];
  sections?: Section[]; // New: sections-based structure
  rows?: Row[]; // New: Row/Cell/Resource model
}

/**
 * Row/Cell/Resource Model
 * 
 * Row = Top-level vertical stack on the canvas (equivalent to Section)
 * Cell = Children of a Row; cells flow horizontally
 * Resource = Container inside a Cell that holds actual content (Block or nested Constructor)
 * 
 * Constructor = Row + one or more Cells (a Row may contain multiple Cells)
 * Section = Row + exactly one Cell (a simple constructor)
 */

/**
 * Resource can be either:
 * - A Block (text, image, quiz, etc.)
 * - A Constructor (nested Row+Cells for complex layouts)
 */
export type Resource = Block | Constructor;

/**
 * Cell contains Resources that flow vertically
 */
export interface Cell {
  id: string;
  resources: Resource[]; // Vertical stack of resources
  props?: {
    verticalAlign?: 'top' | 'middle' | 'bottom'; // Vertical alignment of content
    padding?: {
      uniform?: number; // Uniform padding (all sides same)
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
      mode?: 'uniform' | 'individual'; // Padding mode
    };
    backgroundColor?: string; // Background color for the cell
    backgroundColorOpacity?: number; // Opacity for background color (0-1)
    backgroundImage?: string; // Background image URL for the cell
    backgroundImageOpacity?: number; // Opacity for background image (0-1)
    [key: string]: unknown;
  };
}

/**
 * Row contains Cells that flow horizontally
 */
export interface Row {
  id: string;
  cells: Cell[]; // Horizontal flow of cells
  props?: Record<string, unknown>; // Future: row-specific props (padding, background, etc.)
  isEmptyState?: boolean; // True if this is an empty state row (for adding new sections)
}

/**
 * Constructor is a Row (can be nested inside a Cell as a Resource)
 */
export type Constructor = Row;

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

/**
 * Section Template - defines a reusable section that can be placed on canvas
 * A section is a Row with one Cell containing multiple Blocks
 */
export interface SectionTemplate {
  id: string;
  name: string;
  description?: string;
  blocks: BlockType[]; // Array of block types that make up this section
  createSection: () => Row; // Function to create a Row with Cell containing the blocks
}

/**
 * Create predefined section templates
 */
export function createSectionTemplate(
  id: string,
  name: string,
  blockTypes: BlockType[]
): SectionTemplate {
  return {
    id,
    name,
    blocks: blockTypes,
    createSection: () => {
      const rowId = nanoid();
      const cellId = nanoid();
      const resources: Resource[] = blockTypes.map((blockType) => createBlock(blockType));
      
      return {
        id: rowId,
        cells: [
          {
            id: cellId,
            resources,
          },
        ],
      };
    },
  };
}

/**
 * Get all predefined section templates
 */
export function getPredefinedSections(): SectionTemplate[] {
  return [
    createSectionTemplate('header-text', 'Header + Text', ['header', 'text']),
    createSectionTemplate('header-image', 'Header + Image', ['header', 'image']),
    createSectionTemplate('header-quiz', 'Header + Quiz', ['header', 'quiz']),
    createSectionTemplate('header-text-columns', 'Header + Text + Columns', ['header', 'text', 'columns']),
  ];
}

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
        quizType: 'multiple-choice',
        question: 'Which of the following rivers is considered the longest in the world?',
        options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
        correctIndex: 1, // Nile is the correct answer
      };
    case 'columns':
      return {
        ...base,
        columns: 2,
        columnGap: 16,
        row: {
          id: nanoid(),
          cells: [
            { id: nanoid(), resources: [] },
            { id: nanoid(), resources: [] },
          ],
        },
      };
  }
}
