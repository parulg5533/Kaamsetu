'use client';

import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'neutral'
  | 'verified';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  icon,
  className = '',
  ...props
}) => {
  const classes = ['ui-badge', `ui-badge-${variant}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {icon && <span className="ui-badge-icon">{icon}</span>}
      <span>{children}</span>
    </div>
  );
};
