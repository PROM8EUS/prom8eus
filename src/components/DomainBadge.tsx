import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tag, MoreHorizontal, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DomainData {
  domain: string;
  confidence: number;
  origin: 'llm' | 'admin' | 'default';
}

export interface DomainBadgeProps {
  domains: DomainData[];
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
  showOrigin?: boolean;
  maxDisplay?: number;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function DomainBadge({ 
  domains, 
  size = 'sm', 
  showConfidence = false,
  showOrigin = false,
  maxDisplay = 1,
  className = '',
  variant = 'outline'
}: DomainBadgeProps) {
  if (!domains || domains.length === 0) {
    return null;
  }

  // Sort domains by confidence (highest first)
  const sortedDomains = [...domains].sort((a, b) => b.confidence - a.confidence);
  const topDomain = sortedDomains[0];
  const remainingDomains = sortedDomains.slice(1);

  const getDomainColor = (domain: string, confidence: number) => {
    // Color based on confidence level
    if (confidence >= 0.8) {
      return 'text-green-700 bg-green-50 border-green-200';
    } else if (confidence >= 0.6) {
      return 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (confidence >= 0.4) {
      return 'text-amber-700 bg-amber-50 border-amber-200';
    } else {
      return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getOriginIcon = (origin: string) => {
    switch (origin) {
      case 'llm':
        return <Info className="h-3 w-3" />;
      case 'admin':
        return <Tag className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getOriginLabel = (origin: string) => {
    switch (origin) {
      case 'llm':
        return 'AI Classified';
      case 'admin':
        return 'Admin Override';
      default:
        return 'Default';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const badgeContent = (
    <div className="flex items-center gap-1">
      <Tag className={iconSizes[size]} />
      <span className="font-medium">
        {topDomain.domain}
      </span>
      {showConfidence && (
        <span className="text-xs opacity-75">
          ({Math.round(topDomain.confidence * 100)}%)
        </span>
      )}
      {showOrigin && (
        <span className="text-xs opacity-75">
          {getOriginIcon(topDomain.origin)}
        </span>
      )}
    </div>
  );

  // If no remaining domains, just show the single badge
  if (remainingDomains.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={variant}
              className={cn(
                sizeClasses[size],
                'border font-medium cursor-pointer hover:shadow-sm transition-shadow',
                getDomainColor(topDomain.domain, topDomain.confidence),
                className
              )}
            >
              {badgeContent}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium text-sm">
                {topDomain.domain}
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {Math.round(topDomain.confidence * 100)}%
              </div>
              <div className="text-xs text-gray-500">
                Source: {getOriginLabel(topDomain.origin)}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show top domain with "+X more" indicator
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant={variant}
          className={cn(
            sizeClasses[size],
            'border font-medium cursor-pointer hover:shadow-sm transition-shadow',
            getDomainColor(topDomain.domain, topDomain.confidence),
            className
          )}
        >
          <div className="flex items-center gap-1">
            <Tag className={iconSizes[size]} />
            <span className="font-medium">
              {topDomain.domain}
            </span>
            {showConfidence && (
              <span className="text-xs opacity-75">
                ({Math.round(topDomain.confidence * 100)}%)
              </span>
            )}
            <MoreHorizontal className={iconSizes[size]} />
            <span className="text-xs opacity-75">
              +{remainingDomains.length}
            </span>
          </div>
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="font-medium text-sm">
            All Domains ({domains.length})
          </div>
          
          <div className="space-y-2">
            {sortedDomains.map((domain, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">
                    {domain.domain}
                  </span>
                  {showOrigin && (
                    <span className="text-xs text-gray-500">
                      {getOriginIcon(domain.origin)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    {Math.round(domain.confidence * 100)}%
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs px-2 py-0.5',
                      getDomainColor(domain.domain, domain.confidence)
                    )}
                  >
                    {index === 0 ? 'Primary' : 'Secondary'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t">
            Domains are sorted by confidence level. Higher confidence indicates better alignment with the solution.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DomainChipProps {
  domain: string;
  confidence: number;
  origin: 'llm' | 'admin' | 'default';
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
  showOrigin?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function DomainChip({ 
  domain, 
  confidence, 
  origin, 
  size = 'sm', 
  showConfidence = false,
  showOrigin = false,
  className = '',
  variant = 'outline'
}: DomainChipProps) {
  const getDomainColor = (domain: string, confidence: number) => {
    if (confidence >= 0.8) {
      return 'text-green-700 bg-green-50 border-green-200';
    } else if (confidence >= 0.6) {
      return 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (confidence >= 0.4) {
      return 'text-amber-700 bg-amber-50 border-amber-200';
    } else {
      return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getOriginIcon = (origin: string) => {
    switch (origin) {
      case 'llm':
        return <Info className="h-3 w-3" />;
      case 'admin':
        return <Tag className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getOriginLabel = (origin: string) => {
    switch (origin) {
      case 'llm':
        return 'AI Classified';
      case 'admin':
        return 'Admin Override';
      default:
        return 'Default';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const badgeContent = (
    <div className="flex items-center gap-1">
      <Tag className={iconSizes[size]} />
      <span className="font-medium">
        {domain}
      </span>
      {showConfidence && (
        <span className="text-xs opacity-75">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
      {showOrigin && (
        <span className="text-xs opacity-75">
          {getOriginIcon(origin)}
        </span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant}
            className={cn(
              sizeClasses[size],
              'border font-medium cursor-pointer hover:shadow-sm transition-shadow',
              getDomainColor(domain, confidence),
              className
            )}
          >
            {badgeContent}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium text-sm">
              {domain}
            </div>
            <div className="text-sm text-gray-600">
              Confidence: {Math.round(confidence * 100)}%
            </div>
            <div className="text-xs text-gray-500">
              Source: {getOriginLabel(origin)}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Utility function to convert domain data from solution format
export function convertToDomainData(domains: string[], confidences: number[], origin: string): DomainData[] {
  if (!domains || domains.length === 0) {
    return [];
  }

  return domains.map((domain, index) => ({
    domain,
    confidence: confidences && confidences[index] ? confidences[index] : 0.5,
    origin: (origin as 'llm' | 'admin' | 'default') || 'default'
  }));
}

// Utility function to get top domain
export function getTopDomain(domains: DomainData[]): DomainData | null {
  if (!domains || domains.length === 0) {
    return null;
  }

  return domains.reduce((top, current) => 
    current.confidence > top.confidence ? current : top
  );
}

// Utility function to get domain display name
export function getDomainDisplayName(domain: string): string {
  // Handle common domain abbreviations and formatting
  const domainMap: Record<string, string> = {
    'Business & Analytics': 'Business',
    'Marketing & Advertising': 'Marketing',
    'Customer Support & Service': 'Support',
    'Human Resources & Recruiting': 'HR',
    'Finance & Accounting': 'Finance',
    'IT & Software Development': 'Development',
    'DevOps & Cloud': 'DevOps',
    'Research & Data Science': 'Research',
    'Logistics & Supply Chain': 'Logistics',
    'Manufacturing & Engineering': 'Manufacturing',
    'Sales & CRM': 'Sales',
    'Other': 'Other'
  };

  return domainMap[domain] || domain;
}

export default DomainBadge;
