import type { QuizBlock } from '../types';

interface QuizBlockViewProps {
  block: QuizBlock;
  isSelected: boolean;
  isEditing?: boolean;
  isPreview: boolean;
  onUpdate: (updates: Partial<QuizBlock>) => void;
}

export function QuizBlockView({ block, isSelected, isEditing = false, isPreview, onUpdate }: QuizBlockViewProps) {
  if (isPreview || !isEditing) {
    // Read-only view
    const isMultipleChoice = block.quizType === 'multiple-choice';
    
    return (
      <div className="block-view quiz-block-view">
        <div className="block-question">
          {block.question ? (
            <div dangerouslySetInnerHTML={{ __html: block.question }} />
          ) : (
            <em className="empty-field">No question</em>
          )}
        </div>
        <div className={`block-options ${isMultipleChoice ? 'multiple-choice' : ''}`}>
          {block.options.map((option, index) => (
            <div
              key={index}
              className={`block-option ${isMultipleChoice ? 'multiple-choice-option' : ''} ${
                index === block.correctIndex ? 'correct' : ''
              }`}
            >
              {isMultipleChoice && (
                <input
                  type="radio"
                  name={`quiz-${block.id}`}
                  checked={false}
                  readOnly
                  className="quiz-radio-button"
                />
              )}
              <span className="option-text">{option || <em className="empty-field">Empty option</em>}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Inline editing view
  const handleAddOption = () => {
    const newOptions = [...block.options, ''];
    onUpdate({ options: newOptions });
  };

  const handleDeleteOption = (index: number) => {
    if (block.options.length <= 1) return; // Keep at least one option
    const newOptions = block.options.filter((_, i) => i !== index);
    const newCorrectIndex = 
      block.correctIndex === index 
        ? 0 // If deleted option was correct, set first option as correct
        : block.correctIndex > index 
          ? block.correctIndex - 1 // Adjust correct index if needed
          : block.correctIndex;
    onUpdate({ options: newOptions, correctIndex: newCorrectIndex });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...block.options];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  return (
    <div className="block-view quiz-block-view quiz-block-edit">
      <div className="block-edit-field">
        <label className="block-edit-label">QUESTION</label>
        <textarea
          value={block.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          className="block-edit-textarea"
          placeholder="Enter question..."
          rows={3}
        />
      </div>
      <div className="block-edit-field">
        <label className="block-edit-label">OPTIONS</label>
        <div className="block-options-edit">
          {block.options.map((option, index) => (
            <div key={index} className="block-option-edit-row">
              <button
                type="button"
                className={`quiz-edit-radio ${block.correctIndex === index ? 'selected' : ''}`}
                onClick={() => onUpdate({ correctIndex: index })}
                aria-label={`Mark option ${index + 1} as correct`}
              >
                {block.correctIndex === index ? (
                  <svg className="quiz-radio-check" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg className="quiz-radio-x" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3L9 9M9 3L3 9" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="block-edit-input block-option-input"
                placeholder={`Option ${index + 1}`}
              />
              {block.options.length > 1 && (
                <button
                  type="button"
                  className="block-option-delete"
                  onClick={() => handleDeleteOption(index)}
                  aria-label={`Delete option ${index + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="block-add-option-button"
          onClick={handleAddOption}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Add option</span>
        </button>
      </div>
    </div>
  );
}
