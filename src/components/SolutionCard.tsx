import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import IntegrationIcon from '@/components/IntegrationIcon';
import CreatorBadge from './CreatorBadge';

export interface SolutionData {
  id: string;
  name: string;
  filename?: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  type: 'workflow' | 'ai-agent';
  rating?: number;
  reviewCount?: number;
  triggerType?: 'Complex' | 'Webhook' | 'Manual' | 'Scheduled';
  complexity?: 'Low' | 'Medium' | 'High';
  integrations?: string[];
  tags?: string[];
  active?: boolean;
  lastUpdated?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  authorEmail?: string;
  authorVerified?: boolean;
  pricing?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
}

interface SolutionCardProps {
  solution: SolutionData;
  onView?: (solution: SolutionData) => void;
  className?: string;
  isAdmin?: boolean;
}

function SolutionCard({ solution, onView, className }: SolutionCardProps) {
  const handleClick = () => onView?.(solution);
  const techs = (solution.integrations && solution.integrations.length > 0
    ? solution.integrations
    : (solution.tags || [])).slice(0, 6);

  return (
    <Card className={`transition-shadow h-full hover:shadow-md ${className}`} onClick={handleClick} role="button">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2" title={solution.filename || solution.name}>
          {solution.name}
        </h3>

        {/* Integrations as icons with tooltip */}
        {techs && techs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {techs.map((t, i) => (
              <IntegrationIcon key={i} name={t} size="sm" />
            ))}
          </div>
        )}

        {/* Spacer pushes bottom row down */}
        <div className="flex-1" />

        {/* Bottom row: creator left, rating right */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <CreatorBadge
              name={(solution.authorName && solution.authorName.toLowerCase() !== 'community')
                ? solution.authorName
                : 'Community'}
              avatarUrl={solution.authorAvatarUrl}
              email={solution.authorEmail}
              verified={solution.authorVerified}
            />
            {solution.pricing && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  solution.pricing === 'Free'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : solution.pricing === 'Freemium'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : solution.pricing === 'Paid'
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
              >
                {solution.pricing}
              </span>
            )}
          </div>

          {solution.rating && (
            <div className="flex items-center gap-1 text-sm text-gray-900">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{solution.rating.toFixed(1)}</span>
              {solution.reviewCount ? (
                <span className="text-xs text-gray-500">({solution.reviewCount})</span>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SolutionCard;
export { SolutionData };