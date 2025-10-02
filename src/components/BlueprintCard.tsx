import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Eye, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BlueprintData {
  id: string;
  name: string;
  description?: string;
  timeSavings?: number; // hours per month
  complexity?: 'Low' | 'Medium' | 'High' | 'Easy' | 'Hard';
  jsonUrl?: string;
  workflowData?: any; // n8n workflow JSON data
  integrations?: string[];
  category?: string;
  isAIGenerated?: boolean; // Flag for AI-generated blueprints
}

interface BlueprintCardProps {
  blueprint: BlueprintData;
  lang?: 'de' | 'en';
  period?: 'year' | 'month' | 'week' | 'day';
  onDetailsClick?: (blueprint: BlueprintData) => void;
  className?: string;
  compact?: boolean;
}

export const BlueprintCard: React.FC<BlueprintCardProps> = ({
  blueprint,
  lang = 'de',
  period = 'month',
  onDetailsClick,
  className,
  compact = true
}) => {
  // Period label
  const periodLabel = {
    year: lang === 'de' ? 'Jahr' : 'year',
    month: lang === 'de' ? 'Monat' : 'month',
    week: lang === 'de' ? 'Woche' : 'week',
    day: lang === 'de' ? 'Tag' : 'day',
  }[period];

  // Calculate time savings for the selected period
  const getTimeSavingsForPeriod = () => {
    if (!blueprint.timeSavings) return 0;
    
    const periodMultipliers = {
      year: 12,
      month: 1,
      week: 0.25,
      day: 1 / 30,
    };
    
    return blueprint.timeSavings * periodMultipliers[period];
  };

  const timeSavings = getTimeSavingsForPeriod();

  // Handle blueprint download
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      let workflowData = blueprint.workflowData;

      // If no workflowData but jsonUrl exists, fetch it
      if (!workflowData && blueprint.jsonUrl) {
        const response = await fetch(blueprint.jsonUrl);
        if (response.ok) {
          workflowData = await response.json();
        }
      }

      // Create download data
      const downloadData = {
        metadata: {
          id: blueprint.id,
          name: blueprint.name,
          description: blueprint.description,
          timeSavings: blueprint.timeSavings,
          complexity: blueprint.complexity,
          integrations: blueprint.integrations,
          category: blueprint.category,
          exportedAt: new Date().toISOString(),
        },
        n8nWorkflow: workflowData || {
          name: blueprint.name,
          nodes: [],
          connections: {},
          active: false,
          settings: {},
          versionId: '1'
        }
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${blueprint.id || blueprint.name.toLowerCase().replace(/\s+/g, '-')}_n8n_blueprint.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Blueprint downloaded:', blueprint.name);
    } catch (error) {
      console.error('❌ Error downloading blueprint:', error);
    }
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'Low':
      case 'Easy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'High':
      case 'Hard':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getComplexityText = (complexity?: string) => {
    switch (complexity) {
      case 'Low':
      case 'Easy':
        return lang === 'de' ? 'Einfach' : 'Easy';
      case 'Medium':
        return lang === 'de' ? 'Mittel' : 'Medium';
      case 'High':
      case 'Hard':
        return lang === 'de' ? 'Schwer' : 'Hard';
      default:
        return complexity || (lang === 'de' ? 'Unbekannt' : 'Unknown');
    }
  };

  if (compact) {
    return (
      <div className={cn(
        'p-2.5 border rounded-md space-y-1.5',
        blueprint.isAIGenerated 
          ? 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200' 
          : 'bg-primary/5 border-primary/20',
        className
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {blueprint.isAIGenerated && (
                <Sparkles className="w-2.5 h-2.5 text-purple-600 flex-shrink-0" />
              )}
              <h5 className="text-[11px] font-semibold text-foreground truncate leading-tight">
                {lang === 'de' ? 'Blueprint:' : 'Blueprint:'} "{blueprint.name}"
              </h5>
            </div>
            {blueprint.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {blueprint.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {blueprint.isAIGenerated && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-3.5 bg-purple-100 text-purple-700 border-purple-300">
                AI
              </Badge>
            )}
            {blueprint.complexity && (
              <Badge 
                variant="outline" 
                className={cn('text-[9px] px-1.5 py-0 h-3.5', getComplexityColor(blueprint.complexity))}
              >
                {getComplexityText(blueprint.complexity)}
              </Badge>
            )}
          </div>
        </div>

        {/* Time Savings */}
        {timeSavings > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
            <Clock className="w-2.5 h-2.5" />
            <span>
              {lang === 'de' ? 'Spart' : 'Saves'} {timeSavings.toFixed(1)}h/{periodLabel}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-7 text-xs flex-1"
          >
            <Download className="w-3 h-3 mr-1" />
            {lang === 'de' ? 'Download' : 'Download'}
          </Button>
          {onDetailsClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDetailsClick(blueprint);
              }}
              className="h-7 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              {lang === 'de' ? 'Details' : 'Details'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Full size blueprint card (for use outside of SubtaskCard)
  return (
    <div className={cn(
      'p-4 bg-card border rounded-lg space-y-3 hover:shadow-md transition-shadow',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground mb-1">
            {blueprint.name}
          </h4>
          {blueprint.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {blueprint.description}
            </p>
          )}
        </div>
        {blueprint.complexity && (
          <Badge 
            variant="outline" 
            className={cn('text-xs', getComplexityColor(blueprint.complexity))}
          >
            {getComplexityText(blueprint.complexity)}
          </Badge>
        )}
      </div>

      {/* Integrations */}
      {blueprint.integrations && blueprint.integrations.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {blueprint.integrations.slice(0, 3).map((integration, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {integration}
            </Badge>
          ))}
          {blueprint.integrations.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{blueprint.integrations.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="flex items-center justify-between">
        {timeSavings > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <Clock className="w-3 h-3" />
            <span>
              {lang === 'de' ? 'Spart' : 'Saves'} {timeSavings.toFixed(1)}h/{periodLabel}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          {lang === 'de' ? 'Herunterladen' : 'Download'}
        </Button>
        {onDetailsClick && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onDetailsClick(blueprint)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            {lang === 'de' ? 'Details ansehen' : 'View Details'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BlueprintCard;

