import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AllItemProps {
  lang?: 'de' | 'en';
  isSelected?: boolean;
  onClick?: () => void;
  isLast?: boolean;
}

export const AllItem: React.FC<AllItemProps> = ({
  lang = 'de',
  isSelected = false,
  onClick,
  isLast = false
}) => {
  return (
    <div className="relative">
      {/* Main content */}
      <div
        className={cn(
          'cursor-pointer transition-all duration-200 p-4 hover:bg-gray-50',
          isSelected && 'bg-primary/5'
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-900">
                {lang === 'de' ? 'Alle' : 'All'}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
            
            <div className="mb-2">
              <span className="text-xs text-gray-600">
                {lang === 'de' ? 'Übergreifende Lösungen' : 'Overarching solutions'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Separator line - only show if not last item */}
      {!isLast && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
      )}
    </div>
  );
};
