import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Users,
  Settings
} from 'lucide-react';

export interface Subtask {
  id: string;
  title: string;
  description: string;
  automationPotential: number;
  estimatedTimeReduction: number;
  tools: string[];
  complexity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  category: string;
}

interface SubtaskItemProps {
  subtask: Subtask;
  index: number;
  lang?: 'de' | 'en';
  onSelect?: (subtask: Subtask) => void;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  index,
  lang = 'de',
  onSelect
}) => {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'low': return lang === 'de' ? 'Niedrig' : 'Low';
      case 'medium': return lang === 'de' ? 'Mittel' : 'Medium';
      case 'high': return lang === 'de' ? 'Hoch' : 'High';
      default: return complexity;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-gray-600';
      case 'medium': return 'text-blue-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAutomationIcon = (potential: number) => {
    if (potential >= 80) return <Zap className="w-4 h-4 text-green-600" />;
    if (potential >= 60) return <Settings className="w-4 h-4 text-blue-600" />;
    return <Users className="w-4 h-4 text-orange-600" />;
  };

  return (
    <div className="group relative p-4 border rounded-lg hover:shadow-md hover:border-primary/30 transition-all cursor-pointer bg-card">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-lg overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-300"
          style={{ width: `${subtask.automationPotential}%` }}
        />
      </div>

      <div className="flex items-start gap-4 pt-2">
        {/* Step Number with Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-sm font-bold text-primary">{index + 1}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                {subtask.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {subtask.description}
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Automation Potential */}
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-100">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                {getAutomationIcon(subtask.automationPotential)}
              </div>
              <div>
                <div className="text-xs font-medium text-green-900">
                  {subtask.automationPotential}%
                </div>
                <div className="text-xs text-green-600">
                  {lang === 'de' ? 'Automatisierbar' : 'Automatable'}
                </div>
              </div>
            </div>

            {/* Time Reduction */}
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-100">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-medium text-blue-900">
                  -{subtask.estimatedTimeReduction}h
                </div>
                <div className="text-xs text-blue-600">
                  {lang === 'de' ? 'Zeitersparnis' : 'Time Saved'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Priority Badge */}
              <Badge 
                variant={subtask.priority === 'high' ? 'destructive' : 
                        subtask.priority === 'medium' ? 'default' : 'secondary'}
                className="text-xs"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {subtask.priority === 'high' ? (lang === 'de' ? 'Hoch' : 'High') :
                 subtask.priority === 'medium' ? (lang === 'de' ? 'Mittel' : 'Medium') :
                 (lang === 'de' ? 'Niedrig' : 'Low')}
              </Badge>

              {/* Complexity Badge */}
              <Badge variant="outline" className={`text-xs ${getComplexityColor(subtask.complexity)}`}>
                {getComplexityText(subtask.complexity)}
              </Badge>

              {/* Tools */}
              {subtask.tools.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Settings className="w-3 h-3" />
                  <span>
                    {subtask.tools[0]}
                    {subtask.tools.length > 1 && ` +${subtask.tools.length - 1}`}
                  </span>
                </div>
              )}
            </div>

            {/* Action Button */}
            {onSelect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelect(subtask)}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
