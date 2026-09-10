'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  wrapperClassName?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  wrapperClassName = '',
  className = '',
  ...props
}) => {
  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div className={`ui-search-wrapper ${wrapperClassName}`}>
      <span className="ui-search-icon">
        <Search size={18} />
      </span>
      <input
        type="text"
        className={`ui-search-input ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {hasValue && onClear && (
        <button
          type="button"
          className="ui-search-clear"
          onClick={onClear}
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};
