import React, { useRef, useState } from 'react';
import type { ImageBlock } from '../types';
import { ChevronDown, Grid3x3, X } from 'lucide-react';

interface ImageFillModalProps {
  block: ImageBlock;
  onUpdate: (updates: Partial<ImageBlock>) => void;
  onClose: () => void;
}

export function ImageFillModal({ block, onUpdate, onClose }: ImageFillModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(block.imageUrl || null);

  // Default values
  const resolution = block.imageResolution || 'auto';
  const imageType = block.imageType || 'fill';
  const position = block.imagePosition || 'center';
  const altText = block.altText || '';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        onUpdate({ imageUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleResolutionChange = (value: 'auto' | '1x' | '2x' | '3x') => {
    onUpdate({ imageResolution: value });
  };

  const handleTypeChange = (value: 'fill' | 'fit' | 'stretch') => {
    onUpdate({ imageType: value });
  };

  const handlePositionChange = (value: ImageBlock['imagePosition']) => {
    onUpdate({ imagePosition: value });
  };

  const handleAltTextChange = (value: string) => {
    onUpdate({ altText: value });
  };

  const handleImageUrlChange = (value: string) => {
    onUpdate({ imageUrl: value });
    setImagePreview(value);
  };

  const positionOptions: Array<{ value: ImageBlock['imagePosition']; label: string }> = [
    { value: 'center', label: 'Center' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div className="image-fill-modal-overlay" onClick={onClose}>
      <div className="image-fill-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="image-fill-modal-header">
          <h3 className="image-fill-modal-title">Fill</h3>
          <button
            type="button"
            className="image-fill-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Preview/Upload Area */}
        <div className="image-fill-modal-preview-area">
          {imagePreview ? (
            <div className="image-fill-modal-preview-container">
              <img
                src={imagePreview}
                alt={altText || block.caption || block.title}
                className="image-fill-modal-preview-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <button
                type="button"
                className="image-fill-modal-change-button"
                onClick={handleChooseImage}
              >
                Change Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="image-fill-modal-upload-area">
              <button
                type="button"
                className="image-fill-modal-upload-button"
                onClick={handleChooseImage}
              >
                Choose Image...
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="image-fill-modal-settings">
          {/* Resolution */}
          <div className="image-fill-modal-setting-row">
            <label className="image-fill-modal-label">Resolution</label>
            <div className="image-fill-modal-dropdown-wrapper">
              <select
                value={resolution}
                onChange={(e) => handleResolutionChange(e.target.value as 'auto' | '1x' | '2x' | '3x')}
                className="image-fill-modal-dropdown"
              >
                <option value="auto">Auto</option>
                <option value="1x">1x</option>
                <option value="2x">2x</option>
                <option value="3x">3x</option>
              </select>
              <ChevronDown size={16} className="image-fill-modal-dropdown-icon" />
            </div>
          </div>

          {/* Type */}
          <div className="image-fill-modal-setting-row">
            <label className="image-fill-modal-label">Type</label>
            <div className="image-fill-modal-dropdown-wrapper">
              <select
                value={imageType}
                onChange={(e) => handleTypeChange(e.target.value as 'fill' | 'fit' | 'stretch')}
                className="image-fill-modal-dropdown"
              >
                <option value="fill">Fill</option>
                <option value="fit">Fit</option>
                <option value="stretch">Stretch</option>
              </select>
              <ChevronDown size={16} className="image-fill-modal-dropdown-icon" />
            </div>
          </div>

          {/* Position */}
          <div className="image-fill-modal-setting-row">
            <label className="image-fill-modal-label">Position</label>
            <div className="image-fill-modal-dropdown-wrapper">
              {position === 'center' && (
                <Grid3x3 size={16} className="image-fill-modal-position-icon" />
              )}
              <select
                value={position}
                onChange={(e) => handlePositionChange(e.target.value as ImageBlock['imagePosition'])}
                className="image-fill-modal-dropdown"
              >
                {positionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="image-fill-modal-dropdown-icon" />
            </div>
          </div>

          {/* Alt Text */}
          <div className="image-fill-modal-setting-row">
            <label className="image-fill-modal-label">Alt Text</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => handleAltTextChange(e.target.value)}
              className="image-fill-modal-input"
              placeholder="Describe Image..."
            />
          </div>
        </div>

        {/* URL Input (below other settings) */}
        <div className="image-fill-modal-url-section">
          <div className="image-fill-modal-setting-row">
            <label className="image-fill-modal-label">URL</label>
            <input
              type="text"
              value={block.imageUrl || ''}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              className="image-fill-modal-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="image-fill-modal-actions">
          <button 
            type="button" 
            className="image-fill-modal-action-button image-fill-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="image-fill-modal-action-button image-fill-modal-ok"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

