import type { Block, TextBlock, HeaderBlock, ImageBlock, QuizBlock, ColumnsBlock, Row } from '../types';
import { ImageFillPanel } from './ImageFillPanel';
import { nanoid } from 'nanoid';

interface PropertiesPanelProps {
  selectedBlock: Block | null;
  selectedRow?: Row | null;
  onUpdateBlock: (block: Block) => void;
  onUpdateRow?: (row: Row) => void;
  onDeleteBlock: () => void;
}

export function PropertiesPanel({
  selectedBlock,
  selectedRow,
  onUpdateBlock,
  onUpdateRow,
  onDeleteBlock,
}: PropertiesPanelProps) {
  // Check if selected row is a columns block
  const isColumnsBlockRow = selectedRow?.props?.isColumnsBlock === true;

  if (!selectedBlock && !isColumnsBlockRow) {
    return (
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <p className="properties-empty">Select a block or row to edit</p>
        </div>
      </div>
    );
  }

  // If columns block row is selected, show column controls
  if (isColumnsBlockRow && selectedRow) {
    const columns = (selectedRow.props?.columns as number) || 2;
    const columnGap = (selectedRow.props?.columnGap as number) || 16;

    const handleUpdateColumns = (updates: { columns?: number; columnGap?: number }) => {
      if (!onUpdateRow) return;
      
      if (updates.columns !== undefined) {
        const currentColumns = columns;
        const newColumns = updates.columns;
        
        if (newColumns > currentColumns) {
          // Add empty cells
          const newCells = [...selectedRow.cells];
          for (let i = currentColumns; i < newColumns; i++) {
            newCells.push({ id: nanoid(), resources: [] });
          }
          onUpdateRow({
            ...selectedRow,
            cells: newCells,
            props: {
              ...selectedRow.props,
              columns: newColumns,
            },
          });
        } else if (newColumns < currentColumns) {
          // Merge extra cells into the last remaining cell
          const newCells = [...selectedRow.cells];
          const lastCell = newCells[newColumns - 1];
          for (let i = newColumns; i < currentColumns; i++) {
            lastCell.resources.push(...newCells[i].resources);
          }
          newCells.splice(newColumns);
          onUpdateRow({
            ...selectedRow,
            cells: newCells,
            props: {
              ...selectedRow.props,
              columns: newColumns,
            },
          });
        }
      } else if (updates.columnGap !== undefined) {
        onUpdateRow({
          ...selectedRow,
          props: {
            ...selectedRow.props,
            columnGap: updates.columnGap,
          },
        });
      }
    };

    return (
      <div className="properties-panel">
        <h2 className="properties-title">Properties</h2>
        <div className="properties-content">
          <div className="property-group">
            <label htmlFor="columns-count">Number of Columns</label>
            <div className="columns-count-selector">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`column-count-button ${columns === count ? 'active' : ''}`}
                  onClick={() => handleUpdateColumns({ columns: count })}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <div className="property-group">
            <label htmlFor="column-gap">
              Column Gap: {columnGap}px
            </label>
            <input
              id="column-gap"
              type="range"
              min="8"
              max="32"
              step="4"
              value={columnGap}
              onChange={(e) =>
                handleUpdateColumns({ columnGap: parseInt(e.target.value, 10) })
              }
              className="property-range"
            />
          </div>
        </div>
      </div>
    );
  }

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
                value={(selectedBlock as QuizBlock).quizType || 'multiple-choice'}
                onChange={(e) =>
                  handleUpdate({
                    quizType: e.target.value as 'multiple-choice' | 'other',
                  } as Partial<QuizBlock>)
                }
                className="property-select"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="other">Other</option>
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
                      placeholder={`Option ${index + 1}`}
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
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`column-count-button ${(selectedBlock as ColumnsBlock).columns === count ? 'active' : ''}`}
                    onClick={() => {
                      const columnsBlock = selectedBlock as ColumnsBlock;
                      const currentColumns = columnsBlock.columns;
                      const newColumns = count;
                      
                      if (newColumns > currentColumns) {
                        // Add empty cells (columns)
                        const newCells = [...columnsBlock.row.cells];
                        for (let i = currentColumns; i < newColumns; i++) {
                          newCells.push({ id: crypto.randomUUID(), resources: [] });
                        }
                        handleUpdate({
                          columns: newColumns,
                          row: {
                            ...columnsBlock.row,
                            cells: newCells,
                            props: {
                              ...columnsBlock.row.props,
                              columns: newColumns,
                            },
                          },
                        } as Partial<ColumnsBlock>);
                      } else if (newColumns < currentColumns) {
                        // Merge extra cells into the last remaining cell
                        const newCells = [...columnsBlock.row.cells];
                        const lastCell = newCells[newColumns - 1];
                        for (let i = newColumns; i < currentColumns; i++) {
                          lastCell.resources.push(...newCells[i].resources);
                        }
                        newCells.splice(newColumns);
                        handleUpdate({
                          columns: newColumns,
                          row: {
                            ...columnsBlock.row,
                            cells: newCells,
                            props: {
                              ...columnsBlock.row.props,
                              columns: newColumns,
                            },
                          },
                        } as Partial<ColumnsBlock>);
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
                    row: {
                      ...(selectedBlock as ColumnsBlock).row,
                      props: {
                        ...(selectedBlock as ColumnsBlock).row.props,
                        columnGap: parseInt(e.target.value, 10),
                      },
                    },
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
