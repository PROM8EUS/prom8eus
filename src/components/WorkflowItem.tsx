import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  DollarSign, 
  ArrowRight,
  Zap,
  Wrench,
  Download,
  Star,
  Workflow
} from 'lucide-react';

export interface WorkflowItemData {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  estimatedCost: number;
  tools: string[];
  nodes: number;
  connections: number;
  author: string;
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  jsonUrl: string;
}

interface WorkflowItemProps {
  workflow: WorkflowItemData;
  lang?: 'de' | 'en';
  onDetails?: (workflow: WorkflowItemData) => void;
  onDownload?: (workflow: WorkflowItemData) => void;
  compact?: boolean;
}

export const WorkflowItem: React.FC<WorkflowItemProps> = ({
  workflow,
  lang = 'de',
  onDetails,
  onDownload,
  compact = false
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return lang === 'de' ? 'Einfach' : 'Easy';
      case 'medium': return lang === 'de' ? 'Mittel' : 'Medium';
      case 'hard': return lang === 'de' ? 'Schwer' : 'Hard';
      default: return difficulty;
    }
  };

  const calculateTotalROI = (workflow: WorkflowItemData) => {
    const monthlyTimeSavings = workflow.estimatedTime * 4;
    const hourlyRate = workflow.category === 'finance' ? 80 : workflow.category === 'marketing' ? 70 : 60;
    const monthlyCostSavings = monthlyTimeSavings * hourlyRate;
    return monthlyCostSavings + workflow.estimatedCost;
  };

  if (compact) {
    return (
      <Card className="hover:shadow-sm hover:border-primary/50 transition-all cursor-pointer" onClick={() => onDetails?.(workflow)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                <h4 className="font-medium text-sm truncate">
                  {workflow.title}
                </h4>
                <Badge variant="outline" className={getDifficultyColor(workflow.difficulty)}>
                  {getDifficultyText(workflow.difficulty)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {workflow.description}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {workflow.estimatedTime}h
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  €{calculateTotalROI(workflow)}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {workflow.rating.toFixed(1)}
                </div>
                <div className="flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  {workflow.tools.slice(0, 1).join(', ')}
                  {workflow.tools.length > 1 && ` +${workflow.tools.length - 1}`}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-3">
              {onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(workflow);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full size workflow card
  return (
    <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer" onClick={() => onDetails?.(workflow)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  {workflow.title}
                </h3>
                <Badge variant="outline" className={getDifficultyColor(workflow.difficulty)}>
                  {getDifficultyText(workflow.difficulty)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {workflow.description}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {workflow.rating.toFixed(1)}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Clock className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-900">
                  {lang === 'de' ? 'Zeitersparnis' : 'Time Savings'}
                </div>
                <div className="text-lg font-bold text-green-700">
                  {workflow.estimatedTime}h
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-900">
                  {lang === 'de' ? 'Kosteneinsparung' : 'Cost Savings'}
                </div>
                <div className="text-lg font-bold text-blue-700">
                  €{calculateTotalROI(workflow)}
                </div>
              </div>
            </div>
          </div>

          {/* Tools and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {workflow.tools.slice(0, 2).join(', ')}
                {workflow.tools.length > 2 && ` +${workflow.tools.length - 2}`}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Workflow className="w-4 h-4" />
                {workflow.nodes} {lang === 'de' ? 'Nodes' : 'Nodes'}
              </div>
              <div className="flex items-center gap-1">
                <ArrowRight className="w-4 h-4" />
                {workflow.connections} {lang === 'de' ? 'Verbindungen' : 'Connections'}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {workflow.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {workflow.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{workflow.tags.length - 4}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(workflow);
                }}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {lang === 'de' ? 'Download' : 'Download'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
