/**
 * Enhanced AgentCard Component
 * Modern UX with avatar placeholders, skill tags, and enhanced interactions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModernActionButton } from './ModernActionButton';
import { ActionButtonGroup } from './ActionButtonGroup';
import { 
  Bot, 
  Settings, 
  Eye, 
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
  Copy,
  ExternalLink,
  Code,
  Brain,
  Cpu,
  Database,
  Globe,
  Shield,
  Target,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SolutionStatus, GenerationMetadata } from '@/lib/types';

export interface EnhancedAgentData {
  id: string;
  name: string;
  description?: string;
  role?: string;
  capabilities?: string[];
  technologies?: string[];
  skills?: string[];
  experience?: 'junior' | 'mid' | 'senior' | 'expert';
  availability?: 'available' | 'busy' | 'offline';
  rating?: number; // 1-5
  projectsCompleted?: number;
  responseTime?: number; // minutes
  costPerHour?: number;
  languages?: string[];
  specializations?: string[];
  // Enhanced properties
  status?: SolutionStatus;
  generationMetadata?: GenerationMetadata;
  setupCost?: number;
  isAIGenerated?: boolean;
  avatar?: string;
  background?: string;
  personality?: 'professional' | 'friendly' | 'technical' | 'creative';
  communicationStyle?: 'formal' | 'casual' | 'technical' | 'collaborative';
  lastActive?: string;
  verified?: boolean;
  badges?: string[];
  portfolio?: string[];
}

interface EnhancedAgentCardProps {
  agent: EnhancedAgentData;
  lang?: 'de' | 'en';
  onSelect?: (agent: EnhancedAgentData) => void;
  onSetupClick?: (agent: EnhancedAgentData) => void;
  onConfigClick?: (agent: EnhancedAgentData) => void;
  onFavoriteClick?: (agent: EnhancedAgentData) => void;
  onShareClick?: (agent: EnhancedAgentData) => void;
  className?: string;
  compact?: boolean;
  showSkeleton?: boolean;
  isInteractive?: boolean;
}

// Avatar placeholder generator
const generateAvatarPlaceholder = (name: string, personality?: string) => {
  const colors = {
    professional: 'bg-blue-500',
    friendly: 'bg-green-500',
    technical: 'bg-purple-500',
    creative: 'bg-pink-500'
  };
  
  const color = colors[personality as keyof typeof colors] || 'bg-gray-500';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return { color, initials };
};

// Skill tag styling
const getSkillTagStyle = (skill: string) => {
  const skillLower = skill.toLowerCase();
  
  if (skillLower.includes('ai') || skillLower.includes('ml') || skillLower.includes('neural')) {
    return 'bg-purple-100 text-purple-800 border-purple-200';
  }
  if (skillLower.includes('web') || skillLower.includes('frontend') || skillLower.includes('react')) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  if (skillLower.includes('backend') || skillLower.includes('api') || skillLower.includes('server')) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (skillLower.includes('data') || skillLower.includes('analytics') || skillLower.includes('sql')) {
    return 'bg-orange-100 text-orange-800 border-orange-200';
  }
  if (skillLower.includes('automation') || skillLower.includes('workflow') || skillLower.includes('n8n')) {
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  }
  
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

// Experience level styling
const getExperienceStyle = (experience?: string) => {
  switch (experience) {
    case 'junior':
      return 'bg-green-100 text-green-800';
    case 'mid':
      return 'bg-yellow-100 text-yellow-800';
    case 'senior':
      return 'bg-blue-100 text-blue-800';
    case 'expert':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Availability styling
const getAvailabilityStyle = (availability?: string) => {
  switch (availability) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'busy':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'offline':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Skeleton loading component
const AgentCardSkeleton = ({ compact = true }: { compact?: boolean }) => (
  <Card className={cn(
    "animate-pulse",
    compact ? "h-56" : "h-72"
  )}>
    <CardContent className="p-4">
      <div className="space-y-3">
        {/* Header with avatar skeleton */}
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
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
        
        {/* Skills skeleton */}
        <div className="flex flex-wrap gap-1">
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
          <div className="h-5 w-20 bg-gray-200 rounded"></div>
          <div className="h-5 w-14 bg-gray-200 rounded"></div>
        </div>
        
        {/* Stats skeleton */}
        <div className="flex gap-4">
          <div className="h-3 w-12 bg-gray-200 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
          <div className="h-3 w-10 bg-gray-200 rounded"></div>
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

