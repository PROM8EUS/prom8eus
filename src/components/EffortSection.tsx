import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { HourlyRateEditor } from './ui/HourlyRateEditor';
import { 
  HelpCircle, 
  Edit3, 
  Check, 
  X, 
  TrendingUp, 
  Clock, 
  DollarSign,
  BarChart3,
  PieChart,
  CheckCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EffortSectionProps {
  manualHours: number;
  automatedHours: number;
  hourlyRate: number;
  period: 'year' | 'month' | 'week' | 'day';
  lang?: 'de' | 'en';
  onHourlyRateChange?: (newRate: number) => void;
  className?: string;
  // Enhanced features
  animated?: boolean;
  showProgressBars?: boolean;
  showAnimatedCounters?: boolean;
  showROIBlock?: boolean;
  showDetailedBreakdown?: boolean;
  showComparisonChart?: boolean;
  showTrends?: boolean;
  showInsights?: boolean;
  // Visual enhancements
  variant?: 'default' | 'compact' | 'detailed' | 'minimal';
  theme?: 'light' | 'dark' | 'auto';
  // Interaction
  interactive?: boolean;
  collapsible?: boolean;
  expandable?: boolean;
  // Data visualization
  showPercentage?: boolean;
  showCurrency?: boolean;
  showTimeFormat?: 'hours' | 'minutes' | 'days';
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

// Animated Counter Hook
const useAnimatedCounter = (end: number, duration: number = 2000, start: number = 0) => {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (end === start) return;
    
    setIsAnimating(true);
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentCount = start + (end - start) * easeOutCubic;
      
      setCount(Math.round(currentCount * 10) / 10);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration, start]);

  return { count, isAnimating };
};

