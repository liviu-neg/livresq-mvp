import type { Block, TextBlock, HeaderBlock, ImageBlock, QuizBlock, ColumnsBlock } from '../types';
import { ImageFillPanel } from './ImageFillPanel';

interface PropertiesPanelProps {
  selectedBlock: Block | null;
  onUpdateBlock: (block: Block) => void;
  onDeleteBlock: () => void;
}

export function PropertiesPanel({
  selectedBlock,
  onUpdateBlock,
  onDeleteBlock,
}: PropertiesPanelProps) {
  if (!selectedBlock) {
    return (
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <p className="properties-empty">Select a block to edit</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<Block>) => {
    onUpdateBlock({ ...selectedBlock, ...updates });
  };

  return (
    <div className="properties-panel">
      <h2 className="properties-title">Properties</h2>
      <div className="properties-content">
        <div className="property-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={selectedBlock.title}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            className="property-input"
          />
        </div>

        {(selectedBlock.type === 'text' || selectedBlock.type === 'header') && (
          <div className="property-group">
            <label htmlFor="body">Body</label>
            <textarea
              id="body"
              value={(selectedBlock as TextBlock | HeaderBlock).body}
              onChange={(e) =>
                handleUpdate({ body: e.target.value } as Partial<TextBlock | HeaderBlock>)
              }
              className="property-textarea"
              rows={6}
            />
          </div>
        )}

        {selectedBlock.type === 'image' && (
          <ImageFillPanel
            block={selectedBlock as ImageBlock}
            onUpdate={handleUpdate}
          />
        )}

        {selectedBlock.type === 'quiz' && (
          <>
            <div className="property-group">
              <label htmlFor="quiz-type">Quiz Type</label>
              <select
                id="quiz-type"
                value={(selectedBlock as QuizBlock).quizType}
                onChange={(e) =>
                  handleUpdate({
                    quizType: e.target.value,
                  } as Partial<QuizBlock>)
                }
                className="property-select"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>
            <div className="property-group">
              <label htmlFor="question">Question</label>
              <textarea
                id="question"
                value={(selectedBlock as QuizBlock).question}
                onChange={(e) =>
                  handleUpdate({
                    question: e.target.value,
                  } as Partial<QuizBlock>)
                }
                className="property-textarea"
                rows={3}
              />
            </div>
            {(selectedBlock as QuizBlock).quizType === 'multiple-choice' && (
              <div className="property-group">
                <label>Options</label>
                {(selectedBlock as QuizBlock).options.map((option, index) => (
                  <div key={index} className="option-row">
                    <input
                      type="radio"
                      name="correct"
                      checked={(selectedBlock as QuizBlock).correctIndex === index}
                      onChange={() =>
                        handleUpdate({
                          correctIndex: index,
                        } as Partial<QuizBlock>)
                      }
                      className="option-radio"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [
                          ...(selectedBlock as QuizBlock).options,
                        ];
                        newOptions[index] = e.target.value;
                        handleUpdate({ options: newOptions } as Partial<QuizBlock>);
                      }}
                      className="property-input option-input"
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {selectedBlock.type === 'columns' && (
          <>
            <div className="property-group">
              <label htmlFor="columns-count">Number of Columns</label>
              <div className="columns-count-selector">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`column-count-button ${(selectedBlock as ColumnsBlock).columns === count ? 'active' : ''}`}
                    onClick={() => {
                      const columnsBlock = selectedBlock as ColumnsBlock;
                      const currentColumns = columnsBlock.columns;
                      const newColumns = count;
                      
                      if (newColumns > currentColumns) {
                        // Add empty columns
                        const newChildren = [...columnsBlock.children];
                        for (let i = currentColumns; i < newColumns; i++) {
                          newChildren.push([]);
                        }
                        handleUpdate({ columns: newColumns, children: newChildren } as Partial<ColumnsBlock>);
                      } else if (newColumns < currentColumns) {
                        // Merge extra columns into the last remaining column
                        const newChildren = [...columnsBlock.children];
                        const lastColumn = newChildren[newColumns - 1];
                        for (let i = newColumns; i < currentColumns; i++) {
                          lastColumn.push(...newChildren[i]);
                        }
                        newChildren.splice(newColumns);
                        handleUpdate({ columns: newColumns, children: newChildren } as Partial<ColumnsBlock>);
                      }
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
            <div className="property-group">
              <label htmlFor="column-gap">
                Column Gap: {(selectedBlock as ColumnsBlock).columnGap}px
              </label>
              <input
                id="column-gap"
                type="range"
                min="8"
                max="32"
                step="4"
                value={(selectedBlock as ColumnsBlock).columnGap}
                onChange={(e) =>
                  handleUpdate({
                    columnGap: parseInt(e.target.value, 10),
                  } as Partial<ColumnsBlock>)
                }
                className="property-range"
              />
            </div>
          </>
        )}

        <button
          className="delete-button"
          onClick={onDeleteBlock}
          type="button"
        >
          Delete Block
        </button>
      </div>
    </div>
  );
}