export const EnhancedAgentCard: React.FC<EnhancedAgentCardProps> = ({
  agent,
  lang = 'en',
  onSelect,
  onSetupClick,
  onConfigClick,
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

  // Handle action clicks
  const handleSetup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await onSetupClick?.(agent);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleConfig = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfigClick?.(agent);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavoriteClick?.(agent);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShareClick?.(agent);
  };

  const handleSelect = () => {
    onSelect?.(agent);
  };

  // Generate avatar placeholder
  const { color, initials } = generateAvatarPlaceholder(agent.name, agent.personality);

  if (showSkeleton) {
    return <AgentCardSkeleton compact={compact} />;
  }

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-in-out cursor-pointer",
        "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
        "border border-gray-200 hover:border-primary/30",
        "bg-white hover:bg-gradient-to-br hover:from-white hover:to-primary/5",
        isHovered && "ring-2 ring-primary/20",
        compact ? "h-56" : "h-72",
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
      {agent.status && (
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            variant="outline" 
            className={cn("text-xs", 
              agent.status === 'generated' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              agent.status === 'verified' ? 'bg-green-100 text-green-800 border-green-200' :
              'bg-orange-100 text-orange-800 border-orange-200'
            )}
          >
            {agent.status === 'generated' && <Sparkles className="h-3 w-3 mr-1" />}
            {agent.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
            {agent.status === 'fallback' && <AlertCircle className="h-3 w-3 mr-1" />}
            {lang === 'de' 
              ? (agent.status === 'generated' ? 'Generiert' : 
                 agent.status === 'verified' ? 'Verifiziert' : 'Fallback')
              : agent.status
            }
          </Badge>
        </div>
      )}

      <CardContent className="p-4 relative z-10">
        <div className="space-y-3">
          {/* Header with Avatar */}
          <div className="flex items-start gap-3">
            {/* Avatar Placeholder */}
            <div className={cn(
              "relative flex-shrink-0",
              compact ? "h-10 w-10" : "h-12 w-12"
            )}>
              <div className={cn(
                "rounded-full flex items-center justify-center text-white font-semibold",
                "shadow-md transition-all duration-300",
                color,
                isHovered && "scale-110 shadow-lg"
              )}>
                {agent.avatar ? (
                  <img 
                    src={agent.avatar} 
                    alt={agent.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className={cn(
                    "font-bold",
                    compact ? "text-sm" : "text-base"
                  )}>
                    {initials}
                  </span>
                )}
              </div>
              
              {/* Availability indicator */}
              {agent.availability && (
                <div className={cn(
                  "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white",
                  agent.availability === 'available' ? 'bg-green-500' :
                  agent.availability === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                )} />
              )}
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                  {agent.name}
                </h3>
                {agent.verified && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", getExperienceStyle(agent.experience))}>
                  {lang === 'de' 
                    ? (agent.experience === 'junior' ? 'Junior' :
                       agent.experience === 'mid' ? 'Mittel' :
                       agent.experience === 'senior' ? 'Senior' : 'Experte')
                    : agent.experience
                  }
                </Badge>
                
                {agent.availability && (
                  <Badge variant="outline" className={cn("text-xs", getAvailabilityStyle(agent.availability))}>
                    {lang === 'de' 
                      ? (agent.availability === 'available' ? 'Verfügbar' :
                         agent.availability === 'busy' ? 'Beschäftigt' : 'Offline')
                      : agent.availability
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

          {/* Description */}
          {agent.description && (
            <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-700 transition-colors">
              {agent.description}
            </p>
          )}

          {/* Skills Tags */}
          {agent.skills && agent.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {agent.skills.slice(0, compact ? 3 : 5).map((skill) => (
                <Badge 
                  key={skill} 
                  variant="outline" 
                  className={cn("text-xs", getSkillTagStyle(skill))}
                >
                  {skill}
                </Badge>
              ))}
              {agent.skills.length > (compact ? 3 : 5) && (
                <Badge variant="outline" className="text-xs">
                  +{agent.skills.length - (compact ? 3 : 5)}
                </Badge>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {agent.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{agent.rating}/5</span>
              </div>
            )}
            {agent.projectsCompleted && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{agent.projectsCompleted}</span>
              </div>
            )}
            {agent.responseTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{agent.responseTime}min</span>
              </div>
            )}
          </div>

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
                action="settings"
                size="sm"
                variant="default"
                onClick={handleSetup}
                loading={isLoading}
                successDuration={2000}
                className="flex-1"
                showText={true}
                showIcon={true}
              >
                {lang === 'de' ? 'Einrichten' : 'Setup'}
              </ModernActionButton>
              
              <ModernActionButton
                action="edit"
                size="sm"
                variant="outline"
                onClick={handleConfig}
                className="flex-1"
                showText={true}
                showIcon={true}
              >
                {lang === 'de' ? 'Konfig' : 'Config'}
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

          {/* Additional Info */}
          {agent.costPerHour && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>
                {lang === 'de' 
                  ? `${agent.costPerHour}€/Stunde`
                  : `$${agent.costPerHour}/hour`
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

export default EnhancedAgentCard;
