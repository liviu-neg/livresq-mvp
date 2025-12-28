import React from 'react';

// SVG Icons
const DesignedSectionIcon = () => (
  <svg width="51" height="36" fill="none" viewBox="0 0 51 36" className="symbol symbol-emptyStateDesignedSection">
    <rect width="50" height="30" x=".5" y="3" fill="#fff" stroke="#000" rx="1.5"></rect>
    <path stroke="#000" strokeMiterlimit="10" d="M36.5 16.5h10m-10 4H44"></path>
    <path fill="#F4F2FF" d="M1 4.5a1 1 0 011-1h30v29H2a1 1 0 01-1-1v-27z"></path>
    <path stroke="#000" d="M32.5 3.5v29"></path>
    <path fill="#fff" stroke="#000" d="M24.996 24.5H8.014l5.95-7.747 4.686 4.604.285.28.336-.217 2.287-1.474 3.438 4.554zM24.5 12.5a2 2 0 10-4 0 2 2 0 004 0z"></path>
  </svg>
);

const AISectionIcon = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 36 36" className="symbol symbol-emptyStateAISection">
    <path fill="#fff" stroke="#000" d="M28.424 1.5h.152a7.073 7.073 0 001.92 3.503A7.027 7.027 0 0034 6.924v.152a7.155 7.155 0 00-3.502 1.919 7.027 7.027 0 00-1.922 3.505h-.152a7.154 7.154 0 00-1.919-3.502A7.027 7.027 0 0023 7.076v-.152a7.155 7.155 0 003.502-1.919A7.027 7.027 0 0028.424 1.5z"></path>
    <path fill="#F4F2FF" stroke="#000" d="M14.878 8.5h.244c.623 3.108 2.628 5.882 4.811 8.065 2.164 2.186 4.958 4.19 8.067 4.813v.244c-3.11.625-5.884 2.651-8.064 4.81-2.187 2.165-4.19 4.959-4.814 8.068h-.244c-.625-3.11-2.651-5.884-4.81-8.064-2.165-2.187-4.959-4.19-8.068-4.814v-.244c3.11-.625 5.883-2.651 8.064-4.81 2.187-2.165 4.19-4.959 4.814-8.068z"></path>
  </svg>
);

const AddElementsIcon = () => (
  <svg width="59" height="36" fill="none" viewBox="0 0 59 36" className="symbol symbol-emptyStateAddElement">
    <rect width="30" height="29" x=".55" y="5.147" fill="#F4F2FF" stroke="#000" rx="1.5" transform="rotate(-6 .55 5.147)"></rect>
    <path fill="#fff" stroke="#000" d="M9.071 19.256l.052.497.498-.052 2.538-.267c-1.699 1.634-2.657 3.924-2.4 6.364l.052.497.497-.052 15.913-1.673.497-.052-.052-.497c-.257-2.44-1.67-4.48-3.672-5.726l2.539-.267.497-.052-.052-.497c-.46-4.382-4.653-7.477-9.282-6.99-4.628.486-8.086 4.385-7.625 8.767z"></path>
    <rect width="17.139" height="12.224" x="41.293" y="15.542" fill="#fff" stroke="#000" rx="1.5" transform="rotate(6 41.293 15.542)"></rect>
    <path stroke="#000" strokeMiterlimit="10" d="M44.418 20l9.945 1.045M44 23.978l6.962.732"></path>
    <path fill="#fff" stroke="#000" strokeMiterlimit="10" d="M46.333 4h-6.666C38.193 4 37 5.12 37 6.5S38.193 9 39.667 9h6.666C47.807 9 49 7.88 49 6.5S47.807 4 46.333 4z"></path>
  </svg>
);

interface EmptyStateRowProps {
  rowId: string;
}

export function EmptyStateRow({ rowId }: EmptyStateRowProps) {
  return (
    <div className="empty-state-row" data-row-id={rowId}>
      <div className="empty-state-row-content">
        <h3 className="empty-state-row-title">Choose your starting point</h3>
        <div className="empty-state-row-buttons">
          <button type="button" className="empty-state-row-button">
            <DesignedSectionIcon />
            <span>Designed Section</span>
          </button>
          <button type="button" className="empty-state-row-button">
            <AISectionIcon />
            <span>AI Section Generator</span>
          </button>
          <button type="button" className="empty-state-row-button">
            <AddElementsIcon />
            <span>Add Elements</span>
          </button>
        </div>
      </div>
    </div>
  );
}

