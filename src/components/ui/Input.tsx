'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="ui-field-group">
        {label && (
          <label htmlFor={inputId} className="ui-field-label">
            {label}
          </label>
        )}
        <div className={`ui-input-container ${error ? 'ui-input-error' : ''}`}>
          {leftIcon && <span className="ui-input-icon left">{leftIcon}</span>}
          <input id={inputId} ref={ref} className={`ui-input ${className}`} {...props} />
          {rightIcon && <span className="ui-input-icon right">{rightIcon}</span>}
        </div>
        {error ? (
          <p className="ui-field-error">{error}</p>
        ) : helperText ? (
          <p className="ui-field-helper">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="ui-field-group">
        {label && (
          <label htmlFor={textareaId} className="ui-field-label">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`ui-textarea ${error ? 'ui-textarea-error' : ''} ${className}`}
          {...props}
        />
        {error ? (
          <p className="ui-field-error">{error}</p>
        ) : helperText ? (
          <p className="ui-field-helper">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
