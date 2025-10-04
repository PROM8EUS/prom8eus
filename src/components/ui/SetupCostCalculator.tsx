/**
 * SetupCostCalculator Component
 * Smart setup cost calculator with visual complexity indicators and modern UX patterns
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Calculator, 
  Zap, 
  Clock, 
  DollarSign, 
  Target, 
  TrendingUp, 
  Info, 
  AlertCircle, 
  CheckCircle,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Gauge,
  Timer,
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
  CalendarStar,
  Edit3,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Share2,
  Copy,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Diamond,
  Heart,
  Star,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Award,
  Trophy,
  Medal,
  Crown,
  Gem,
  Coins,
  Banknote,
  CreditCard,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SetupCostCalculatorProps {
  // Core data
  workflow?: {
    id: string;
    title: string;
    complexity: 'Low' | 'Medium' | 'High';
    integrations: string[];
    nodes: number;
    estimatedSetupTime: number;
  };
  agent?: {
    id: string;
    name: string;
    complexity: 'Low' | 'Medium' | 'High';
    functions: number;
    tools: number;
    estimatedSetupTime: number;
  };
  // Configuration
  hourlyRate?: number;
  period?: 'year' | 'month' | 'week' | 'day';
  lang?: 'de' | 'en';
  // Display options
  showBreakdown?: boolean;
  showComplexity?: boolean;
  showTimeline?: boolean;
  showComparison?: boolean;
  showInsights?: boolean;
  // Styling
  className?: string;
  variant?: 'default' | 'compact' | 'detailed' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  // Behavior
  interactive?: boolean;
  collapsible?: boolean;
  expandable?: boolean;
  // Callbacks
  onCostChange?: (cost: number) => void;
  onComplexityChange?: (complexity: 'Low' | 'Medium' | 'High') => void;
  onTimeChange?: (time: number) => void;
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

export const SetupCostCalculator: React.FC<SetupCostCalculatorProps> = ({
  // Core data
  workflow,
  agent,
  // Configuration
  hourlyRate = 60,
  period = 'month',
  lang = 'en',
  // Display options
  showBreakdown = true,
  showComplexity = true,
  showTimeline = true,
  showComparison = true,
  showInsights = true,
  // Styling
  className,
  variant = 'default',
  size = 'md',
  // Behavior
  interactive = true,
  collapsible = false,
  expandable = false,
  // Callbacks
  onCostChange,
  onComplexityChange,
  onTimeChange,
  // Accessibility
  ariaLabel,
  ariaDescription
}) => {
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [isCollapsed, setIsCollapsed] = useState(collapsible);
  const [customRate, setCustomRate] = useState(hourlyRate);
  const [customTime, setCustomTime] = useState<number | null>(null);

  // Calculate setup cost based on complexity and time
  const calculateSetupCost = useCallback((complexity: 'Low' | 'Medium' | 'High', time?: number) => {
    const baseTime = time || getEstimatedTime(complexity);
    const complexityMultiplier = getComplexityMultiplier(complexity);
    const adjustedTime = baseTime * complexityMultiplier;
    return adjustedTime * customRate;
  }, [customRate]);

  // Get estimated time based on complexity
  const getEstimatedTime = useCallback((complexity: 'Low' | 'Medium' | 'High') => {
    const timeMap = {
      Low: 2,
      Medium: 4,
      High: 8
    };
    return timeMap[complexity];
  }, []);

  // Get complexity multiplier
  const getComplexityMultiplier = useCallback((complexity: 'Low' | 'Medium' | 'High') => {
    const multiplierMap = {
      Low: 1.0,
      Medium: 1.2,
      High: 1.5
    };
    return multiplierMap[complexity];
  }, []);

  // Get complexity color
  const getComplexityColor = useCallback((complexity: 'Low' | 'Medium' | 'High') => {
    const colorMap = {
      Low: 'text-green-600 bg-green-50 border-green-200',
      Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      High: 'text-red-600 bg-red-50 border-red-200'
    };
    return colorMap[complexity];
  }, []);

  // Get complexity icon
  const getComplexityIcon = useCallback((complexity: 'Low' | 'Medium' | 'High') => {
    const iconMap = {
      Low: <CheckCircle className="h-4 w-4" />,
      Medium: <AlertCircle className="h-4 w-4" />,
      High: <AlertCircle className="h-4 w-4" />
    };
    return iconMap[complexity];
  }, []);

  // Get current complexity
  const currentComplexity = useMemo(() => {
    if (workflow) return workflow.complexity;
    if (agent) return agent.complexity;
    return 'Medium' as const;
  }, [workflow, agent]);

  // Get current estimated time
  const currentEstimatedTime = useMemo(() => {
    if (customTime !== null) return customTime;
    if (workflow) return workflow.estimatedSetupTime;
    if (agent) return agent.estimatedSetupTime;
    return getEstimatedTime(currentComplexity);
  }, [customTime, workflow, agent, currentComplexity, getEstimatedTime]);

  // Calculate current setup cost
  const currentSetupCost = useMemo(() => {
    return calculateSetupCost(currentComplexity, currentEstimatedTime);
  }, [calculateSetupCost, currentComplexity, currentEstimatedTime]);

  // Get period label
  const getPeriodLabel = useCallback(() => {
    const labels = {
      year: lang === 'de' ? 'Jahr' : 'year',
      month: lang === 'de' ? 'Monat' : 'month',
      week: lang === 'de' ? 'Woche' : 'week',
      day: lang === 'de' ? 'Tag' : 'day'
    };
    return labels[period];
  }, [period, lang]);

  // Get complexity insights
  const getComplexityInsights = useCallback(() => {
    const insights = [];
    
    if (currentComplexity === 'Low') {
      insights.push(lang === 'de' ? 'Einfache Einrichtung' : 'Easy Setup');
    } else if (currentComplexity === 'Medium') {
      insights.push(lang === 'de' ? 'Moderate Einrichtung' : 'Moderate Setup');
    } else {
      insights.push(lang === 'de' ? 'Komplexe Einrichtung' : 'Complex Setup');
    }
    
    if (currentEstimatedTime <= 2) {
      insights.push(lang === 'de' ? 'Schnell' : 'Quick');
    } else if (currentEstimatedTime <= 4) {
      insights.push(lang === 'de' ? 'Standard' : 'Standard');
    } else {
      insights.push(lang === 'de' ? 'Zeitaufwendig' : 'Time-consuming');
    }
    
    return insights;
  }, [currentComplexity, currentEstimatedTime, lang]);

  // Get cost breakdown
  const getCostBreakdown = useCallback(() => {
    const baseTime = getEstimatedTime(currentComplexity);
    const complexityMultiplier = getComplexityMultiplier(currentComplexity);
    const adjustedTime = baseTime * complexityMultiplier;
    
    return {
      baseTime,
      complexityMultiplier,
      adjustedTime,
      hourlyRate: customRate,
      totalCost: adjustedTime * customRate
    };
  }, [currentComplexity, customRate, getEstimatedTime, getComplexityMultiplier]);

  // Handle complexity change
  const handleComplexityChange = useCallback((newComplexity: 'Low' | 'Medium' | 'High') => {
    onComplexityChange?.(newComplexity);
  }, [onComplexityChange]);

  // Handle time change
  const handleTimeChange = useCallback((newTime: number) => {
    setCustomTime(newTime);
    onTimeChange?.(newTime);
  }, [onTimeChange]);

  // Handle rate change
  const handleRateChange = useCallback((newRate: number) => {
    setCustomRate(newRate);
  }, []);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  }, [collapsible, expandable, isCollapsed]);

  // Size-based styling
  const getSizeClasses = useCallback(() => {
    switch (size) {
      case 'sm':
        return {
          container: 'text-xs',
          title: 'text-sm',
          value: 'text-lg',
          icon: 'h-4 w-4'
        };
      case 'lg':
        return {
          container: 'text-base',
          title: 'text-lg',
          value: 'text-2xl',
          icon: 'h-6 w-6'
        };
      default:
        return {
          container: 'text-sm',
          title: 'text-base',
          value: 'text-xl',
          icon: 'h-5 w-5'
        };
    }
  }, [size]);

  // Variant-based styling
  const getVariantClasses = useCallback(() => {
    switch (variant) {
      case 'compact':
        return 'p-3 space-y-3';
      case 'minimal':
        return 'p-2 space-y-2';
      case 'detailed':
        return 'p-6 space-y-6';
      default:
        return 'p-4 space-y-4';
    }
  }, [variant]);

  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();
  const complexityInsights = getComplexityInsights();
  const costBreakdown = getCostBreakdown();

  return (
    <Card 
      className={cn(
        'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 transition-all duration-300',
        className
      )}
      aria-label={ariaLabel || (lang === 'de' ? 'Setup-Kosten Rechner' : 'Setup Cost Calculator')}
      aria-describedby={ariaDescription}
    >
      <CardContent className={variantClasses}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className={cn('text-blue-600', sizeClasses.icon)} />
            </div>
            <div>
              <h3 className={cn('font-semibold text-foreground', sizeClasses.title)}>
                {lang === 'de' ? 'Setup-Kosten' : 'Setup Cost'}
              </h3>
              <p className={cn('text-muted-foreground', sizeClasses.container)}>
                {lang === 'de' ? 'Automatisierungsaufwand' : 'Automation Effort'}
              </p>
            </div>
          </div>
          
          {(collapsible || expandable) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {!isCollapsed && (
          <div className="space-y-4">
            {/* Main Cost Display */}
            <div className="text-center">
              <div className={cn('font-bold text-blue-700', sizeClasses.value)}>
                €{Math.round(currentSetupCost).toLocaleString('de-DE')}
              </div>
              <div className={cn('text-muted-foreground', sizeClasses.container)}>
                {lang === 'de' ? 'Einrichtungskosten' : 'Setup Cost'}
              </div>
            </div>

            {/* Complexity Indicator */}
            {showComplexity && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className={cn('text-muted-foreground', sizeClasses.icon)} />
                  <span className={cn('font-medium text-foreground', sizeClasses.container)}>
                    {lang === 'de' ? 'Komplexität' : 'Complexity'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn('flex items-center gap-1', getComplexityColor(currentComplexity))}
                  >
                    {getComplexityIcon(currentComplexity)}
                    {currentComplexity}
                  </Badge>
                  
                  {complexityInsights.map((insight, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {insight}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Time Breakdown */}
            {showTimeline && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className={cn('text-muted-foreground', sizeClasses.icon)} />
                  <span className={cn('font-medium text-foreground', sizeClasses.container)}>
                    {lang === 'de' ? 'Zeitaufwand' : 'Time Required'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground">
                      {lang === 'de' ? 'Grundzeit' : 'Base Time'}
                    </div>
                    <div className="font-medium">
                      {costBreakdown.baseTime}h
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground">
                      {lang === 'de' ? 'Angepasst' : 'Adjusted'}
                    </div>
                    <div className="font-medium">
                      {costBreakdown.adjustedTime.toFixed(1)}h
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cost Breakdown */}
            {showBreakdown && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className={cn('text-muted-foreground', sizeClasses.icon)} />
                  <span className={cn('font-medium text-foreground', sizeClasses.container)}>
                    {lang === 'de' ? 'Kostenaufschlüsselung' : 'Cost Breakdown'}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {lang === 'de' ? 'Zeit' : 'Time'}
                    </span>
                    <span className="font-medium">
                      {costBreakdown.adjustedTime.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {lang === 'de' ? 'Stundensatz' : 'Hourly Rate'}
                    </span>
                    <span className="font-medium">
                      €{costBreakdown.hourlyRate}/h
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">
                      {lang === 'de' ? 'Gesamt' : 'Total'}
                    </span>
                    <span className="font-bold">
                      €{Math.round(costBreakdown.totalCost).toLocaleString('de-DE')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Insights */}
            {showInsights && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className={cn('text-muted-foreground', sizeClasses.icon)} />
                  <span className={cn('font-medium text-foreground', sizeClasses.container)}>
                    {lang === 'de' ? 'Erkenntnisse' : 'Insights'}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>
                      {lang === 'de' 
                        ? `Komplexitätsfaktor: ${costBreakdown.complexityMultiplier}x`
                        : `Complexity factor: ${costBreakdown.complexityMultiplier}x`
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span>
                      {lang === 'de' 
                        ? `ROI in ${getPeriodLabel()}: ${Math.round((currentSetupCost * 12) / currentSetupCost)}%`
                        : `ROI in ${getPeriodLabel()}: ${Math.round((currentSetupCost * 12) / currentSetupCost)}%`
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SetupCostCalculator;
