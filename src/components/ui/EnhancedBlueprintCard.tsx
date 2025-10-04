/**
 * Enhanced BlueprintCard Component
 * Modern UX with hover effects, skeleton loading, and enhanced interactions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModernActionButton } from './ModernActionButton';
import { ActionButtonGroup } from './ActionButtonGroup';
import { 
  Download, 
  Eye, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Star,
  Bookmark,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SolutionStatus, GenerationMetadata } from '@/lib/types';

export interface EnhancedBlueprintData {
  id: string;
  name: string;
  description?: string;
  timeSavings?: number; // hours per month
  complexity?: 'Low' | 'Medium' | 'High' | 'Easy' | 'Hard';
  jsonUrl?: string;
  workflowData?: any; // n8n workflow JSON data
  integrations?: string[];
  category?: string;
  isAIGenerated?: boolean;
  status?: SolutionStatus;
  generationMetadata?: GenerationMetadata;
  setupCost?: number;
  downloadUrl?: string;
  validationStatus?: 'valid' | 'invalid';
  // Enhanced properties
  popularity?: number; // 0-100
  rating?: number; // 1-5
  lastUpdated?: string;
  author?: string;
  tags?: string[];
  estimatedSetupTime?: number; // minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface EnhancedBlueprintCardProps {
  blueprint: EnhancedBlueprintData;
  lang?: 'de' | 'en';
  period?: 'year' | 'month' | 'week' | 'day';
  onDetailsClick?: (blueprint: EnhancedBlueprintData) => void;
  onDownloadClick?: (blueprint: EnhancedBlueprintData) => void;
  onSetupClick?: (blueprint: EnhancedBlueprintData) => void;
  onFavoriteClick?: (blueprint: EnhancedBlueprintData) => void;
  onShareClick?: (blueprint: EnhancedBlueprintData) => void;
  className?: string;
  compact?: boolean;
  showSkeleton?: boolean;
  isInteractive?: boolean;
}

// Skeleton loading component
const BlueprintCardSkeleton = ({ compact = true }: { compact?: boolean }) => (
  <Card className={cn(
    "animate-pulse",
    compact ? "h-48" : "h-64"
  )}>
    <CardContent className="p-4">
      <div className="space-y-3">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </div>
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
          <div className="h-5 w-20 bg-gray-200 rounded"></div>
        </div>
        
        {/* Actions skeleton */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const EnhancedBlueprintCard: React.FC<EnhancedBlueprintCardProps> = ({
  blueprint,
  lang = 'en',
  period = 'month',
  onDetailsClick,
  onDownloadClick,
  onSetupClick,
  onFavoriteClick,
  onShareClick,
  className,
  compact = true,
  showSkeleton = false,
  isInteractive = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Simulate loading state
  useEffect(() => {
    if (showSkeleton) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5s
      return () => clearTimeout(timer);
    }
  }, [showSkeleton]);

  // Handle hover effects
  const handleMouseEnter = () => {
    if (isInteractive) {
      setIsHovered(true);
      setShowActions(true);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setIsHovered(false);
      setShowActions(false);
    }
  };

  // Handle action clicks
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await onDownloadClick?.(blueprint);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleSetup = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSetupClick?.(blueprint);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavoriteClick?.(blueprint);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShareClick?.(blueprint);
  };

  // Period label
  const periodLabel = {
    year: lang === 'de' ? 'Jahr' : 'year',
    month: lang === 'de' ? 'Monat' : 'month',
    week: lang === 'de' ? 'Woche' : 'week',
    day: lang === 'de' ? 'Tag' : 'day',
  }[period];

  // Complexity styling
  const getComplexityStyle = (complexity?: string) => {
    switch (complexity?.toLowerCase()) {
      case 'low':
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Status styling
  const getStatusStyle = (status?: SolutionStatus) => {
    switch (status) {
      case 'generated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fallback':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Difficulty styling
  const getDifficultyStyle = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showSkeleton) {
    return <BlueprintCardSkeleton compact={compact} />;
  }

  return (
    <Card 
      className={cn(
        "group relative transition-all duration-300 ease-in-out",
        "border border-gray-200",
        "bg-white",
        isHovered && "ring-2 ring-primary/20",
        compact ? "min-h-48" : "min-h-64",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover overlay - removed */}

      {/* Status indicator */}
      {blueprint.status && (
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            variant="outline" 
            className={cn("text-xs", getStatusStyle(blueprint.status))}
          >
            {blueprint.status === 'generated' && <Sparkles className="h-3 w-3 mr-1" />}
            {blueprint.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
            {blueprint.status === 'fallback' && <AlertCircle className="h-3 w-3 mr-1" />}
            {lang === 'de' 
              ? (blueprint.status === 'generated' ? 'Generiert' : 
                 blueprint.status === 'verified' ? 'Verifiziert' : 'Fallback')
              : blueprint.status
            }
          </Badge>
        </div>
      )}

      <CardContent className="p-4 relative z-10">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {blueprint.name}
              </h3>
              {blueprint.author && (
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'de' ? 'von' : 'by'} {blueprint.author}
                </p>
              )}
            </div>
            
            {/* Quick actions - always visible */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleFavorite}
              >
                <Star className={cn(
                  "h-3 w-3",
                  isFavorited ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleShare}
              >
                <Share2 className="h-3 w-3 text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Description */}
          {blueprint.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {blueprint.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {blueprint.timeSavings && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{blueprint.timeSavings}h/{periodLabel}</span>
              </div>
            )}
            {blueprint.popularity && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{blueprint.popularity}%</span>
              </div>
            )}
            {blueprint.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{blueprint.rating}/5</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {blueprint.complexity && (
              <Badge variant="outline" className={cn("text-xs", getComplexityStyle(blueprint.complexity))}>
                {blueprint.complexity}
              </Badge>
            )}
            {blueprint.difficulty && (
              <Badge variant="outline" className={cn("text-xs", getDifficultyStyle(blueprint.difficulty))}>
                {lang === 'de' 
                  ? (blueprint.difficulty === 'beginner' ? 'Anfänger' :
                     blueprint.difficulty === 'intermediate' ? 'Fortgeschritten' : 'Experte')
                  : blueprint.difficulty
                }
              </Badge>
            )}
            {blueprint.integrations?.slice(0, 2).map((integration) => (
              <Badge key={integration} variant="secondary" className="text-xs">
                {integration}
              </Badge>
            ))}
            {blueprint.integrations && blueprint.integrations.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{blueprint.integrations.length - 2}
              </Badge>
            )}
          </div>

          {/* Modern Action Buttons */}
          <div className="pt-2">
            <ActionButtonGroup 
              orientation="horizontal" 
              spacing="normal" 
              alignment="stretch"
              size="sm"
            >
              <ModernActionButton
                action="download"
                size="sm"
                variant="default"
                onClick={handleDownload}
                loading={isLoading}
                successDuration={2000}
                className="flex-1"
                showText={true}
                showIcon={true}
              >
                {lang === 'de' ? 'Download' : 'Download'}
              </ModernActionButton>
              
              <ModernActionButton
                action="settings"
                size="sm"
                variant="outline"
                onClick={handleSetup}
                className="flex-1"
                showText={true}
                showIcon={true}
              >
                {lang === 'de' ? 'Einrichten' : 'Setup'}
              </ModernActionButton>
              
              {!compact && (
                <ModernActionButton
                  action="view"
                  size="sm"
                  variant="ghost"
                  onClick={() => onDetailsClick?.(blueprint)}
                  showText={false}
                  showIcon={true}
                />
              )}
            </ActionButtonGroup>
          </div>

          {/* Setup info */}
          {blueprint.estimatedSetupTime && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {lang === 'de' 
                  ? `~${blueprint.estimatedSetupTime} Min. Setup`
                  : `~${blueprint.estimatedSetupTime} min setup`
                }
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {lang === 'de' ? 'Lade...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedBlueprintCard;
