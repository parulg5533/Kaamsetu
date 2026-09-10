'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = '88vh',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="ui-sheet-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ui-sheet-container" style={{ maxHeight }}>
        <div className="ui-sheet-handle" />

        <div className="ui-sheet-header">
          <div className="ui-sheet-title-group">
            <h2 className="ui-sheet-title">{title}</h2>
            {subtitle && <div className="ui-sheet-subtitle">{subtitle}</div>}
          </div>
          <button
            type="button"
            className="ui-sheet-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ui-sheet-body">{children}</div>

        {footer && <div className="ui-sheet-footer">{footer}</div>}
      </div>
    </div>
  );
};
