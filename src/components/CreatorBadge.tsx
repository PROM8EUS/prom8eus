import React from 'react';
import { AppIcon } from '@/components/AppIcon';

export interface CreatorBadgeProps {
  name?: string;
  avatarUrl?: string;
  email?: string;
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
  email,
  verified = false,
  size = 'sm',
  className = ''
}) => {
  const [imageError, setImageError] = React.useState(false);
  const isCommunity = (name || '').toLowerCase().includes('community');
  const s = sizeMap[size];

  const getInitials = (value?: string) => {
    if (!value) return '??';
    const parts = value.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('');
  };

  const colorPalette = ['#6366F1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#f59e0b', '#10b981'];
  const getColor = (value?: string) => {
    if (!value) return '#94a3b8';
    let hash = 0;
    for (const ch of value) {
      hash = (hash << 5) - hash + ch.charCodeAt(0);
      hash |= 0;
    }
    const index = Math.abs(hash) % colorPalette.length;
    return colorPalette[index];
  };

  const resolvedAvatar = imageError ? undefined : avatarUrl;
  const fallbackInitials = getInitials(name || email);
  const fallbackColor = getColor(name || email);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {resolvedAvatar ? (
        <img
          src={resolvedAvatar}
          alt={name || 'Creator'}
          className={`${s.img} rounded-full object-cover`}
          onError={() => setImageError(true)}
        />
      ) : isCommunity ? (
        <AppIcon
          tool={{ id: 'n8n', name: 'n8n', logo: { alt: 'n8n', backgroundColor: '#FF6B6B' }, pricing: 'Free', automationPotential: 0 } as any}
          size="sm"
        />
      ) : (
        <div
          className={`${s.img} rounded-full flex items-center justify-center text-white text-xs font-semibold`}
          style={{ backgroundColor: fallbackColor }}
          aria-hidden
        >
          {fallbackInitials}
        </div>
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
