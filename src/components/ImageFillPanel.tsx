import React, { useState } from 'react';
import type { ImageBlock } from '../types';
import { ChevronDown, Grid3x3 } from 'lucide-react';

interface ImageFillPanelProps {
  block: ImageBlock;
  onUpdate: (updates: Partial<ImageBlock>) => void;
}

export function ImageFillPanel({ block, onUpdate }: ImageFillPanelProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Default values
  const resolution = block.imageResolution || 'auto';
  const imageType = block.imageType || 'fill';
  const position = block.imagePosition || 'center';
  const altText = block.altText || '';

  // Mock image sources for the radio buttons (in real app, these would be different image variants)
  const imageSources = [
    block.imageUrl,
    block.imageUrl,
    block.imageUrl,
    block.imageUrl,
    block.imageUrl,
  ];

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
  };

  const handleCaptionChange = (value: string) => {
    onUpdate({ caption: value });
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
    <div className="image-fill-panel">
      {/* Header */}
      <div className="image-fill-header">
        <h3 className="image-fill-title">Fill</h3>
      </div>

      {/* Image Selection with Radio Buttons */}
      {block.imageUrl && (
        <div className="image-fill-selection">
          <div className="image-fill-radio-group">
            {imageSources.map((src, index) => (
              <button
                key={index}
                type="button"
                className={`image-fill-radio ${selectedImageIndex === index ? 'active' : ''}`}
                onClick={() => setSelectedImageIndex(index)}
                aria-label={`Image option ${index + 1}`}
              >
                {selectedImageIndex === index && (
                  <div className="image-fill-radio-indicator" />
                )}
              </button>
            ))}
          </div>

          {/* Image Preview */}
          <div className="image-fill-preview">
            <img
              src={block.imageUrl}
              alt={altText || block.caption || block.title}
              className="image-fill-preview-img"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Image URL Input */}
      <div className="property-group">
        <label htmlFor="imageUrl">Image URL</label>
        <input
          id="imageUrl"
          type="text"
          value={block.imageUrl}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          className="property-input"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Resolution Dropdown */}
      <div className="property-group">
        <label htmlFor="resolution">Resolution</label>
        <div className="image-fill-dropdown-wrapper">
          <select
            id="resolution"
            value={resolution}
            onChange={(e) => handleResolutionChange(e.target.value as 'auto' | '1x' | '2x' | '3x')}
            className="image-fill-dropdown"
          >
            <option value="auto">Auto</option>
            <option value="1x">1x</option>
            <option value="2x">2x</option>
            <option value="3x">3x</option>
          </select>
          <ChevronDown size={16} className="image-fill-dropdown-icon" />
        </div>
      </div>

      {/* Type Dropdown */}
      <div className="property-group">
        <label htmlFor="type">Type</label>
        <div className="image-fill-dropdown-wrapper">
          <select
            id="type"
            value={imageType}
            onChange={(e) => handleTypeChange(e.target.value as 'fill' | 'fit' | 'stretch')}
            className="image-fill-dropdown"
          >
            <option value="fill">Fill</option>
            <option value="fit">Fit</option>
            <option value="stretch">Stretch</option>
          </select>
          <ChevronDown size={16} className="image-fill-dropdown-icon" />
        </div>
      </div>

      {/* Position Dropdown */}
      <div className="property-group">
        <label htmlFor="position">Position</label>
        <div className="image-fill-dropdown-wrapper">
          <select
            id="position"
            value={position}
            onChange={(e) => handlePositionChange(e.target.value as ImageBlock['imagePosition'])}
            className="image-fill-dropdown"
          >
            {positionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {position === 'center' && (
            <Grid3x3 size={16} className="image-fill-position-indicator" />
          )}
          <ChevronDown size={16} className="image-fill-dropdown-icon" />
        </div>
      </div>

      {/* Alt Text Input */}
      <div className="property-group">
        <label htmlFor="altText">Alt Text</label>
        <input
          id="altText"
          type="text"
          value={altText}
          onChange={(e) => handleAltTextChange(e.target.value)}
          className="property-input"
          placeholder="Enter alt text..."
        />
      </div>

      {/* Caption Input */}
      <div className="property-group">
        <label htmlFor="caption">Caption</label>
        <input
          id="caption"
          type="text"
          value={block.caption}
          onChange={(e) => handleCaptionChange(e.target.value)}
          className="property-input"
          placeholder="Enter caption..."
        />
      </div>

      {/* Action Buttons */}
      <div className="image-fill-actions">
        <button type="button" className="image-fill-action-button">
          Crop
        </button>
        <button type="button" className="image-fill-action-button">
          Plugins
        </button>
      </div>
    </div>
  );
}

