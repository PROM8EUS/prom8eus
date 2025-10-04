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
  const frameRef = useRef<number>();

  useEffect(() => {
    setIsAnimating(true);
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentCount = start + (end - start) * easeOutCubic;
      
      setCount(currentCount);
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
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
  viewMode?: 'time' | 'money';
  hourlyRate?: number;
  lang?: 'de' | 'en';
}> = ({ value, max, color, label, animated = true, showPercentage = true, viewMode = 'time', hourlyRate = 60, lang = 'de' }) => {
  const displayValue = viewMode === 'money' ? value * hourlyRate : value;
  const displayMax = viewMode === 'money' ? max * hourlyRate : max;
  const { count } = useAnimatedCounter(animated ? displayValue : displayValue, 1500);
  const percentage = (count / displayMax) * 100;

  const formatValue = (val: number) => {
    if (viewMode === 'money') {
      return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    return `${val.toFixed(1)}h`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{formatValue(count)}</span>
          {showPercentage && (
            <Badge variant="secondary" className="text-xs">
              {percentage.toFixed(0)}%
            </Badge>
          )}
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            color
          )}
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
  lang: 'de' | 'en';
  animated?: boolean;
  showTrends?: boolean;
  viewMode?: 'time' | 'money';
}> = ({ savedHours, savedCost, period, lang, animated = true, showTrends = true, viewMode = 'time' }) => {
  const { count: animatedHours } = useAnimatedCounter(animated ? savedHours : savedHours, 2000);
  const { count: animatedCost } = useAnimatedCounter(animated ? savedCost : savedCost, 2500);
  const savingsPercentage = (savedHours / (savedHours + savedHours * 0.1)) * 100; // Mock calculation

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-green-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
        <h4 className="font-semibold text-green-800">
          {lang === 'de' ? 'ROI Übersicht' : 'ROI Overview'}
        </h4>
      </div>
      
      {viewMode === 'time' ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {animatedHours.toFixed(1)}h
            </div>
            <div className="text-xs text-green-600">
              {lang === 'de' ? 'Zeitersparnis' : 'Time Saved'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {Math.round(animatedCost).toLocaleString('de-DE')}€
            </div>
            <div className="text-xs text-green-600">
              {lang === 'de' ? 'Kosteneinsparung' : 'Cost Savings'}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-3xl font-bold text-green-700">
            {new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(animatedCost)}
          </div>
          <div className="text-sm text-green-600">
            {lang === 'de' ? 'Kosteneinsparung pro ' + period : 'Cost savings per ' + period}
          </div>
        </div>
      )}
      
      {showTrends && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-green-200">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {savingsPercentage.toFixed(0)}% {lang === 'de' ? 'Effizienzsteigerung' : 'Efficiency Gain'}
            </span>
          </div>
        </div>
      )}
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
  showComparisonChart = true,
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
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(hourlyRate);
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [isCollapsed, setIsCollapsed] = useState(collapsible);
  const [viewMode, setViewMode] = useState<'time' | 'money'>('time');

  // Calculate savings
  const savedHours = manualHours - automatedHours;
  const manualCost = manualHours * hourlyRate;
  const automatedCost = automatedHours * hourlyRate;
  const savedCost = savedHours * hourlyRate;
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
    day: lang === 'de' ? 'Tag' : 'day',
  }[period];

  // Animated counters
  const { count: animatedManualHours } = useAnimatedCounter(animated ? manualHours : manualHours, 1500);
  const { count: animatedAutomatedHours } = useAnimatedCounter(animated ? automatedHours : automatedHours, 1800);
  const { count: animatedSavedHours } = useAnimatedCounter(animated ? savedHours : savedHours, 2000);
  const { count: animatedSavedCost } = useAnimatedCounter(animated ? savedCost : savedCost, 2200);

  const handleSaveRate = () => {
    if (tempRate > 0 && onHourlyRateChange) {
      onHourlyRateChange(tempRate);
    }
    setIsEditingRate(false);
  };

  const handleCancelEdit = () => {
    setTempRate(hourlyRate);
    setIsEditingRate(false);
  };

  const toggleExpanded = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  };

  // Variant-based styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'p-3 space-y-3';
      case 'detailed':
        return 'p-6 space-y-6';
      case 'minimal':
        return 'p-2 space-y-2';
      default:
        return 'p-5 space-y-4';
    }
  };

  return (
    <Card 
      className={cn(
        'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 transition-all duration-300',
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
                lang={lang}
                animated={animated}
                showTrends={showTrends}
                viewMode={viewMode}
              />
            )}

            {/* Detailed Breakdown */}
            {showDetailedBreakdown && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {lang === 'de' ? 'Detaillierte Aufschlüsselung' : 'Detailed Breakdown'}
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      {lang === 'de' ? 'Manuelle Kosten' : 'Manual Costs'}
                    </div>
                    <div className="text-lg font-bold text-destructive">
                      {Math.round(manualCost).toLocaleString('de-DE')}€
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      {lang === 'de' ? 'Automatisierte Kosten' : 'Automated Costs'}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {Math.round(automatedCost).toLocaleString('de-DE')}€
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Kompakter Stundensatz Editor - nur bei Geld-Ansicht */}
            {interactive && viewMode === 'money' && (
              <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {lang === 'de' ? 'Stundensatz' : 'Hourly Rate'}
                    </span>
                  </div>
                  
                  <HourlyRateEditor
                    value={hourlyRate}
                    onChange={onHourlyRateChange || (() => {})}
                    onSave={(newRate) => {
                      if (onHourlyRateChange) {
                        onHourlyRateChange(newRate);
                      }
                    }}
                    showLabel={false}
                    showIcon={false}
                    showTooltip={true}
                    showValidation={false}
                    showSuccess={false}
                    showError={false}
                    size="sm"
                    variant="compact"
                    disabled={false}
                    readOnly={false}
                    autoFocus={false}
                    min={0}
                    max={500}
                    step={1}
                    showTrends={false}
                    showComparison={false}
                    showInsights={false}
                    period={period}
                    lang={lang}
                    onEditStart={() => {
                      setIsEditingRate(true);
                    }}
                    onEditEnd={() => {
                      setIsEditingRate(false);
                    }}
                    onValidationChange={(isValid, message) => {
                      // Handle validation feedback
                      console.log('Validation:', isValid, message);
                    }}
                    ariaLabel={lang === 'de' ? 'Stundensatz bearbeiten' : 'Edit hourly rate'}
                    ariaDescription={lang === 'de' 
                      ? 'Bearbeiten Sie den Stundensatz für ROI-Berechnungen'
                      : 'Edit the hourly rate for ROI calculations'
                    }
                  />
                </div>
              </div>
            )}

            {/* Insights Section */}
            {showInsights && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {lang === 'de' ? 'Erkenntnisse' : 'Insights'}
                  </h4>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {lang === 'de' 
                        ? `Sie sparen ${savingsPercentage.toFixed(0)}% Ihrer Zeit durch Automatisierung`
                        : `You save ${savingsPercentage.toFixed(0)}% of your time through automation`
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span>
                      {lang === 'de' 
                        ? `ROI von ${Math.round((savedCost / automatedCost) * 100)}% in ${periodLabel}`
                        : `ROI of ${Math.round((savedCost / automatedCost) * 100)}% in ${periodLabel}`
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

export default EffortSection;

