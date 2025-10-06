/**
 * Unified Solution Card Component
 * Supports workflows, agents, and LLMs with a consistent interface
 * Includes all features from EnhancedAgentCard, EnhancedPromptCard, and BlueprintCard
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActionButtonGroup } from './ui/ActionButtonGroup';
import { 
  Bot, 
  Workflow, 
  MessageSquare,
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
  Activity,
  Check,
  X,
  Maximize2,
  Minimize2,
  DollarSign,
  Timer,
  Award,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpDown,
  Filter,
  Search,
  Play,
  Download,
  Upload,
  RefreshCw,
  ThumbsUp,
  MessageSquare as Chat,
  Bell,
  Info,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SolutionStatus, GenerationMetadata, UnifiedWorkflow } from '@/lib/types';

// Base interface for all solution types
export interface UnifiedSolutionData {
  id: string;
  name: string;
  description?: string;
  type: 'workflow' | 'agent' | 'llm';
  
  // Common properties
  status?: SolutionStatus;
  generationMetadata?: GenerationMetadata;
  isAIGenerated?: boolean;
  rating?: number;
  author?: string;
  lastUpdated?: string;
  verified?: boolean;
  badges?: string[];
  tags?: string[];
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  popularity?: number;
  effectiveness?: number;
  
  // Workflow specific
  triggerType?: 'Complex' | 'Webhook' | 'Manual' | 'Scheduled';
  complexity?: 'Low' | 'Medium' | 'High';
  integrations?: string[];
  matchScore?: number;
  timeSavings?: number;
  downloadUrl?: string;
  validationStatus?: 'valid' | 'invalid' | 'pending';
  estimatedSetupTime?: number;
  
  // Agent specific
  role?: string;
  capabilities?: string[];
  technologies?: string[];
  skills?: string[];
  experience?: 'junior' | 'mid' | 'senior' | 'expert';
  availability?: 'available' | 'busy' | 'offline';
  projectsCompleted?: number;
  responseTime?: number;
  costPerHour?: number;
  languages?: string[];
  specializations?: string[];
  setupCost?: number;
  avatar?: string;
  background?: string;
  personality?: 'professional' | 'friendly' | 'technical' | 'creative';
  communicationStyle?: 'formal' | 'casual' | 'technical' | 'collaborative';
  lastActive?: string;
  portfolio?: string[];
  agentTier?: 'Generalist' | 'Specialist' | 'Experimental';
  agentDisclaimer?: string;
  model?: string;
  provider?: string;
  
  // LLM specific
  prompt?: string;
  service?: 'ChatGPT' | 'Claude' | 'Gemini' | 'Custom';
  style?: 'formal' | 'creative' | 'technical';
  preview?: string;
  estimatedTokens?: number;
  estimatedCost?: number;
  examples?: string[];
  variations?: string[];
  language?: string;
  context?: string;
  expectedOutput?: string;
  tips?: string[];
  
  // Enhanced properties from original components
  title?: string;
  filename?: string;
  priority?: 'Low' | 'Medium' | 'High';
  reviewCount?: number;
  active?: boolean;
  authorName?: string;
  authorAvatarUrl?: string;
  authorEmail?: string;
  authorVerified?: boolean;
  pricing?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  
  // Blueprint specific (for workflows)
  period?: 'month' | 'quarter' | 'year';
  roi?: number;
  costSavings?: number;
  efficiency?: number;
  automationLevel?: number;
  
  // Additional metadata
  source?: string;
  version?: string;
  lastModified?: string;
  created?: string;
  views?: number;
  downloads?: number;
  shares?: number;
  comments?: number;
}

interface UnifiedSolutionCardProps {
  solution: UnifiedSolutionData | UnifiedWorkflow;
  lang?: 'de' | 'en';
  
  // Action handlers
  onSelect?: (solution: UnifiedSolutionData | UnifiedWorkflow) => void;
  onSetupClick?: (solution: UnifiedSolutionData | UnifiedWorkflow) => void;
  onConfigClick?: (solution: UnifiedSolutionData | UnifiedWorkflow) => void;
  onCopyClick?: (solution: UnifiedSolutionData | UnifiedWorkflow) => void;
  onOpenInServiceClick?: (solution: UnifiedSolutionData | UnifiedWorkflow, service?: string) => void;
  onShareClick?: (solution: UnifiedSolutionData | UnifiedWorkflow) => void;
  onDownloadClick?: (solution: UnifiedSolutionData | UnifiedWorkflow) => void;
  
  className?: string;
  compact?: boolean;
  showSkeleton?: boolean;
  isInteractive?: boolean;
}

// Helper function to normalize solution data
const normalizeSolution = (inputSolution: UnifiedSolutionData | UnifiedWorkflow): UnifiedSolutionData => {
  // If it's already UnifiedSolutionData, return as is
  if ('type' in inputSolution && inputSolution.type) {
    return inputSolution as UnifiedSolutionData;
  }
  
  // Convert UnifiedWorkflow to UnifiedSolutionData
  const workflow = inputSolution as UnifiedWorkflow;
  
  // Generate stable values based on workflow ID to avoid random changes
  const stableHash = workflow.id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return {
    id: workflow.id,
    name: workflow.title,
    description: workflow.description,
    type: 'workflow' as const,
    filename: `${workflow.title.toLowerCase().replace(/\s+/g, '-')}.json`,
    category: workflow.category || 'Workflow',
    priority: (workflow.complexity === 'High' ? 'High' : workflow.complexity === 'Medium' ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High',
    rating: 4.0,
    reviewCount: Math.abs(stableHash % 50) + 10,
    triggerType: workflow.triggerType as 'Complex' | 'Webhook' | 'Manual' | 'Scheduled',
    complexity: workflow.complexity === 'Easy' ? 'Low' : workflow.complexity === 'Medium' ? 'Medium' : 'High',
    integrations: workflow.integrations || [],
    tags: workflow.tags || [],
    matchScore: Math.abs(stableHash % 30) + 70,
    timeSavings: Math.abs(stableHash % 20) + 5,
    downloadUrl: workflow.downloadUrl,
    validationStatus: 'valid' as const,
    estimatedSetupTime: Math.abs(stableHash % 60) + 15,
    active: true,
    lastUpdated: workflow.updatedAt || workflow.createdAt,
    authorName: workflow.author?.name || 'AI Assistant',
    authorVerified: workflow.author?.verified || true,
    pricing: 'Free' as const,
    isAIGenerated: workflow.isAIGenerated || false,
    status: workflow.status || 'generated' as const,
    source: workflow.source,
    version: workflow.version,
    created: workflow.createdAt,
    lastModified: workflow.updatedAt,
    generationMetadata: workflow.generationMetadata,
    badges: workflow.tags || [],
    popularity: workflow.popularity,
    effectiveness: workflow.timeSavings,
    setupCost: workflow.setupCost,
    estimatedCost: workflow.estimatedCost,
    estimatedTime: workflow.estimatedTime
  };
};

// Service styling for LLMs
const getServiceStyle = (service?: string) => {
  switch (service?.toLowerCase()) {
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

// Skill tag styling for agents
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

// Style styling for prompts
const getStyleStyle = (style?: string) => {
  switch (style?.toLowerCase()) {
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

// Priority styling
const getPriorityStyle = (priority?: string) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Pricing styling
const getPricingStyle = (pricing?: string) => {
  switch (pricing) {
    case 'Free':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Freemium':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Paid':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Enterprise':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Syntax highlighting for prompts
const highlightPrompt = (text: string) => {
  // Simple syntax highlighting for common prompt patterns
  return text
    .replace(/\n/g, '<br>') // Convert line breaks to HTML breaks
    .replace(/(\*\*.*?\*\*)/g, '<strong class="text-blue-600 font-semibold">$1</strong>')
    .replace(/(\*.*?\*)/g, '<em class="text-green-600 italic">$1</em>')
    .replace(/(`.*?`)/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/(\d+\.\s)/g, '<span class="text-purple-600 font-semibold">$1</span>')
    .replace(/([A-Z][a-z]+:)/g, '<span class="text-orange-600 font-semibold">$1</span>');
};

// Avatar placeholder generator for agents
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

// Skeleton loading components
const SolutionCardSkeleton = ({ compact = true, type = 'workflow' }: { compact?: boolean; type?: string }) => (
  <Card className={cn(
    "min-h-fit" // Automatische Höhe auch für Skeleton
  )}>
    <CardContent className="p-4">
      <div className="space-y-3">
        {/* Header skeleton */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "bg-gray-200 rounded-full",
            compact ? "h-10 w-10" : "h-12 w-12"
          )}></div>
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
        
        {/* Type-specific content skeleton */}
        {type === 'llm' && (
          <div className="bg-gray-100 rounded-lg p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          </div>
        )}
        
        {/* Tags skeleton */}
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

