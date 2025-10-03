/**
 * Enhanced PromptCard Component
 * Modern UX with code-like display, syntax highlighting, and copy animations
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModernActionButton } from './ModernActionButton';
import { ActionButtonGroup } from './ActionButtonGroup';
import { 
  MessageSquare, 
  Copy, 
  ExternalLink, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  Users,
  Zap,
  Star,
  Bookmark,
  Share2,
  Code,
  Brain,
  Cpu,
  Database,
  Globe,
  Shield,
  Target,
  Activity,
  Check,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SolutionStatus, GenerationMetadata } from '@/lib/types';

export interface EnhancedPromptData {
  id: string;
  prompt: string;
  service: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom';
  style: 'formal' | 'creative' | 'technical';
  preview: string;
  status?: SolutionStatus;
  generationMetadata?: GenerationMetadata;
  isAIGenerated?: boolean;
  // Enhanced properties
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  estimatedTokens?: number;
  estimatedCost?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  effectiveness?: number; // 1-10
  popularity?: number; // 0-100
  rating?: number; // 1-5
  author?: string;
  lastUpdated?: string;
  verified?: boolean;
  badges?: string[];
  examples?: string[];
  variations?: string[];
  language?: string;
  context?: string;
  expectedOutput?: string;
  tips?: string[];
}

interface EnhancedPromptCardProps {
  prompt: EnhancedPromptData;
  lang?: 'de' | 'en';
  onSelect?: (prompt: EnhancedPromptData) => void;
  onCopyClick?: (prompt: EnhancedPromptData) => void;
  onOpenInServiceClick?: (prompt: EnhancedPromptData, service: string) => void;
  onFavoriteClick?: (prompt: EnhancedPromptData) => void;
  onShareClick?: (prompt: EnhancedPromptData) => void;
  className?: string;
  compact?: boolean;
  showSkeleton?: boolean;
  isInteractive?: boolean;
}

// Service styling
const getServiceStyle = (service: string) => {
  switch (service.toLowerCase()) {
    case 'chatgpt':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'claude':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'gemini':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'custom':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Style styling
const getStyleStyle = (style: string) => {
  switch (style.toLowerCase()) {
    case 'formal':
      return 'bg-blue-100 text-blue-800';
    case 'creative':
      return 'bg-pink-100 text-pink-800';
    case 'technical':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
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

// Syntax highlighting for prompts
const highlightPrompt = (text: string) => {
  // Simple syntax highlighting for common prompt patterns
  return text
    .replace(/(\*\*.*?\*\*)/g, '<strong class="text-blue-600 font-semibold">$1</strong>')
    .replace(/(\*.*?\*)/g, '<em class="text-green-600 italic">$1</em>')
    .replace(/(`.*?`)/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/(\d+\.\s)/g, '<span class="text-purple-600 font-semibold">$1</span>')
    .replace(/([A-Z][a-z]+:)/g, '<span class="text-orange-600 font-semibold">$1</span>');
};

// Skeleton loading component
const PromptCardSkeleton = ({ compact = true }: { compact?: boolean }) => (
  <Card className={cn(
    "animate-pulse",
    compact ? "h-64" : "h-80"
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
        
        {/* Code block skeleton */}
        <div className="bg-gray-100 rounded-lg p-3 space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
          <div className="h-5 w-20 bg-gray-200 rounded"></div>
        </div>
        
        {/* Actions skeleton */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const EnhancedPromptCard: React.FC<EnhancedPromptCardProps> = ({
  prompt,
  lang = 'en',
  onSelect,
  onCopyClick,
  onOpenInServiceClick,
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  // Simulate loading state
  useEffect(() => {
    if (showSkeleton) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500 + Math.random() * 1000);
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

  // Handle copy functionality
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setIsCopied(true);
    
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopySuccess(true);
      onCopyClick?.(prompt);
      
      // Reset copy state after animation
      setTimeout(() => {
        setIsCopied(false);
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      setCopySuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle open in service
  const handleOpenInService = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenInServiceClick?.(prompt, prompt.service);
  };

  // Handle favorite
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavoriteClick?.(prompt);
  };

  // Handle share
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShareClick?.(prompt);
  };

  // Handle expand/collapse
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Handle select
  const handleSelect = () => {
    onSelect?.(prompt);
  };

  // Truncate prompt for preview
  const getPromptPreview = () => {
    if (isExpanded || !compact) {
      return prompt.prompt;
    }
    return prompt.prompt.length > 200 
      ? prompt.prompt.substring(0, 200) + '...'
      : prompt.prompt;
  };

  if (showSkeleton) {
    return <PromptCardSkeleton compact={compact} />;
  }

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-in-out cursor-pointer",
        "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
        "border border-gray-200 hover:border-primary/30",
        "bg-white hover:bg-gradient-to-br hover:from-white hover:to-primary/5",
        isHovered && "ring-2 ring-primary/20",
        compact ? "h-64" : "h-80",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleSelect}
    >
      {/* Hover overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300",
        isHovered && "opacity-100"
      )} />

      {/* Status indicator */}
      {prompt.status && (
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            variant="outline" 
            className={cn("text-xs", getStatusStyle(prompt.status))}
          >
            {prompt.status === 'generated' && <Sparkles className="h-3 w-3 mr-1" />}
            {prompt.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
            {prompt.status === 'fallback' && <AlertCircle className="h-3 w-3 mr-1" />}
            {lang === 'de' 
              ? (prompt.status === 'generated' ? 'Generiert' : 
                 prompt.status === 'verified' ? 'Verifiziert' : 'Fallback')
              : prompt.status
            }
          </Badge>
        </div>
      )}

      <CardContent className="p-4 relative z-10">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                  {prompt.title || prompt.service}
                </h3>
                {prompt.verified && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", getServiceStyle(prompt.service))}>
                  {prompt.service}
                </Badge>
                
                <Badge variant="outline" className={cn("text-xs", getStyleStyle(prompt.style))}>
                  {lang === 'de' 
                    ? (prompt.style === 'formal' ? 'Formell' :
                       prompt.style === 'creative' ? 'Kreativ' : 'Technisch')
                    : prompt.style
                  }
                </Badge>
                
                {prompt.difficulty && (
                  <Badge variant="outline" className={cn("text-xs", getDifficultyStyle(prompt.difficulty))}>
                    {lang === 'de' 
                      ? (prompt.difficulty === 'beginner' ? 'Anfänger' :
                         prompt.difficulty === 'intermediate' ? 'Fortgeschritten' : 'Experte')
                      : prompt.difficulty
                    }
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick actions on hover */}
            <div className={cn(
              "flex items-center gap-1 opacity-0 transition-opacity duration-200",
              showActions && "opacity-100"
            )}>
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

          {/* Code-like prompt display */}
          <div className="relative">
            <div 
              ref={codeRef}
              className={cn(
                "bg-gray-900 text-gray-100 rounded-lg p-3 font-mono text-sm leading-relaxed",
                "border border-gray-700 transition-all duration-300",
                isHovered && "border-primary/30 shadow-lg",
                "overflow-hidden"
              )}
            >
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: highlightPrompt(getPromptPreview()) 
                }}
              />
              
              {/* Copy success overlay */}
              {isCopied && (
                <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-white">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {lang === 'de' ? 'Kopiert!' : 'Copied!'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Expand/collapse button */}
            {prompt.prompt.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300"
                onClick={handleToggleExpand}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {prompt.estimatedTokens && (
              <div className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                <span>{prompt.estimatedTokens} tokens</span>
              </div>
            )}
            {prompt.effectiveness && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{prompt.effectiveness}/10</span>
              </div>
            )}
            {prompt.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{prompt.rating}/5</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {prompt.tags.slice(0, compact ? 3 : 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {prompt.tags.length > (compact ? 3 : 5) && (
                <Badge variant="outline" className="text-xs">
                  +{prompt.tags.length - (compact ? 3 : 5)}
                </Badge>
              )}
            </div>
          )}

          {/* Modern Action Buttons */}
          <div className={cn(
            "pt-2 transition-all duration-200",
            showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}>
            <ActionButtonGroup 
              orientation="horizontal" 
              spacing="normal" 
              alignment="stretch"
              size="sm"
            >
              <ModernActionButton
                action="copy"
                size="sm"
                variant="default"
                onClick={handleCopy}
                loading={isLoading}
                success={copySuccess}
                successDuration={2000}
                className="flex-1"
                showText={true}
                showIcon={true}
              >
                {lang === 'de' ? 'Kopieren' : 'Copy'}
              </ModernActionButton>
              
              <ModernActionButton
                action="external"
                size="sm"
                variant="outline"
                onClick={handleOpenInService}
                className="flex-1"
                showText={true}
                showIcon={true}
              >
                {lang === 'de' ? 'Öffnen' : 'Open'}
              </ModernActionButton>
              
              {!compact && (
                <ModernActionButton
                  action="view"
                  size="sm"
                  variant="ghost"
                  onClick={handleSelect}
                  showText={false}
                  showIcon={true}
                />
              )}
            </ActionButtonGroup>
          </div>

          {/* Additional info */}
          {prompt.estimatedCost && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>
                {lang === 'de' 
                  ? `~${prompt.estimatedCost}€`
                  : `~$${prompt.estimatedCost}`
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

export default EnhancedPromptCard;
