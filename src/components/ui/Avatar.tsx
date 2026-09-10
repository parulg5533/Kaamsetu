'use client';

import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: AvatarSize;
  isVerified?: boolean;
  imageUrl?: string | null;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  isVerified = false,
  imageUrl,
  className = '',
  ...props
}) => {
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
  const classes = ['ui-avatar-wrapper', `ui-avatar-${size}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      <div className="ui-avatar-circle">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="ui-avatar-img" />
        ) : (
          <span className="ui-avatar-initial">{initial}</span>
        )}
      </div>
      {isVerified && (
        <span className="ui-avatar-verified" title="Verified Worker">
          <Check size={size === 'sm' ? 8 : size === 'lg' ? 12 : 10} strokeWidth={3.5} />
        </span>
      )}
    </div>
  );
};
