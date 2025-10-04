import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
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
import { businessCaseCache } from '../lib/businessCaseCache';

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
  month: 40, // Realistische monatliche Arbeitszeit für eine spezifische Aufgabe
  week: 10, // Realistische wöchentliche Arbeitszeit für eine spezifische Aufgabe
  day: 2, // Realistische tägliche Arbeitszeit für eine spezifische Aufgabe
};

const BusinessCase: React.FC<BusinessCaseProps> = ({ task, lang = 'de', period: periodProp, onPeriodChange }) => {
  const [mode, setMode] = useState<'time' | 'money'>('time');
  const [hourlyRate, setHourlyRate] = useState(40);
  const [aiHourlyRate, setAiHourlyRate] = useState<number | null>(null);
  const [periodState, setPeriodState] = useState<Period>('year');
  const [businessCaseData, setBusinessCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [tempHourlyRate, setTempHourlyRate] = useState(hourlyRate);
  const [isEmployee, setIsEmployee] = useState(true);
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

  // Use existing business case data or generate if not available
  useEffect(() => {
    if (task?.businessCase) {
      // Use existing business case data from complete analysis
      console.log('✅ Using existing business case data');
      setBusinessCaseData(task.businessCase);
      
      // Set AI hourly rate as default if no manual rate is set
      if (!hourlyRate || hourlyRate === 40) {
        const aiRate = task.businessCase.employmentType === 'employee' 
          ? task.businessCase.hourlyRateEmployee 
          : task.businessCase.hourlyRateFreelancer;
        setHourlyRate(aiRate);
        setAiHourlyRate(aiRate);
      }
      
      // Set initial employment type
      setIsEmployee(task.businessCase.employmentType === 'employee');
      setLoading(false);
      setError(null);
    } else if (task?.text && task?.subtasks && task.subtasks.length > 0) {
      // Fallback: generate business case if not available - WITH DEBOUNCING
      const generateBusinessCase = async () => {
        // Additional check: if we already have business case data, don't regenerate
        if (businessCaseData) {
          console.log('✅ [BusinessCase] Already have business case data, skipping generation');
          return;
        }
        
        setLoading(true);
        setError(null);

        try {
          console.log('🤖 Generating business case for:', task.text);
          const data = await businessCaseCache.getOrGenerate(
            task.text,
            task.subtasks,
            lang,
            openaiClient.generateBusinessCase.bind(openaiClient)
          );
          console.log('✅ Business case generated:', data);
          setBusinessCaseData(data);
          
          // Set AI hourly rate as default if no manual rate is set
          if (!hourlyRate || hourlyRate === 40) {
            const aiRate = data.employmentType === 'employee' 
              ? data.hourlyRateEmployee 
              : data.hourlyRateFreelancer;
            setHourlyRate(aiRate);
            setAiHourlyRate(aiRate);
          }
          
          // Set initial employment type
          setIsEmployee(data.employmentType === 'employee');
        } catch (err) {
          console.error('❌ Business case generation failed:', err);
          setError(err instanceof Error ? err.message : 'Failed to generate business case');
        } finally {
          setLoading(false);
        }
      };

      generateBusinessCase();
    } else {
      setBusinessCaseData(null);
      setLoading(false);
      setError(null);
    }
  }, [task?.businessCase, task?.text, task?.subtasks, lang, hourlyRate]);

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

  // Use AI-generated business case data only (no fallback to prevent jumping numbers)
  const businessMetrics = useMemo(() => {
    if (!businessCaseData) {
      return null; // Return null if no AI data to prevent showing fallback numbers
    }

    // AI now generates monthly values directly, so scale from month to other periods
    const scale = HOURS_PER_PERIOD[period] / HOURS_PER_PERIOD['month'];
    
    // Use AI-generated hourly rate based on employment type, or fallback to user input
    const aiHourlyRate = businessCaseData.employmentType === 'employee' 
      ? businessCaseData.hourlyRateEmployee 
      : businessCaseData.hourlyRateFreelancer;
    
    const effectiveHourlyRate = hourlyRate || aiHourlyRate;
    
    return {
      automationRatio: businessCaseData.automationPotential,
      manualHours: businessCaseData.manualHours * scale,
      automatedHours: businessCaseData.automatedHours * scale,
      savedHours: businessCaseData.savedHours * scale,
      manualCost: businessCaseData.manualHours * scale * effectiveHourlyRate,
      automatedCost: businessCaseData.automatedHours * scale * effectiveHourlyRate * 0.25, // 25% cost reduction
      savedMoney: businessCaseData.savedHours * scale * effectiveHourlyRate,
      totalSavingsMoney: businessCaseData.savedHours * scale * effectiveHourlyRate,
      reasoning: businessCaseData.reasoning,
      employmentType: businessCaseData.employmentType,
      aiHourlyRate: aiHourlyRate,
      effectiveHourlyRate: effectiveHourlyRate,
    } as const;
  }, [businessCaseData, hourlyRate, period]);

  const periodLabel = (p: Period) => ({
    year: lang === 'de' ? 'Jahr' : 'Year',
    month: lang === 'de' ? 'Monat' : 'Month',
    week: lang === 'de' ? 'Woche' : 'Week',
    day: lang === 'de' ? 'Tag' : 'Day',
  }[p]);

  return (
    <div className="w-full bg-primary/5 rounded-lg p-6">
             <div className="mb-6">
               <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                 {/* Title */}
                 <CardTitle className="flex items-center gap-2 text-lg flex-shrink-0">
                   <Calculator className="w-5 h-5 text-primary" />
                   {t(lang, 'business_case')}
                 </CardTitle>

                 {/* Controls - right aligned on larger screens, no wrapping */}
                 <div className="flex items-center gap-3 sm:justify-end">
                     {/* Period selector */}
                     <div className="flex items-center gap-2">
                       <Select value={period} onValueChange={(v) => handleChangePeriod(v as Period)}>
                         <SelectTrigger className="h-8 w-24">
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

                     {/* Mode Dropdown + Edit Icon */}
                     <div className="flex items-center gap-2">
                       <Select value={mode} onValueChange={(value: 'time' | 'money') => setMode(value)}>
                         <SelectTrigger className="w-24 h-8">
                           <div className="flex items-center gap-1">
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
                           {/* Employment Type Selection */}
                           {businessCaseData && (
                             <div className="space-y-3">
                               <Label>
                                 {lang === 'de' ? 'Anstellungstyp:' : 'Employment Type:'}
                               </Label>
                               <ToggleGroup
                                 type="single"
                                 value={isEmployee ? 'employee' : 'freelancer'}
                                 onValueChange={(value) => {
                                   if (value) {
                                     const checked = value === 'employee';
                                     setIsEmployee(checked);
                                     const newRate = checked 
                                       ? businessCaseData.hourlyRateEmployee 
                                       : businessCaseData.hourlyRateFreelancer;
                                     setTempHourlyRate(newRate);
                                   }
                                 }}
                                 className="justify-start"
                               >
                                 <ToggleGroupItem value="employee" className="flex-1">
                                   {lang === 'de' ? 'Angestellter' : 'Employee'}
                                   <span className="ml-2 text-xs opacity-75">
                                     {businessCaseData.hourlyRateEmployee.toFixed(0)} €/h {lang === 'de' ? '(Brutto)' : '(Gross)'}
                                   </span>
                                 </ToggleGroupItem>
                                 <ToggleGroupItem value="freelancer" className="flex-1">
                                   {lang === 'de' ? 'Freelancer' : 'Freelancer'}
                                   <span className="ml-2 text-xs opacity-75">
                                     {businessCaseData.hourlyRateFreelancer.toFixed(0)} €/h {lang === 'de' ? '(Netto)' : '(Net)'}
                                   </span>
                                 </ToggleGroupItem>
                               </ToggleGroup>
                             </div>
                           )}

                           <div className="space-y-4">
                             <Label htmlFor="modal-hourly-rate">
                               {lang === 'de' ? 'Stundensatz (€)' : 'Hourly Rate (€)'}
                             </Label>
                             
                             {/* Slider */}
                             <div className="space-y-2">
                               <Slider
                                 value={[tempHourlyRate]}
                                 onValueChange={(value) => setTempHourlyRate(value[0])}
                                 max={200}
                                 min={0}
                                 step={1}
                                 className="w-full"
                               />
                               <div className="flex justify-between text-xs text-muted-foreground">
                                 <span>0 €/h</span>
                                 <span>200 €/h</span>
                               </div>
                             </div>
                             
                             {/* Manual Input */}
                             <div className="flex items-center space-x-2">
                               <Input
                                 id="modal-hourly-rate"
                                 type="number"
                                 value={tempHourlyRate}
                                 onChange={(e) => setTempHourlyRate(Number(e.target.value))}
                                 className="flex-1"
                                 min="0"
                                 max="200"
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


        {/* Metrics Display (simplified) */}
        {!loading && !error && businessMetrics && (
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Manuell</span>
                <span className="font-semibold text-destructive">
                  {mode === 'money' 
                    ? `${Math.round(businessMetrics.manualCost).toLocaleString('de-DE')} €`
                    : `${businessMetrics.manualHours.toFixed(1)} h`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Automatisiert</span>
                <span className="font-semibold text-primary">
                  {mode === 'money'
                    ? `${Math.round(businessMetrics.automatedCost).toLocaleString('de-DE')} €`
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
                      ? `${Math.round(businessMetrics.totalSavingsMoney).toLocaleString('de-DE')} €`
                      : `${businessMetrics.savedHours.toFixed(1)} h`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Reasoning (collapsible) */}
        {!loading && !error && businessMetrics && (businessMetrics.reasoning ?? '').length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setShowDetails(v => !v)}
            >
              {showDetails ? (lang === 'de' ? 'Details ausblenden' : 'Hide details') : (lang === 'de' ? 'Details anzeigen' : 'Show details')}
            </button>
            {showDetails && (
              <div className="mt-2 p-3 bg-primary/10 rounded-lg text-sm text-muted-foreground">
                {businessMetrics.reasoning}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default BusinessCase;