// Progress Bar Component
const AnimatedProgressBar: React.FC<{
  value: number;
  max: number;
  color: string;
  label: string;
  animated?: boolean;
  showPercentage?: boolean;
  viewMode: 'time' | 'money';
  hourlyRate: number;
  lang: 'de' | 'en';
}> = ({ value, max, color, label, animated = true, showPercentage = true, viewMode, hourlyRate, lang }) => {
  const { count: animatedValue } = useAnimatedCounter(animated ? value : value, 1500);
  const percentage = (animatedValue / max) * 100;
  const cost = animatedValue * hourlyRate;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">
            {viewMode === 'time' ? `${animatedValue.toFixed(1)}h` : `€${cost.toFixed(0)}`}
          </span>
          {showPercentage && (
            <span className="text-xs text-gray-500">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

// ROI Block Component
const ROIBlock: React.FC<{
  savedHours: number;
  savedCost: number;
  period: string;
  animated?: boolean;
  lang: 'de' | 'en';
}> = ({ savedHours, savedCost, period, animated = true, lang }) => {
  const { count: animatedHours } = useAnimatedCounter(animated ? savedHours : savedHours, 2000);
  const { count: animatedCost } = useAnimatedCounter(animated ? savedCost : savedCost, 2500);
  const savingsPercentage = (savedHours / (savedHours + savedHours * 0.1)) * 100; // Mock calculation

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900">
              {lang === 'de' ? 'Einsparungen' : 'Savings'}
            </h4>
            <p className="text-sm text-green-700">
              {lang === 'de' ? 'Durch Automatisierung' : 'Through automation'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-900">
            {animatedHours.toFixed(1)}h
          </div>
          <div className="text-lg font-semibold text-green-700">
            €{animatedCost.toFixed(0)}
          </div>
          <div className="text-xs text-green-600">
            {lang === 'de' ? `pro ${period}` : `per ${period}`}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main EffortSection Component
export const EffortSection: React.FC<EffortSectionProps> = ({
  manualHours,
  automatedHours,
  hourlyRate,
  period,
  lang = 'de',
  onHourlyRateChange,
  className,
  // Enhanced features
  animated = true,
  showProgressBars = true,
  showAnimatedCounters = true,
  showROIBlock = true,
  showDetailedBreakdown = false,
  showComparisonChart = false,
  showTrends = true,
  showInsights = false,
  // Visual enhancements
  variant = 'default',
  theme = 'auto',
  // Interaction
  interactive = true,
  collapsible = false,
  expandable = false,
  // Data visualization
  showPercentage = true,
  showCurrency = true,
  showTimeFormat = 'hours',
  // Accessibility
  ariaLabel,
  ariaDescription
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'time' | 'money'>('time');

  // Calculate savings
  const savedHours = manualHours - automatedHours;
  const manualCost = manualHours * hourlyRate;
  const automatedCost = automatedHours * hourlyRate;
  const savedCost = manualCost - automatedCost;
  const savingsPercentage = (savedHours / manualHours) * 100;

  // Calculate percentages for progress bars
  const maxHours = Math.max(manualHours, automatedHours);
  const manualPercent = (manualHours / maxHours) * 100;
  const automatedPercent = (automatedHours / maxHours) * 100;

  // Period labels
  const periodLabel = {
    year: lang === 'de' ? 'Jahr' : 'year',
    month: lang === 'de' ? 'Monat' : 'month',
    week: lang === 'de' ? 'Woche' : 'week',
    day: lang === 'de' ? 'Tag' : 'day'
  }[period];

  // Animated counters
  const { count: animatedManualHours } = useAnimatedCounter(animated ? manualHours : manualHours, 1500);
  const { count: animatedAutomatedHours } = useAnimatedCounter(animated ? automatedHours : automatedHours, 1800);
  const { count: animatedSavedHours } = useAnimatedCounter(animated ? savedHours : savedHours, 2000);
  const { count: animatedSavedCost } = useAnimatedCounter(animated ? savedCost : savedCost, 2500);

  const toggleExpanded = () => {
    if (collapsible || expandable) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Variant-based styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'p-3 space-y-3';
      case 'detailed':
        return 'p-6 space-y-5';
      case 'minimal':
        return 'p-2 space-y-2';
      default:
        return 'p-5 space-y-4';
    }
  };

  return (
    <Card 
      className={cn(
        'bg-gray-50 border-gray-200 transition-all duration-300',
        className
      )}
      aria-label={ariaLabel || (lang === 'de' ? 'Aufwand und ROI Übersicht' : 'Effort and ROI Overview')}
      aria-describedby={ariaDescription}
    >
      <CardContent className={getVariantStyles()}>
        {/* Header with Enhanced Title and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {lang === 'de' ? 'Aufwand im Monat' : 'Monthly Effort'}
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    {lang === 'de' 
                      ? 'Monatliche Durchschnittswerte basierend auf Tätigkeits-Analyse. Stundensatz anpassbar.'
                      : 'Monthly average values based on job analysis. Hourly rate adjustable.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zeit|Geld Schalter */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('time')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'time' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lang === 'de' ? 'Zeit' : 'Time'}
              </button>
              <button
                onClick={() => setViewMode('money')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'money' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lang === 'de' ? 'Geld' : 'Money'}
              </button>
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
        </div>

        {!isCollapsed && (
          <div className="space-y-6">
            {/* Progress Bars Section */}
            {showProgressBars && (
              <div className="space-y-4">
                
                <div className="space-y-4">
                  <AnimatedProgressBar
                    value={manualHours}
                    max={maxHours}
                    color="bg-[#34877E]"
                    label={lang === 'de' ? 'Vorher (Manuell/Monat)' : 'Before (Manual/Month)'}
                    animated={animated}
                    showPercentage={showPercentage}
                    viewMode={viewMode}
                    hourlyRate={hourlyRate}
                    lang={lang}
                  />
                  
                  <AnimatedProgressBar
                    value={automatedHours}
                    max={maxHours}
                    color="bg-gradient-to-r from-primary to-primary/80"
                    label={lang === 'de' ? 'Nachher (Automatisiert/Monat)' : 'After (Automated/Month)'}
                    animated={animated}
                    showPercentage={showPercentage}
                    viewMode={viewMode}
                    hourlyRate={hourlyRate}
                    lang={lang}
                  />
                </div>
              </div>
            )}

            {/* ROI Block */}
            {showROIBlock && (
              <ROIBlock
                savedHours={savedHours}
                savedCost={savedCost}
                period={periodLabel}
                animated={animated}
                lang={lang}
              />
            )}

            {/* Detailed Breakdown */}
            {showDetailedBreakdown && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {lang === 'de' ? 'Detaillierte Aufschlüsselung' : 'Detailed Breakdown'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">
                      {lang === 'de' ? 'Manuelle Stunden' : 'Manual Hours'}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {animatedManualHours.toFixed(1)}h
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">
                      {lang === 'de' ? 'Automatisierte Stunden' : 'Automated Hours'}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {animatedAutomatedHours.toFixed(1)}h
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Kompakter Stundensatz Editor - nur bei Geld-Ansicht */}
            {interactive && viewMode === 'money' && (
              <div className="bg-white/50 rounded-lg p-2 border border-gray-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-700 flex-shrink-0">
                    {lang === 'de' ? 'Stundensatz:' : 'Hourly rate:'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <HourlyRateEditor
                      value={hourlyRate}
                      onChange={(newRate) => {
                        onHourlyRateChange?.(newRate);
                      }}
                      onValidationChange={(isValid, message) => {
                        // Handle validation feedback
                        console.log('Validation:', isValid, message);
                      }}
                      lang={lang}
                      className="w-full"
                      showLabel={false}
                      showIcon={false}
                      showTooltip={false}
                      showTrends={false}
                      showComparison={false}
                      showInsights={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Insights Section */}
            {showInsights && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  {lang === 'de' ? 'Erkenntnisse' : 'Insights'}
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-sm text-amber-800">
                    <span className="font-medium">
                      {lang === 'de' ? 'ROI von ' : 'ROI of '}
                      {Math.round((savedCost / automatedCost) * 100)}%
                      {lang === 'de' ? ' in ' : ' in '}
                      {periodLabel}
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

export default EffortSection;