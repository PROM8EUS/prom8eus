import React from 'react';
import { Solution } from '../types/solutions';
import SolutionIcon from './ui/SolutionIcon';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Star, Clock, TrendingUp, Users, Activity, ExternalLink, Play, BookOpen, Github } from 'lucide-react';
import { cn } from '../lib/utils';

interface SolutionCardProps {
  solution: Solution;
  viewMode: 'grid' | 'list';
  onSelect?: () => void;
  className?: string;
}

export default function SolutionCard({ 
  solution, 
  viewMode, 
  onSelect,
  className 
}: SolutionCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{rating}</span>
        <span className="text-xs text-muted-foreground">({solution.metrics.reviewCount})</span>
      </div>
    );
  };

  const renderAutomationPotential = () => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Automation</span>
          <span className="font-medium">{solution.automationPotential}%</span>
        </div>
        <Progress value={solution.automationPotential} className="h-2" />
      </div>
    );
  };

  const renderMetrics = () => {
    return (
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{solution.metrics.usageCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          <span>{solution.metrics.successRate.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{solution.metrics.averageExecutionTime}s</span>
        </div>
      </div>
    );
  };

  const renderTags = () => {
    return (
      <div className="flex flex-wrap gap-1">
        {solution.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {solution.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{solution.tags.length - 3}
          </Badge>
        )}
      </div>
    );
  };

  const renderActions = () => {
    return (
      <div className="flex items-center gap-2">
        {solution.documentationUrl && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <BookOpen className="h-4 w-4" />
          </Button>
        )}
        {solution.demoUrl && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Play className="h-4 w-4" />
          </Button>
        )}
        {solution.githubUrl && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Github className="h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="default" 
          size="sm" 
          onClick={onSelect}
          className="flex-1"
        >
          View Details
        </Button>
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon and Type */}
            <div className="flex-shrink-0">
              <SolutionIcon type={solution.type} size="lg" variant="filled" />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg truncate">{solution.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {solution.description}
                  </p>
                </div>
                
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{solution.category}</Badge>
                    <Badge variant={solution.implementationPriority === 'High' ? 'default' : 'secondary'}>
                      {solution.implementationPriority}
                    </Badge>
                  </div>
                  {renderStars(solution.metrics.userRating)}
                </div>
              </div>

              {/* Tags and Subcategories */}
              <div className="flex items-center gap-4 mb-3">
                {renderTags()}
                <div className="text-xs text-muted-foreground">
                  {solution.subcategories.join(' • ')}
                </div>
              </div>

              {/* Metrics Row */}
              <div className="flex items-center justify-between">
                {renderMetrics()}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{solution.estimatedROI}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{solution.timeToValue}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 py-3 border-t">
          {renderActions()}
        </CardFooter>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className={cn("hover:shadow-md transition-shadow h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <SolutionIcon type={solution.type} size="md" variant="filled" />
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {solution.category}
            </Badge>
            <Badge 
              variant={solution.implementationPriority === 'High' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {solution.implementationPriority}
            </Badge>
          </div>
        </div>
        
        <CardTitle className="text-base line-clamp-2 leading-tight">
          {solution.name}
        </CardTitle>
        
        <CardDescription className="text-sm line-clamp-2">
          {solution.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Automation Potential */}
        {renderAutomationPotential()}

        {/* Tags */}
        {renderTags()}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">{solution.estimatedROI}</div>
            <div className="text-muted-foreground">ROI</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">{solution.timeToValue}</div>
            <div className="text-muted-foreground">Time to Value</div>
          </div>
        </div>

        {/* Rating and Usage */}
        <div className="flex items-center justify-between text-sm">
          {renderStars(solution.metrics.userRating)}
          <div className="text-muted-foreground">
            {solution.metrics.usageCount} users
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Success: {solution.metrics.successRate.toFixed(1)}%</span>
          <span>Avg: {solution.metrics.averageExecutionTime}s</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        {renderActions()}
      </CardFooter>
    </Card>
  );
}

// Export individual components for specific use cases
export function SolutionCardGrid({ solution, onSelect, className }: Omit<SolutionCardProps, 'viewMode'>) {
  return (
    <SolutionCard 
      solution={solution} 
      viewMode="grid" 
      onSelect={onSelect}
      className={className}
    />
  );
}

export function SolutionCardList({ solution, onSelect, className }: Omit<SolutionCardProps, 'viewMode'>) {
  return (
    <SolutionCard 
      solution={solution} 
      viewMode="list" 
      onSelect={onSelect}
      className={className}
    />
  );
}

// Compact card for use in other components
export function SolutionCardCompact({ solution, onSelect, className }: Omit<SolutionCardProps, 'viewMode'>) {
  return (
    <Card className={cn("hover:shadow-sm transition-shadow", className)}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <SolutionIcon type={solution.type} size="sm" />
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{solution.name}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{solution.automationPotential}% automation</span>
              <span>•</span>
              <span>{solution.estimatedROI} ROI</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onSelect}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
