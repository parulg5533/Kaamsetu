'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  closeLabel?: string;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Module-level state shared by every open sheet.
let scrollLockCount = 0;
let savedBodyOverflow = '';
const sheetStack: string[] = []; // ids of open sheets, top-most last

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = '88vh',
  closeLabel = 'Close',
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const id = titleId;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Scroll lock: first open records the previous value, last close restores it.
    if (scrollLockCount === 0) savedBodyOverflow = document.body.style.overflow;
    scrollLockCount += 1;
    document.body.style.overflow = 'hidden';
    sheetStack.push(id);

    const getFocusables = (): HTMLElement[] =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];

    // Move focus into the sheet: first focusable, else the panel itself.
    const initial = getFocusables()[0];
    (initial ?? panel)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only the top-most sheet reacts to keys.
      if (sheetStack[sheetStack.length - 1] !== id) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && panel) {
        const items = getFocusables();
        if (items.length === 0) {
          e.preventDefault();
          panel.focus();
          return;
        }
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const inside = !!active && panel.contains(active);

        if (e.shiftKey) {
          if (!inside || active === firstEl || active === panel) {
            e.preventDefault();
            lastEl.focus();
          }
        } else if (!inside || active === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      const index = sheetStack.lastIndexOf(id);
      if (index >= 0) sheetStack.splice(index, 1);

      scrollLockCount = Math.max(0, scrollLockCount - 1);
      if (scrollLockCount === 0) document.body.style.overflow = savedBodyOverflow;

      if (previouslyFocused && document.contains(previouslyFocused) && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, titleId]);

  if (!isOpen) return null;

  return (
    <div
      className="sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="sheet-window"
        style={{ maxHeight, outline: 'none' }}
      >
        <div className="sheet-drag-handle" />

        <div className="sheet-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h2 id={titleId} className="sheet-title">
              {title}
            </h2>
            {subtitle && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            className="sheet-close-btn"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sheet-body">{children}</div>

        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>
  );
};
