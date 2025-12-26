import type { ImageBlock } from '../types';

interface ImageBlockViewProps {
  block: ImageBlock;
  isSelected: boolean;
  isPreview: boolean;
  onUpdate: (updates: Partial<ImageBlock>) => void;
}

export function ImageBlockView({ block, isSelected, isPreview, onUpdate }: ImageBlockViewProps) {
  if (isPreview || !isSelected) {
    // Read-only view
    return (
      <div 
        className="block-view image-block-view"
        style={{
          borderRadius: 'var(--radius-md)',
        }}
      >
        {block.imageUrl ? (
          <div
            className="block-image-container"
            style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              width: '100%',
              aspectRatio: '16 / 9',
              position: 'relative',
              backgroundColor: '#f5f5f5',
            }}
          >
            <img
              src={block.imageUrl}
              alt={block.altText || block.caption || block.title}
              className="block-image"
              style={{
                width: '100%',
                height: '100%',
                objectFit: block.imageType === 'fit' ? 'contain' : block.imageType === 'stretch' ? 'fill' : 'cover',
                objectPosition: block.imagePosition || 'center',
                borderRadius: 'var(--radius-md)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div 
            className="block-image-placeholder"
            style={{
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid var(--color-border)`,
              color: 'var(--color-muted-text)',
            }}
          >
            No image URL provided
          </div>
        )}
        {block.caption && (
          <p 
            className="block-caption"
            style={{
              marginTop: 'var(--spacing-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-muted-text)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {block.caption}
          </p>
        )}
      </div>
    );
  }

  // Inline editing view
  return (
    <div 
      className="block-view image-block-view"
      style={{
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div 
        className="block-edit-field"
        style={{
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <label 
          className="block-edit-label"
          style={{
            display: 'block',
            marginBottom: 'var(--spacing-sm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Image URL
        </label>
        <input
          type="text"
          value={block.imageUrl}
          onChange={(e) => onUpdate({ imageUrl: e.target.value })}
          className="block-edit-input"
          placeholder="https://example.com/image.jpg"
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            border: `1px solid var(--color-border)`,
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text)',
          }}
        />
      </div>
      {block.imageUrl && (
        <div 
          className="block-image-preview"
          style={{
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div
            className="block-image-container"
            style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              width: '100%',
              aspectRatio: '16 / 9',
              position: 'relative',
              backgroundColor: '#f5f5f5',
            }}
          >
            <img
              src={block.imageUrl}
              alt={block.altText || block.caption || block.title}
              className="block-image"
              style={{
                width: '100%',
                height: '100%',
                objectFit: block.imageType === 'fit' ? 'contain' : block.imageType === 'stretch' ? 'fill' : 'cover',
                objectPosition: block.imagePosition || 'center',
                borderRadius: 'var(--radius-md)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
      <div className="block-edit-field">
        <label 
          className="block-edit-label"
          style={{
            display: 'block',
            marginBottom: 'var(--spacing-sm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Caption
        </label>
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          className="block-edit-input"
          placeholder="Enter caption..."
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            border: `1px solid var(--color-border)`,
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text)',
          }}
        />
      </div>
    </div>
  );
}
