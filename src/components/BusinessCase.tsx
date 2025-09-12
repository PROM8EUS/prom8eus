import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Euro,
  Zap
} from 'lucide-react';
import { t } from '../lib/i18n/i18n';

interface BusinessCaseProps {
  task: {
    name?: string;
    text?: string;
    score?: number;
    automationRatio?: number;
    humanRatio?: number;
    subtasks?: Array<{
      id: string;
      title: string;
      estimatedTime: number; // hours per period (base = day)
      automationPotential: number; // 0..1
    }>;
  };
  lang?: 'de' | 'en';
  period?: Period;
  onPeriodChange?: (p: Period) => void;
}

type Period = 'year' | 'month' | 'week' | 'day';

const HOURS_PER_PERIOD: Record<Period, number> = {
  year: 2080, // 40h * 52
  month: 160, // 40h * 4
  week: 40,
  day: 8,
};

const BusinessCase: React.FC<BusinessCaseProps> = ({ task, lang = 'de', period: periodProp, onPeriodChange }) => {
  const [mode, setMode] = useState<'time' | 'money'>('time');
  const [hourlyRate, setHourlyRate] = useState(40);
  const [periodState, setPeriodState] = useState<Period>('year');
  const period = periodProp ?? periodState;

  useEffect(() => {
    if (periodProp) {
      setPeriodState(periodProp);
    }
  }, [periodProp]);

  const handleChangePeriod = (p: Period) => {
    setPeriodState(p);
    onPeriodChange?.(p);
  };

  // Calculate business case metrics (realistic, from subtasks)
  const businessMetrics = useMemo(() => {
    const automationRatio = task.automationRatio ?? 0; // percent for display only

    // Derive hours from subtasks. If none provided, assume base 8h per task.
    const baseHours = task.subtasks && task.subtasks.length > 0
      ? task.subtasks.reduce((sum, s) => sum + (s.estimatedTime || 0), 0)
      : 8; // default one workday

    // Scale hours for selected period
    // estimatedTime is assumed per day baseline; scale to selected period
    const scale = HOURS_PER_PERIOD[period] / HOURS_PER_PERIOD['day'];
    const manualHours = baseHours * scale;

    // Automated hours derived from subtask-level automationPotential (0..1)
    const automatedHoursFromSubtasks = task.subtasks && task.subtasks.length > 0
      ? task.subtasks.reduce((sum, s) => sum + (s.estimatedTime || 0) * (s.automationPotential || 0), 0) * scale
      : manualHours * (automationRatio / 100);

    const automatedHours = Math.min(manualHours, automatedHoursFromSubtasks);
    const savedHours = Math.max(0, manualHours - automatedHours);

    // Costs
    const manualCost = manualHours * hourlyRate;
    const automationCostReduction = 0.25; // automated hour costs ~25% of manual
    const automatedCost = automatedHours * hourlyRate * automationCostReduction;
    const savedMoney = manualCost - automatedCost;

    // Setup costs (rough, proportional to scope) — allow small constant + variable
    const setupBase = 500; // base setup
    const setupVariable = savedHours * 0.5 * hourlyRate; // half-hour per saved hour as setup effort
    const automationSetupCost = Math.max(1000, setupBase + setupVariable);
    const amortizationYears = 3;
    const annualAutomationCost = automationSetupCost / amortizationYears;

    // For non-year periods, scale annual cost appropriately
    const annualToPeriod = HOURS_PER_PERIOD[period] / HOURS_PER_PERIOD['year'];
    const periodAutomationCost = annualAutomationCost * annualToPeriod;

    const totalSavingsMoney = savedMoney - periodAutomationCost;
    const roi = totalSavingsMoney > 0 ? (totalSavingsMoney / periodAutomationCost) * 100 : 0;
    const paybackPeriod = totalSavingsMoney > 0 ? (automationSetupCost / (totalSavingsMoney / annualToPeriod)) : 0; // in years

    return {
      automationRatio,
      manualHours,
      automatedHours,
      savedHours,
      manualCost,
      automatedCost,
      savedMoney,
      automationSetupCost,
      periodAutomationCost,
      totalSavingsMoney,
      roi,
      paybackPeriod,
    };
  }, [task, hourlyRate, period]);

  const periodLabel = (p: Period) => ({
    year: lang === 'de' ? 'Jahr' : 'Year',
    month: lang === 'de' ? 'Monat' : 'Month',
    week: lang === 'de' ? 'Woche' : 'Week',
    day: lang === 'de' ? 'Tag' : 'Day',
  }[p]);

  return (
    <div className="w-full bg-primary/5 rounded-lg p-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left: Title */}
          <CardTitle className="flex items-center gap-2 text-lg flex-1 min-w-0">
            <Calculator className="w-5 h-5 text-primary" />
            {t(lang, 'business_case')}
          </CardTitle>

          {/* Center: Zeitraum + Stundensatz (wraps on small screens) */}
          <div className="flex flex-wrap items-center gap-3 md:justify-center">
            {/* Period selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">
                {lang === 'de' ? 'Zeitraum' : 'Period'}
              </Label>
              <Select value={period} onValueChange={(v) => handleChangePeriod(v as Period)}>
                <SelectTrigger className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">{periodLabel('year')}</SelectItem>
                  <SelectItem value="month">{periodLabel('month')}</SelectItem>
                  <SelectItem value="week">{periodLabel('week')}</SelectItem>
                  <SelectItem value="day">{periodLabel('day')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hourly Rate Input (money mode) */}
            {mode === 'money' && (
              <div className="flex items-center gap-2">
                <Label htmlFor="hourly-rate" className="text-sm font-medium whitespace-nowrap">
                  {lang === 'de' ? 'Stundensatz (€)' : 'Hourly Rate (€)'}
                </Label>
                <div className="flex items-center space-x-1">
                  <Input
                    id="hourly-rate"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-20 h-8 text-sm"
                    min="0"
                    step="0.50"
                  />
                  <span className="text-sm text-muted-foreground">€/h</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Mode Toggle */}
          <div className="flex items-center justify-end">
            <div className="flex items-center bg-primary/10 rounded-lg p-1.5">
              <button
                onClick={() => setMode('time')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                  mode === 'time'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Clock className={`w-3 h-3 ${mode === 'time' ? 'text-foreground' : 'text-muted-foreground'}`} />
                <span>{t(lang, 'business_case_time')}</span>
              </button>
              <button
                onClick={() => setMode('money')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                  mode === 'money'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <DollarSign className={`w-3 h-3 ${mode === 'money' ? 'text-foreground' : 'text-muted-foreground'}`} />
                <span>{t(lang, 'business_case_money')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {/* Metrics Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Manuell</span>
              <span className="font-semibold text-destructive">
                {mode === 'money' 
                  ? `${businessMetrics.manualCost.toLocaleString('de-DE')} €`
                  : `${businessMetrics.manualHours.toFixed(1)} h`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Automatisiert</span>
              <span className="font-semibold text-primary">
                {mode === 'money'
                  ? `${businessMetrics.automatedCost.toLocaleString('de-DE')} €`
                  : `${businessMetrics.automatedHours.toFixed(1)} h`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Automatisierungspotenzial</span>
              <span className="font-semibold text-primary">{businessMetrics.automationRatio.toFixed(0)}%</span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Einsparung</span>
                <span className="font-bold text-green-600">
                  {mode === 'money'
                    ? `${businessMetrics.totalSavingsMoney.toLocaleString('de-DE')} €`
                    : `${businessMetrics.savedHours.toFixed(1)} h`}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ROI</span>
              <span className={`font-semibold ${businessMetrics.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {businessMetrics.roi > 0 ? '+' : ''}{businessMetrics.roi.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amortisationszeit</span>
              <span className="font-semibold">
                {businessMetrics.paybackPeriod > 0 ? `${businessMetrics.paybackPeriod.toFixed(1)} Jahre` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Setup-Kosten</span>
              <span className="font-semibold">
                {mode === 'money' 
                  ? `${businessMetrics.automationSetupCost.toLocaleString('de-DE')} €`
                  : `${Math.round(businessMetrics.automationSetupCost / hourlyRate)} h`}
              </span>
            </div>
          </div>
        </div>

        {/* Summary removed per request */}
      </div>
    </div>
  );
};

export default BusinessCase;
