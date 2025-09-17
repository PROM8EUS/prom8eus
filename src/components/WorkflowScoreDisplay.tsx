import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, Target, Zap, Settings, Link } from 'lucide-react';

export interface WorkflowScoreData {
  workflowId: string;
  overallScore: number;
  categoryScore: number;
  serviceScore: number;
  triggerScore: number;
  complexityScore: number;
  integrationScore: number;
  reasoning: string[];
  confidence: number;
}

interface WorkflowScoreDisplayProps {
  score: WorkflowScoreData;
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WorkflowScoreDisplay({ 
  score, 
  showBreakdown = false, 
  size = 'md',
  className = '' 
}: WorkflowScoreDisplayProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
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
      {/* Overall Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className={`${iconSizes[size]} text-gray-600`} />
          <span className="font-medium text-gray-900">Match Score</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`${sizeClasses[size]} ${getScoreColor(score.overallScore)} border font-medium`}
              >
                {score.overallScore}/100
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <div className="font-medium mb-1">{getScoreLabel(score.overallScore)} Match</div>
                <div className="text-sm text-gray-600 mb-2">Confidence: {score.confidence}%</div>
                <div className="text-xs text-gray-500">
                  {score.reasoning.slice(0, 2).map((reason, index) => (
                    <div key={index}>• {reason}</div>
                  ))}
                  {score.reasoning.length > 2 && (
                    <div>• +{score.reasoning.length - 2} more factors</div>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Score Breakdown */}
      {showBreakdown && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Category Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>Category Match</span>
                </div>
                <span className="font-medium">{score.categoryScore}/100</span>
              </div>
              <Progress value={score.categoryScore} className="h-2" />
            </div>

            {/* Service Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-green-600" />
                  <span>Service Integration</span>
                </div>
                <span className="font-medium">{score.serviceScore}/100</span>
              </div>
              <Progress value={score.serviceScore} className="h-2" />
            </div>

            {/* Trigger Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span>Trigger Type</span>
                </div>
                <span className="font-medium">{score.triggerScore}/100</span>
              </div>
              <Progress value={score.triggerScore} className="h-2" />
            </div>

            {/* Complexity Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <span>Complexity Fit</span>
                </div>
                <span className="font-medium">{score.complexityScore}/100</span>
              </div>
              <Progress value={score.complexityScore} className="h-2" />
            </div>

            {/* Integration Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <span>Integration Coverage</span>
                </div>
                <span className="font-medium">{score.integrationScore}/100</span>
              </div>
              <Progress value={score.integrationScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reasoning */}
      {score.reasoning.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Why this score?</span>
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

interface WorkflowScoreChipProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function WorkflowScoreChip({ 
  score, 
  size = 'sm', 
  showLabel = true,
  className = '' 
}: WorkflowScoreChipProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-700 bg-green-100 border-green-200';
    if (score >= 70) return 'text-blue-700 bg-blue-100 border-blue-200';
    if (score >= 50) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${sizeClasses[size]} ${getScoreColor(score)} border font-medium ${className}`}
    >
      {score}/100{showLabel && ` (${getScoreLabel(score)})`}
    </Badge>
  );
}

export default WorkflowScoreDisplay;
