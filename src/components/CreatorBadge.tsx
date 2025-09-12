import React from 'react';
import { AppIcon } from '@/components/AppIcon';

export interface CreatorBadgeProps {
  name?: string;
  avatarUrl?: string;
  verified?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeMap = {
  sm: { img: 'w-6 h-6', text: 'text-xs' },
  md: { img: 'w-8 h-8', text: 'text-sm' }
} as const;

export const CreatorBadge: React.FC<CreatorBadgeProps> = ({
  name,
  avatarUrl,
  verified = false,
  size = 'sm',
  className = ''
}) => {
  const isCommunity = (name || '').toLowerCase().includes('community');
  const s = sizeMap[size];

  const gravatarFromName = (n?: string) => {
    if (!n) return undefined;
    const key = encodeURIComponent(n.trim().toLowerCase());
    const px = size === 'md' ? 64 : 48;
    return `https://gravatar.com/avatar/${key}?r=pg&d=retro&size=${px}`;
  };

  const resolvedAvatar = avatarUrl || (isCommunity ? undefined : gravatarFromName(name));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {resolvedAvatar ? (
        <img
          src={resolvedAvatar}
          alt={name || 'Creator'}
          className={`${s.img} rounded-full object-cover`}
        />
      ) : isCommunity ? (
        <AppIcon
          tool={{ id: 'n8n', name: 'n8n', logo: { alt: 'n8n', backgroundColor: '#FF6B6B' }, pricing: 'Free', automationPotential: 0 } as any}
          size="sm"
        />
      ) : (
        <div className={`${s.img} rounded-full bg-gray-200`} />
      )}

      {name && (
        <div className={`flex items-center gap-1 ${s.text} text-gray-600`}>
          <span className="truncate max-w-[160px]" title={name}>{name}</span>
          {verified && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-[10px]" title="Verified">✓</span>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatorBadge;
