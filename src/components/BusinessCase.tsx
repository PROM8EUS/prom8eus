import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
      estimatedTime: number;
      automationPotential: number;
    }>;
  };
  lang?: 'de' | 'en';
}

const BusinessCase: React.FC<BusinessCaseProps> = ({ task, lang = 'de' }) => {
  const [mode, setMode] = useState<'time' | 'money'>('time');
  const [hourlyRate, setHourlyRate] = useState(40);

  // Calculate business case metrics
  const businessMetrics = useMemo(() => {
    const taskName = task.name || task.text || 'Task';
    const automationRatio = task.automationRatio || 0;
    const humanRatio = task.humanRatio || 0;
    
    // Estimate annual hours based on task complexity and frequency
    const estimatedAnnualHours = 200; // Base assumption: 200 hours per year
    const manualHours = estimatedAnnualHours;
    
    // Calculate automated hours: if automationRatio is 0%, then 0 hours are automated
    // If automationRatio is 100%, then all hours are automated
    const automatedHours = estimatedAnnualHours * (automationRatio / 100);
    const savedHours = manualHours - automatedHours;
    
    // Ensure consistency: humanRatio should be the remaining percentage
    const calculatedHumanRatio = 100 - automationRatio;
    
    // Calculate costs
    const manualCost = manualHours * hourlyRate;
    
    // Automated cost should be much lower - automation reduces cost per hour significantly
    // If 12% is automated, the cost for those hours should be much lower (e.g., 20% of manual cost)
    const automationCostReduction = 0.2; // Automation reduces cost to 20% of manual cost
    const automatedCost = automatedHours * hourlyRate * automationCostReduction;
    const savedMoney = manualCost - automatedCost;
    
    // Automation setup costs (estimated) - should be proportional to automation scope
    const automationSetupCost = Math.max(1000, automationRatio * 50); // Base 1000€ + 50€ per % automation
    const annualAutomationCost = automationSetupCost / 3; // Amortized over 3 years
    
    // ROI calculations
    const totalAnnualSavings = savedMoney - annualAutomationCost;
    const roi = totalAnnualSavings > 0 ? ((totalAnnualSavings / annualAutomationCost) * 100) : 0;
    const paybackPeriod = totalAnnualSavings > 0 ? (automationSetupCost / totalAnnualSavings) : 0;
    
    return {
      taskName,
      automationRatio,
      humanRatio: calculatedHumanRatio, // Use calculated value for consistency
      manualHours,
      automatedHours,
      savedHours,
      manualCost,
      automatedCost,
      savedMoney,
      automationSetupCost,
      annualAutomationCost,
      totalAnnualSavings,
      roi,
      paybackPeriod
    };
  }, [task, hourlyRate]);

  return (
    <div className="w-full bg-primary/5 rounded-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5 text-primary" />
            {t(lang, 'business_case')}
          </CardTitle>
          
          {/* Hourly Rate Input and Mode Toggle */}
          <div className="flex items-center gap-4">
            {/* Hourly Rate Input - only show in money mode */}
            {mode === 'money' && (
              <div className="flex items-center gap-2">
                <Label htmlFor="hourly-rate" className="text-sm font-medium whitespace-nowrap">
                  {t(lang, 'business_case_hourly_rate')}
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
            
            {/* Mode Toggle */}
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
              <span className="text-sm text-muted-foreground">
                Manuell
              </span>
              <span className="font-semibold text-destructive">
                {mode === 'money' 
                  ? `${businessMetrics.manualCost.toLocaleString('de-DE')} €`
                  : `${businessMetrics.manualHours} h`
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Automatisiert
              </span>
              <span className="font-semibold text-primary">
                {mode === 'money'
                  ? `${businessMetrics.automatedCost.toLocaleString('de-DE')} €`
                  : `${businessMetrics.automatedHours.toFixed(1)} h`
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Automatisierungspotenzial
              </span>
              <span className="font-semibold text-primary">
                {businessMetrics.automationRatio.toFixed(0)}%
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Einsparung
                </span>
                <span className="font-bold text-green-600">
                  {mode === 'money'
                    ? `${businessMetrics.totalAnnualSavings.toLocaleString('de-DE')} €`
                    : `${businessMetrics.savedHours.toFixed(1)} h`
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                ROI
              </span>
              <span className={`font-semibold ${businessMetrics.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {businessMetrics.roi > 0 ? '+' : ''}{businessMetrics.roi.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Amortisationszeit
              </span>
              <span className="font-semibold">
                {businessMetrics.paybackPeriod > 0 ? `${businessMetrics.paybackPeriod.toFixed(1)} Jahre` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Setup-Kosten
              </span>
              <span className="font-semibold">
                {mode === 'money' 
                  ? `${businessMetrics.automationSetupCost.toLocaleString('de-DE')} €`
                  : `${Math.round(businessMetrics.automationSetupCost / hourlyRate)} h`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className={`p-4 rounded-lg border ${
          businessMetrics.totalAnnualSavings > 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {businessMetrics.totalAnnualSavings > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-orange-600" />
            )}
            <span className="font-medium text-sm">
              {mode === 'money' ? 'Finanzielle Bewertung' : 'Zeitbewertung'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {mode === 'money' 
              ? businessMetrics.totalAnnualSavings > 0
                ? `Diese Aufgabe kann jährlich ${businessMetrics.totalAnnualSavings.toLocaleString('de-DE')} € einsparen.`
                : `Diese Aufgabe würde ${Math.abs(businessMetrics.totalAnnualSavings).toLocaleString('de-DE')} € pro Jahr kosten.`
              : `Diese Aufgabe kann ${businessMetrics.savedHours.toFixed(1)} Stunden pro Jahr einsparen.`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessCase;
