import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Euro,
  Zap,
  Loader2,
  Edit3
} from 'lucide-react';
import { t } from '../lib/i18n/i18n';
import { openaiClient } from '../lib/openai';

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
  const [businessCaseData, setBusinessCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempHourlyRate, setTempHourlyRate] = useState(hourlyRate);
  const period = periodProp ?? periodState;

  useEffect(() => {
    if (periodProp) {
      setPeriodState(periodProp);
    }
  }, [periodProp]);

  // Update tempHourlyRate when hourlyRate changes
  useEffect(() => {
    setTempHourlyRate(hourlyRate);
  }, [hourlyRate]);

  // Generate business case data when task or subtasks change
  useEffect(() => {
    const generateBusinessCase = async () => {
      if (!task?.text || !task?.subtasks || task.subtasks.length === 0) {
        setBusinessCaseData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🤖 Generating business case for:', task.text);
        const data = await openaiClient.generateBusinessCase(task.text, task.subtasks, lang);
        console.log('✅ Business case generated:', data);
        setBusinessCaseData(data);
      } catch (err) {
        console.error('❌ Business case generation failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate business case');
      } finally {
        setLoading(false);
      }
    };

    generateBusinessCase();
  }, [task?.text, task?.subtasks, lang]);

  const handleChangePeriod = (p: Period) => {
    setPeriodState(p);
    onPeriodChange?.(p);
  };

  const handleSaveHourlyRate = () => {
    setHourlyRate(tempHourlyRate);
    setIsModalOpen(false);
  };

  const handleCancelHourlyRate = () => {
    setTempHourlyRate(hourlyRate);
    setIsModalOpen(false);
  };

  // Use AI-generated business case data or fallback to calculated metrics
  const businessMetrics = useMemo(() => {
    if (businessCaseData) {
      // Scale AI-generated data for selected period
      const scale = HOURS_PER_PERIOD[period] / HOURS_PER_PERIOD['year'];
      
      return {
        automationRatio: businessCaseData.automationPotential,
        manualHours: businessCaseData.manualHours * scale,
        automatedHours: businessCaseData.automatedHours * scale,
        savedHours: businessCaseData.savedHours * scale,
        manualCost: businessCaseData.manualHours * scale * hourlyRate,
        automatedCost: businessCaseData.automatedHours * scale * hourlyRate * 0.25, // 25% cost reduction
        savedMoney: businessCaseData.savedHours * scale * hourlyRate,
        automationSetupCost: businessCaseData.setupCostMoney,
        periodAutomationCost: businessCaseData.setupCostMoney * scale,
        totalSavingsMoney: (businessCaseData.savedHours * scale * hourlyRate) - (businessCaseData.setupCostMoney * scale),
        roi: businessCaseData.roi,
        paybackPeriod: businessCaseData.paybackPeriodYears,
        reasoning: businessCaseData.reasoning,
      };
    }

    // Fallback to calculated metrics if no AI data
    const automationRatio = task.automationRatio ?? 0;
    const baseHours = task.subtasks && task.subtasks.length > 0
      ? task.subtasks.reduce((sum, s) => sum + (s.estimatedTime || 0), 0)
      : 8;

    const scale = HOURS_PER_PERIOD[period] / HOURS_PER_PERIOD['day'];
    const manualHours = baseHours * scale;
    const automatedHoursFromSubtasks = task.subtasks && task.subtasks.length > 0
      ? task.subtasks.reduce((sum, s) => sum + (s.estimatedTime || 0) * (s.automationPotential || 0), 0) * scale
      : manualHours * (automationRatio / 100);

    const automatedHours = Math.min(manualHours, automatedHoursFromSubtasks);
    const savedHours = Math.max(0, manualHours - automatedHours);

    const manualCost = manualHours * hourlyRate;
    const automatedCost = automatedHours * hourlyRate * 0.25;
    const savedMoney = manualCost - automatedCost;

    const setupBase = 500;
    const setupVariable = savedHours * 0.5 * hourlyRate;
    const automationSetupCost = Math.max(1000, setupBase + setupVariable);
    const annualAutomationCost = automationSetupCost / 3;
    const annualToPeriod = HOURS_PER_PERIOD[period] / HOURS_PER_PERIOD['year'];
    const periodAutomationCost = annualAutomationCost * annualToPeriod;

    const totalSavingsMoney = savedMoney - periodAutomationCost;
    const roi = totalSavingsMoney > 0 ? (totalSavingsMoney / periodAutomationCost) * 100 : 0;
    const paybackPeriod = totalSavingsMoney > 0 ? (automationSetupCost / (totalSavingsMoney / annualToPeriod)) : 0;

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
      reasoning: null,
    };
  }, [businessCaseData, task, hourlyRate, period]);

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

          </div>

          {/* Right: Mode Dropdown + Edit Icon */}
          <div className="flex items-center justify-end gap-2">
            <Select value={mode} onValueChange={(value: 'time' | 'money') => setMode(value)}>
              <SelectTrigger className="w-32 h-8">
                <div className="flex items-center gap-2">
                  {mode === 'time' ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <DollarSign className="w-3 h-3" />
                  )}
                  <span className="text-sm">{t(lang, mode === 'time' ? 'business_case_time' : 'business_case_money')}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{t(lang, 'business_case_time')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="money">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    <span>{t(lang, 'business_case_money')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Edit Icon - only active for money mode */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${mode === 'money' ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/50 cursor-not-allowed'}`}
                  disabled={mode === 'time'}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {lang === 'de' ? 'Stundensatz anpassen' : 'Adjust Hourly Rate'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="modal-hourly-rate">
                      {lang === 'de' ? 'Stundensatz (€)' : 'Hourly Rate (€)'}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="modal-hourly-rate"
                        type="number"
                        value={tempHourlyRate}
                        onChange={(e) => setTempHourlyRate(Number(e.target.value))}
                        className="flex-1"
                        min="0"
                        step="0.50"
                      />
                      <span className="text-sm text-muted-foreground">€/h</span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCancelHourlyRate}>
                      {lang === 'de' ? 'Abbrechen' : 'Cancel'}
                    </Button>
                    <Button onClick={handleSaveHourlyRate}>
                      {lang === 'de' ? 'Speichern' : 'Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-muted-foreground">
                {lang === 'de' ? 'Business Case wird berechnet...' : 'Calculating business case...'}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-destructive mb-2">
                {lang === 'de' ? 'Fehler beim Berechnen des Business Case' : 'Error calculating business case'}
              </div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && !businessCaseData && !task?.subtasks && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              {lang === 'de' ? 'Keine Teilaufgaben verfügbar für Business Case' : 'No subtasks available for business case'}
            </div>
          </div>
        )}

        {/* Metrics Display */}
        {!loading && !error && (businessCaseData || businessMetrics) && (
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
        )}

        {/* AI Reasoning (if available) */}
        {!loading && !error && businessMetrics.reasoning && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">
              {lang === 'de' ? 'AI-Begründung:' : 'AI Reasoning:'}
            </div>
            <div className="text-sm text-muted-foreground">
              {businessMetrics.reasoning}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessCase;
