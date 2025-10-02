import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { HelpCircle, Edit3, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EffortSectionProps {
  manualHours: number;
  automatedHours: number;
  hourlyRate: number;
  period: 'year' | 'month' | 'week' | 'day';
  lang?: 'de' | 'en';
  onHourlyRateChange?: (newRate: number) => void;
  className?: string;
}

export const EffortSection: React.FC<EffortSectionProps> = ({
  manualHours,
  automatedHours,
  hourlyRate,
  period,
  lang = 'de',
  onHourlyRateChange,
  className
}) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(hourlyRate);

  // Calculate savings
  const savedHours = manualHours - automatedHours;
  const manualCost = manualHours * hourlyRate;
  const automatedCost = automatedHours * hourlyRate;
  const savedCost = savedHours * hourlyRate;

  // Calculate percentages for bar chart
  const maxHours = manualHours;
  const manualPercent = 100;
  const automatedPercent = (automatedHours / maxHours) * 100;

  // Period labels
  const periodLabel = {
    year: lang === 'de' ? 'Jahr' : 'year',
    month: lang === 'de' ? 'Monat' : 'month',
    week: lang === 'de' ? 'Woche' : 'week',
    day: lang === 'de' ? 'Tag' : 'day',
  }[period];

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

  return (
    <Card className={cn('bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20', className)}>
      <CardContent className="p-5 space-y-4">
        {/* Header with Title and Info Tooltip */}
        <div className="flex items-center gap-2 pb-1">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            {lang === 'de' ? 'Aufwand' : 'Effort'}
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  {lang === 'de' 
                    ? 'Durchschnittswerte basierend auf Teilaufgaben-Analyse. Stundensatz anpassbar.'
                    : 'Average values based on subtask analysis. Hourly rate adjustable.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Bar Chart - Vorher/Nachher */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {lang === 'de' ? 'Zeitaufwand im Vergleich' : 'Time Comparison'}
          </div>
          
          {/* Manual (Before) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {lang === 'de' ? 'Vorher (Manuell)' : 'Before (Manual)'}
              </span>
              <span className="font-medium text-destructive">{manualHours.toFixed(1)}h</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-destructive/80 to-destructive rounded-full transition-all duration-500 ease-out"
                style={{ width: `${manualPercent}%` }}
              />
            </div>
          </div>

          {/* Automated (After) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {lang === 'de' ? 'Nachher (Automatisiert)' : 'After (Automated)'}
              </span>
              <span className="font-medium text-primary">{automatedHours.toFixed(1)}h</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${automatedPercent}%` }}
              />
            </div>
          </div>

          {/* Savings Indicator with ROI and Editable Rate */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-center gap-2">
              <div className="flex-1 border-t border-dashed border-green-600/40" />
              <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <span className="text-xs font-bold text-green-700">
                  {lang === 'de' ? 'Einsparung:' : 'Savings:'} {savedHours.toFixed(1)}h ({((savedHours / manualHours) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex-1 border-t border-dashed border-green-600/40" />
            </div>
            
            {/* ROI in Money with Editable Rate */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground">≈ {Math.round(savedCost).toLocaleString('de-DE')} €/{periodLabel} {lang === 'de' ? 'bei' : 'at'}</span>
              {isEditingRate ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={tempRate}
                    onChange={(e) => setTempRate(Number(e.target.value))}
                    className="h-6 w-16 px-2 text-xs"
                    min="0"
                    max="500"
                    step="1"
                  />
                  <span className="text-xs">€/h</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleSaveRate}
                  >
                    <Check className="w-3 h-3 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingRate(true)}
                  className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer font-medium"
                >
                  [{hourlyRate} €/h]
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EffortSection;