// Status styling
const getStatusStyle = (status?: SolutionStatus) => {
  switch (status) {
    case 'generated':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'verified':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'fallback':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Type icon mapping
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'workflow':
      return Workflow;
    case 'agent':
      return Bot;
    case 'llm':
      return MessageSquare;
    default:
      return Code;
  }
};

// Type styling
const getTypeStyle = (type: string) => {
  switch (type) {
    case 'workflow':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'agent':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'llm':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const UnifiedSolutionCard: React.FC<UnifiedSolutionCardProps> = ({
  solution,
  lang = 'de',
  onSelect,
  onSetupClick,
  onConfigClick,
  onCopyClick,
  onOpenInServiceClick,
  onShareClick,
  onDownloadClick,
  className,
  compact = false,
  showSkeleton = false,
  isInteractive = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  // Normalize solution data to UnifiedSolutionData format
  const normalizedSolution = normalizeSolution(solution);
  const TypeIcon = getTypeIcon(normalizedSolution.type);

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

  // Handle copy action
  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (normalizedSolution.type === 'llm' && normalizedSolution.prompt) {
      setIsLoading(true);
      setIsCopied(true);
      
      try {
        await navigator.clipboard.writeText(normalizedSolution.prompt);
        setCopySuccess(true);
        onCopyClick?.(solution);
        
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
    }
  };


  // Handle share
  const handleShare = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onShareClick?.(solution);
  };

  // Handle setup
  const handleSetup = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsLoading(true);
    try {
      await onSetupClick?.(solution);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  // Handle config
  const handleConfig = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onConfigClick?.(solution);
  };

  // Handle download
  const handleDownload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onDownloadClick?.(solution);
  };

  // Handle open in service
  const handleOpenInService = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onOpenInServiceClick?.(solution, normalizedSolution.service);
  };

  // Handle select
  const handleSelect = () => {
    onSelect?.(solution);
  };

  // Handle expand/collapse
  const handleExpand = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Generate avatar placeholder for agents
  const { color, initials } = normalizedSolution.type === 'agent' 
    ? generateAvatarPlaceholder(normalizedSolution.name, normalizedSolution.personality)
    : { color: '', initials: '' };

  // Get prompt preview for LLMs
  const getPromptPreview = () => {
    if (!normalizedSolution.prompt) return '';
    if (isExpanded || !compact) {
      return normalizedSolution.prompt;
    }
    return normalizedSolution.prompt.length > 200 
      ? normalizedSolution.prompt.substring(0, 200) + '...'
      : normalizedSolution.prompt;
  };

  // Get action buttons based on solution type
  const getActionButtons = () => {
    const buttons = [];

    // Common actions
    if (onSelect) {
      buttons.push({
        icon: Eye,
        label: lang === 'de' ? 'Ansehen' : 'View',
        onClick: handleSelect,
        variant: 'default' as const
      });
    }

    // Type-specific actions
    switch (normalizedSolution.type) {
      case 'workflow':
        if (onDownloadClick) {
          buttons.push({
            icon: Download,
            label: lang === 'de' ? 'Herunterladen' : 'Download',
            onClick: handleDownload,
            variant: 'outline' as const
          });
        }
        if (onSetupClick) {
          buttons.push({
            icon: Settings,
            label: lang === 'de' ? 'Einrichten' : 'Setup',
            onClick: handleSetup,
            variant: 'outline' as const
          });
        }
        break;
      
      case 'agent':
        if (onSetupClick) {
          buttons.push({
            icon: Settings,
            label: lang === 'de' ? 'Einrichten' : 'Setup',
            onClick: handleSetup,
            variant: 'outline' as const
          });
        }
        if (onConfigClick) {
          buttons.push({
            icon: Settings,
            label: lang === 'de' ? 'Konfigurieren' : 'Configure',
            onClick: handleConfig,
            variant: 'outline' as const
          });
        }
        break;
      
      case 'llm':
        if (onCopyClick) {
          buttons.push({
            icon: isCopied ? Check : Copy,
            label: isCopied ? (lang === 'de' ? 'Kopiert!' : 'Copied!') : (lang === 'de' ? 'Kopieren' : 'Copy'),
            onClick: handleCopy,
            variant: 'outline' as const,
            className: isCopied ? 'text-green-600' : ''
          });
        }
        if (onOpenInServiceClick && normalizedSolution.service) {
          buttons.push({
            icon: ExternalLink,
            label: lang === 'de' ? 'In Service öffnen' : 'Open in Service',
            onClick: handleOpenInService,
            variant: 'outline' as const
          });
        }
        break;
    }

    // Common utility actions

    if (onShareClick) {
      buttons.push({
        icon: Share2,
        label: lang === 'de' ? 'Teilen' : 'Share',
        onClick: handleShare,
        variant: 'ghost' as const
      });
    }

    return buttons;
  };

  if (showSkeleton) {
    return <SolutionCardSkeleton compact={compact} type={normalizedSolution.type} />;
  }

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden",
        "border border-gray-200",
        "bg-white",
        isInteractive && "cursor-pointer",
        "min-h-fit", // Automatische Höhe statt feste Höhe
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleSelect}
    >

      {/* Status indicator */}
      {normalizedSolution.status && (
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            variant="outline" 
            className={cn("text-xs", getStatusStyle(normalizedSolution.status))}
          >
            {normalizedSolution.status === 'generated' && <Sparkles className="h-3 w-3 mr-1" />}
            {normalizedSolution.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
            {normalizedSolution.status === 'fallback' && <AlertCircle className="h-3 w-3 mr-1" />}
            {lang === 'de' 
              ? (normalizedSolution.status === 'generated' ? 'Generiert' : 
                 normalizedSolution.status === 'verified' ? 'Verifiziert' : 'Fallback')
              : normalizedSolution.status
            }
          </Badge>
        </div>
      )}

      <CardContent className="p-4 relative z-10 h-full">
        <div className="space-y-3 h-full flex flex-col">
          {/* Header with Avatar/Icon */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={cn(
              "rounded-full flex items-center justify-center",
              "shadow-md",
              getTypeStyle(normalizedSolution.type),
              compact ? "h-10 w-10" : "h-12 w-12"
            )}>
              <TypeIcon className={cn(
                compact ? "w-5 h-5" : "w-6 h-6"
              )} />
            </div>
            
            {/* Title and Meta */}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-gray-900 leading-tight mb-1 truncate",
                compact ? "text-sm" : "text-base"
              )}>
                {normalizedSolution.name}
              </h3>
              
              {/* Role/Service info */}
              {(normalizedSolution.role || normalizedSolution.service) && (
                <p className="text-xs text-gray-600 mb-2">
                  {normalizedSolution.role || normalizedSolution.service}
                </p>
              )}
              
              {/* Badges */}
              <div className="flex items-center gap-1 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getTypeStyle(normalizedSolution.type))}
                >
                  {normalizedSolution.type === 'workflow' && (lang === 'de' ? 'Workflow' : 'Workflow')}
                  {normalizedSolution.type === 'agent' && (lang === 'de' ? 'Agent' : 'Agent')}
                  {normalizedSolution.type === 'llm' && (lang === 'de' ? 'Prompt' : 'Prompt')}
                </Badge>
                
                {normalizedSolution.difficulty && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getDifficultyStyle(normalizedSolution.difficulty))}
                  >
                    {normalizedSolution.difficulty}
                  </Badge>
                )}
                
                {normalizedSolution.priority && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getPriorityStyle(normalizedSolution.priority))}
                  >
                    {normalizedSolution.priority}
                  </Badge>
                )}
                
                {normalizedSolution.pricing && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getPricingStyle(normalizedSolution.pricing))}
                  >
                    {normalizedSolution.pricing}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {normalizedSolution.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {normalizedSolution.description}
            </p>
          )}

          {/* Type-specific content */}
          {normalizedSolution.type === 'llm' && normalizedSolution.prompt && (
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 font-mono">
                <div 
                  className={cn(
                    "whitespace-pre-wrap",
                    !isExpanded && compact ? "line-clamp-3" : ""
                  )}
                  dangerouslySetInnerHTML={{ 
                    __html: highlightPrompt(getPromptPreview()) 
                  }}
                />
              </div>
              {normalizedSolution.prompt.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpand}
                  className="h-6 px-2 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      {lang === 'de' ? 'Weniger anzeigen' : 'Show less'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      {lang === 'de' ? 'Mehr anzeigen' : 'Show more'}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Skills/Capabilities/Tags */}
          <div className="flex flex-wrap gap-1">
            {normalizedSolution.skills?.slice(0, 3).map((skill, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className={cn("text-xs", getSkillTagStyle(skill))}
              >
                {skill}
              </Badge>
            ))}
            {normalizedSolution.capabilities?.slice(0, 2).map((capability, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {capability}
              </Badge>
            ))}
            {normalizedSolution.integrations?.slice(0, 2).map((integration, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {integration}
              </Badge>
            ))}
            {normalizedSolution.tags?.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {normalizedSolution.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{normalizedSolution.rating.toFixed(1)}</span>
                {normalizedSolution.reviewCount && (
                  <span>({normalizedSolution.reviewCount})</span>
                )}
              </div>
            )}
            
            {normalizedSolution.projectsCompleted && (
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>{normalizedSolution.projectsCompleted} projects</span>
              </div>
            )}
            
            {normalizedSolution.responseTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{normalizedSolution.responseTime}min</span>
              </div>
            )}
            
            {normalizedSolution.estimatedTokens && (
              <div className="flex items-center gap-1">
                <Code className="w-3 h-3" />
                <span>{normalizedSolution.estimatedTokens} tokens</span>
              </div>
            )}
            
            {normalizedSolution.timeSavings && (
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                <span>{normalizedSolution.timeSavings}h saved</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap mt-auto">
            {getActionButtons().map((button, index) => (
              <Button
                key={index}
                variant={button.variant}
                size="sm"
                onClick={button.onClick}
                className={cn(
                  "h-8 px-3 text-xs",
                  button.className
                )}
                disabled={isLoading}
              >
                {button.icon && <button.icon className="w-3 h-3 mr-1" />}
                {button.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedSolutionCard;
