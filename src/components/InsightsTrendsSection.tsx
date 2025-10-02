import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';
import { TrendInsight, getTrendIcon, getTrendColor } from '@/lib/trendAnalysis';
import { cn } from '@/lib/utils';

interface InsightsTrendsSectionProps {
  insights: TrendInsight[];
  lang?: 'de' | 'en';
  className?: string;
}

export const InsightsTrendsSection: React.FC<InsightsTrendsSectionProps> = ({
  insights,
  lang = 'de',
  className
}) => {
  // If no insights, show empty state
  if (insights.length === 0) {
    return (
      <Card className={cn('bg-muted/30 border-dashed', className)}>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm">
              {lang === 'de' 
                ? 'Keine Trend-Insights verfügbar' 
                : 'No trend insights available'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm', className)}>
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            {lang === 'de' ? 'Insights / Trends' : 'Insights / Trends'}
          </h3>
        </div>

        {/* Insights List */}
        <div className="space-y-2">
          {insights.map((insight) => (
            <InsightItem
              key={insight.id}
              insight={insight}
              lang={lang}
            />
          ))}
        </div>

        {/* Footer hint */}
        {insights.length > 0 && (
          <p className="text-xs text-muted-foreground italic pt-2 border-t">
            {lang === 'de' 
              ? 'Basierend auf aktueller Workflow-Popularität und Adoption'
              : 'Based on current workflow popularity and adoption'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

interface InsightItemProps {
  insight: TrendInsight;
  lang: 'de' | 'en';
}

const InsightItem: React.FC<InsightItemProps> = ({ insight, lang }) => {
  const getTrendIconComponent = (trend: 'growing' | 'stable' | 'declining') => {
    switch (trend) {
      case 'growing':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'declining':
        return <TrendingDown className="w-3.5 h-3.5" />;
      case 'stable':
        return <Minus className="w-3.5 h-3.5" />;
    }
  };

  const getTrendTextColor = (trend: 'growing' | 'stable' | 'declining') => {
    switch (trend) {
      case 'growing':
        return 'text-green-700';
      case 'declining':
        return 'text-red-700';
      case 'stable':
        return 'text-gray-700';
    }
  };

  const getTrendBgColor = (trend: 'growing' | 'stable' | 'declining') => {
    switch (trend) {
      case 'growing':
        return 'bg-green-50 border-green-200';
      case 'declining':
        return 'bg-red-50 border-red-200';
      case 'stable':
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-2.5 p-2.5 rounded-lg border text-xs shadow-sm',
      getTrendBgColor(insight.trend)
    )}>
      {/* Trend Icon */}
      <div className={cn('flex-shrink-0 p-1 rounded-md bg-white/50', getTrendTextColor(insight.trend))}>
        {getTrendIconComponent(insight.trend)}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <span className={cn('font-medium', getTrendTextColor(insight.trend))}>
          {insight.description}
        </span>
        
        {/* Related integrations */}
        {insight.relatedIntegrations.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {insight.relatedIntegrations.slice(0, 2).map((integration, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="text-xs px-1.5 py-0 h-4 bg-white/80"
              >
                {integration}
              </Badge>
            ))}
            {insight.relatedIntegrations.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{insight.relatedIntegrations.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Percentage Badge */}
      {insight.percentage !== undefined && (
        <div className={cn(
          'flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold',
          insight.trend === 'growing' ? 'bg-green-100 text-green-700' :
          insight.trend === 'declining' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        )}>
          {insight.trend === 'declining' ? '-' : '+'}{insight.percentage}%
        </div>
      )}
    </div>
  );
};

export default InsightsTrendsSection;

