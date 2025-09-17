import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle, Zap, Target, Brain, Shield, Star } from 'lucide-react';
import { AgentTier } from '@/lib/solutions/agentScoring';

export interface AgentScoreData {
  agentId: string;
  tier: AgentTier;
  capabilityScore: number;
  domainScore: number;
  overallScore: number;
  reasoning: string[];
  confidence: number;
  disclaimer: string;
}

interface AgentTierDisplayProps {
  score: AgentScoreData;
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AgentTierDisplay({ 
  score, 
  showBreakdown = false, 
  size = 'md',
  className = '' 
}: AgentTierDisplayProps) {
  const getTierColor = (tier: AgentTier): string => {
    switch (tier) {
      case 'Generalist':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Specialist':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Experimental':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTierIcon = (tier: AgentTier) => {
    switch (tier) {
      case 'Generalist':
        return <Brain className="h-4 w-4" />;
      case 'Specialist':
        return <Target className="h-4 w-4" />;
      case 'Experimental':
        return <Zap className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getTierDescription = (tier: AgentTier): string => {
    switch (tier) {
      case 'Generalist':
        return 'Broad capabilities across multiple domains with reliable performance';
      case 'Specialist':
        return 'Focused capabilities in specific domains with deep expertise';
      case 'Experimental':
        return 'Emerging capabilities with potential but variable outcomes';
      default:
        return 'AI agent with adaptive capabilities';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Tier Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getTierIcon(score.tier)}
          <span className="font-medium text-gray-900">Agent Tier</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`${sizeClasses[size]} ${getTierColor(score.tier)} border font-medium flex items-center gap-1`}
              >
                {getTierIcon(score.tier)}
                {score.tier}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <div className="font-medium mb-1">{score.tier} Agent</div>
                <div className="text-sm text-gray-600 mb-2">{getTierDescription(score.tier)}</div>
                <div className="text-xs text-gray-500">
                  Confidence: {score.confidence}%
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
        <AlertTriangle className={`${iconSizes[size]} text-amber-600 mt-0.5 flex-shrink-0`} />
        <div className="text-sm text-amber-800">
          <div className="font-medium mb-1">Adaptive AI Agent</div>
          <div className="text-xs">{score.disclaimer}</div>
        </div>
      </div>

      {/* Score Breakdown */}
      {showBreakdown && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Agent Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Capability Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span>Capability Match</span>
                </div>
                <span className="font-medium">{score.capabilityScore}/100</span>
              </div>
              <Progress value={score.capabilityScore} className="h-2" />
            </div>

            {/* Domain Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span>Domain Alignment</span>
                </div>
                <span className="font-medium">{score.domainScore}/100</span>
              </div>
              <Progress value={score.domainScore} className="h-2" />
            </div>

            {/* Overall Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span>Overall Assessment</span>
                </div>
                <span className="font-medium">{score.overallScore}/100</span>
              </div>
              <Progress value={score.overallScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reasoning */}
      {score.reasoning.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Assessment Details</span>
          </div>
          <div className="space-y-1">
            {score.reasoning.map((reason, index) => (
              <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AgentTierChipProps {
  tier: AgentTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function AgentTierChip({ 
  tier, 
  size = 'sm', 
  showIcon = true,
  className = '' 
}: AgentTierChipProps) {
  const getTierColor = (tier: AgentTier): string => {
    switch (tier) {
      case 'Generalist':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'Specialist':
        return 'text-purple-700 bg-purple-100 border-purple-200';
      case 'Experimental':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getTierIcon = (tier: AgentTier) => {
    switch (tier) {
      case 'Generalist':
        return <Brain className="h-3 w-3" />;
      case 'Specialist':
        return <Target className="h-3 w-3" />;
      case 'Experimental':
        return <Zap className="h-3 w-3" />;
      default:
        return <Brain className="h-3 w-3" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${sizeClasses[size]} ${getTierColor(tier)} border font-medium flex items-center gap-1 ${className}`}
    >
      {showIcon && getTierIcon(tier)}
      {tier}
    </Badge>
  );
}

interface AgentDisclaimerChipProps {
  disclaimer: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AgentDisclaimerChip({ 
  disclaimer, 
  size = 'sm',
  className = '' 
}: AgentDisclaimerChipProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${sizeClasses[size]} text-amber-700 bg-amber-100 border-amber-200 border font-medium flex items-center gap-1 ${className}`}
          >
            <AlertTriangle className="h-3 w-3" />
            Adaptive
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <div className="font-medium mb-1">AI Agent Disclaimer</div>
            <div className="text-sm text-gray-600">{disclaimer}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default AgentTierDisplay;
