import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Eye, Download, Zap, Clock, Play, Settings } from 'lucide-react';

export interface SolutionData {
  id: string;
  name: string;
  filename?: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  type: 'workflow' | 'ai-agent';
  
  // Metrics
  automationScore?: number;
  roi?: string;
  timeToValue?: string;
  successRate?: string;
  userCount?: string;
  avgTime?: string;
  rating?: number;
  reviewCount?: number;
  
  // Workflow specific
  nodeCount?: number;
  triggerType?: 'Complex' | 'Webhook' | 'Manual' | 'Scheduled';
  complexity?: 'Low' | 'Medium' | 'High';
  integrations?: string[];
  tags?: string[];
  
  // AI Agent specific
  agentType?: string;
  capabilities?: string[];
  
  // Common
  active?: boolean;
  lastUpdated?: string;
}

interface SolutionCardProps {
  solution: SolutionData;
  onView?: (solution: SolutionData) => void;
  onDownload?: (solution: SolutionData) => void;
  className?: string;
  isAdmin?: boolean; // New prop to determine context
}

function SolutionCard({ solution, onView, onDownload, className, isAdmin = false }: SolutionCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workflow':
        return <Settings className="w-5 h-5" />;
      case 'ai-agent':
        return <Zap className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getTriggerIcon = (triggerType?: string) => {
    switch (triggerType) {
      case 'Webhook': return <Zap className="h-4 w-4" />;
      case 'Scheduled': return <Clock className="h-4 w-4" />;
      case 'Manual': return <Play className="h-4 w-4" />;
      case 'Complex': return <Settings className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Admin view - compact and technical
  if (isAdmin) {
    return (
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          {/* Title */}
          <h3 
            className="font-medium text-gray-900 text-sm leading-tight mb-2"
            title={solution.filename || solution.name}
          >
            {solution.name}
          </h3>
          
          {/* Tags between title and description */}
          <div className="flex items-center gap-1 mb-2">
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {solution.category}
            </Badge>
            <Badge className={`text-xs whitespace-nowrap ${getComplexityColor(solution.complexity)}`}>
              {solution.complexity || 'Unknown'}
            </Badge>
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {solution.description}
          </p>
          
          {/* Key Info Row */}
          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <div className="flex items-center gap-3">
              {solution.nodeCount && (
                <span>{solution.nodeCount} nodes</span>
              )}
              {solution.triggerType && (
                <div className="flex items-center gap-1">
                  {getTriggerIcon(solution.triggerType)}
                  <span>{solution.triggerType}</span>
                </div>
              )}
            </div>
            {solution.automationScore && (
              <span className="font-medium text-gray-900">{solution.automationScore}%</span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onView?.(solution)}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onDownload?.(solution)}
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Frontend view - rich and business-focused
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        {/* Header Badges */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {solution.category}
          </Badge>
          <Badge className={`text-xs ${getComplexityColor(solution.complexity)}`}>
            {solution.complexity || 'Unknown'}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Zap className="h-3 w-3" />
            <span>{solution.complexity || 'Unknown'}</span>
          </div>
        </div>

        {/* Title and Icon */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
            <Settings className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <CardTitle 
              className="text-lg font-semibold text-gray-900"
              title={solution.filename || solution.name}
            >
              {solution.name}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">
          {solution.description}
        </p>
        
        {/* Automation Progress */}
        {solution.automationScore !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Automation</span>
              <span className="font-medium">{solution.automationScore}%</span>
            </div>
            <Progress value={solution.automationScore} className="h-2" />
          </div>
        )}
        
        {/* Tags/Integrations */}
        {(solution.tags || solution.integrations) && (
          <div className="flex flex-wrap gap-1">
            {(solution.tags || []).slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {solution.integrations && solution.integrations.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{solution.integrations.length} more
              </Badge>
            )}
          </div>
        )}
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {solution.roi && (
            <div className="flex justify-between">
              <span className="text-gray-600">ROI:</span>
              <span className="font-medium text-green-600">{solution.roi}</span>
            </div>
          )}
          {solution.timeToValue && (
            <div className="flex justify-between">
              <span className="text-gray-600">Time to Value:</span>
              <span className="font-medium">{solution.timeToValue}</span>
            </div>
          )}
          {solution.rating && (
            <div className="flex justify-between">
              <span className="text-gray-600">Rating:</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{solution.rating.toFixed(1)} ({solution.reviewCount})</span>
              </div>
            </div>
          )}
          {solution.userCount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Users:</span>
              <span className="font-medium">{solution.userCount} users</span>
            </div>
          )}
          {solution.successRate && (
            <div className="flex justify-between">
              <span className="text-gray-600">Success:</span>
              <span className="font-medium text-green-600">{solution.successRate}</span>
            </div>
          )}
          {solution.avgTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Avg:</span>
              <span className="font-medium">{solution.avgTime}</span>
            </div>
          )}
        </div>
        
        {/* Technical Details */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {solution.nodeCount && (
              <span>{solution.nodeCount} nodes</span>
            )}
            {solution.triggerType && (
              <div className="flex items-center gap-1">
                {getTriggerIcon(solution.triggerType)}
                <span>{solution.triggerType}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView?.(solution)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDownload?.(solution)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SolutionCard;
export { SolutionData };