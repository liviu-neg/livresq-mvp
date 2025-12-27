import type { QuizBlock } from '../types';

interface QuizBlockViewProps {
  block: QuizBlock;
  isSelected: boolean;
  isPreview: boolean;
  onUpdate: (updates: Partial<QuizBlock>) => void;
}

export function QuizBlockView({ block, isSelected, isPreview, onUpdate }: QuizBlockViewProps) {
  if (isPreview || !isSelected) {
    // Read-only view
    return (
      <div className="block-view quiz-block-view">
        <div className="block-question">
          {block.question || <em className="empty-field">No question</em>}
        </div>
        <div className="block-options">
          {block.options.map((option, index) => (
            <div
              key={index}
              className={`block-option ${
                index === block.correctIndex ? 'correct' : ''
              }`}
            >
              {option || <em className="empty-field">Empty option</em>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Inline editing view
  return (
    <div className="block-view quiz-block-view">
      <div className="block-edit-field">
        <label className="block-edit-label">Question</label>
        <textarea
          value={block.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          className="block-edit-textarea"
          placeholder="Enter question..."
          rows={3}
        />
      </div>
      <div className="block-edit-field">
        <label className="block-edit-label">Options</label>
        <div className="block-options-edit">
          {block.options.map((option, index) => (
            <div key={index} className="block-option-edit-row">
              <input
                type="radio"
                name={`correct-${block.id}`}
                checked={block.correctIndex === index}
                onChange={() => onUpdate({ correctIndex: index })}
                className="block-option-radio"
                aria-label={`Mark option ${index + 1} as correct`}
              />
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...block.options] as [string, string, string, string];
                  newOptions[index] = e.target.value;
                  onUpdate({ options: newOptions });
                }}
                className="block-edit-input block-option-input"
                placeholder={`Option ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
