'use client';

import React from 'react';

export type StatusType =
  | 'available_today'
  | 'available_tomorrow'
  | 'offline'
  | 'applied'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  label?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showDot = true,
  className = '',
  ...props
}) => {
  const getDefaultLabel = () => {
    switch (status) {
      case 'available_today':
        return 'Available Today';
      case 'available_tomorrow':
        return 'Available Tomorrow';
      case 'offline':
        return 'Off / Unavailable';
      case 'applied':
        return 'Applied · Waiting';
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const displayText = label || getDefaultLabel();
  const classes = ['ui-status-badge', `ui-status-${status}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {showDot && <span className={`ui-status-dot ${status === 'available_today' ? 'pulse' : ''}`} />}
      <span>{displayText}</span>
    </div>
  );
};
