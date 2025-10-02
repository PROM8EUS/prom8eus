import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { DynamicSubtask } from '@/lib/types';
import { cn } from '@/lib/utils';
import ScoreCircle from './ScoreCircle';

interface SubtaskCardProps {
  subtask: DynamicSubtask;
  index: number;
  lang?: 'de' | 'en';
  period?: 'year' | 'month' | 'week' | 'day';
  timeSavings?: number;
  recommendation?: string;
  workflowVisualization?: string[];
  matchedBlueprints?: React.ReactNode; // Placeholder for BlueprintCard(s)
  matchedBlueprintsData?: any[]; // Raw blueprint data for extracting integrations
  onDetailsClick?: (subtask: DynamicSubtask) => void;
  className?: string;
}

export const SubtaskCard: React.FC<SubtaskCardProps> = ({
  subtask,
  index,
  lang = 'de',
  period = 'month',
  timeSavings,
  recommendation,
  workflowVisualization,
  matchedBlueprints,
  matchedBlueprintsData,
  onDetailsClick,
  className
}) => {
  // Calculate time savings if not provided
  const calculatedTimeSavings = timeSavings ?? (subtask.estimatedTime * subtask.automationPotential);
  
  // Period label
  const periodLabel = {
    year: lang === 'de' ? 'Jahr' : 'year',
    month: lang === 'de' ? 'Monat' : 'month',
    week: lang === 'de' ? 'Woche' : 'week',
    day: lang === 'de' ? 'Tag' : 'day',
  }[period];

  // Get automation potential percentage
  const automationPercent = Math.round(subtask.automationPotential * 100);

  // Generate default recommendation if not provided
  const displayRecommendation = recommendation ?? generateDefaultRecommendation(subtask, lang);

  // Generate workflow visualization
  // Priority: 1) Provided visualization, 2) Extract from blueprints, 3) Generate default
  let displayWorkflow: string[] = [];
  if (workflowVisualization) {
    displayWorkflow = workflowVisualization;
  } else if (matchedBlueprintsData && matchedBlueprintsData.length > 0) {
    // Extract integrations from first matched blueprint
    const firstBlueprint = matchedBlueprintsData[0];
    displayWorkflow = (firstBlueprint.integrations || []).slice(0, 3);
  } else if (subtask.systems && subtask.systems.length > 0) {
    displayWorkflow = subtask.systems.slice(0, 3);
  } else {
    displayWorkflow = generateDefaultWorkflow(subtask, lang);
  }

  return (
    <div className={cn('p-3 space-y-2', className)}>
      {/* Header Section */}
      <div className="space-y-1.5">
        {/* Title with ScoreCircle */}
        <div className="flex items-start gap-2.5">
          {/* ScoreCircle Left */}
          <div className="flex-shrink-0 mt-0.5">
            <div style={{ width: 28, height: 28 }}>
              <ScoreCircle 
                score={automationPercent} 
                maxScore={100} 
                variant="xsmall" 
                lang={lang}
                animate={false}
                label=""
                showPercentage={false}
              />
            </div>
          </div>
          
          {/* Number and Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground mt-0.5 flex-shrink-0">
                {index + 1})
              </span>
              <h4 className="text-xs font-semibold text-foreground leading-snug">
                {subtask.title}
              </h4>
            </div>
          </div>
        </div>

        {/* Recommendation - Aligned with title */}
        {displayRecommendation && (
          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pl-9">
            <Lightbulb className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 text-amber-500" />
            <span className="leading-snug">
              <span className="font-medium">{lang === 'de' ? 'Empfehlung:' : 'Recommendation:'}</span>
              {' '}
              {displayRecommendation}
            </span>
          </div>
        )}

        {/* Workflow Visualization - Aligned with title */}
        {displayWorkflow.length > 0 && (
          <div className="flex items-center flex-wrap gap-1 text-[10px] pl-9">
            <span className="text-muted-foreground font-medium text-[9px] uppercase tracking-wide">{lang === 'de' ? 'Workflow:' : 'Workflow:'}</span>
            {displayWorkflow.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md font-medium text-primary">
                  {step}
                </div>
                {idx < displayWorkflow.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-primary/40" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Matched Blueprints Section */}
      {matchedBlueprints && (
        <div className="pl-9">
          {matchedBlueprints}
        </div>
      )}

      {/* No Blueprint Available State */}
      {!matchedBlueprints && (
        <div className="pl-9">
          <div className="text-[10px] text-muted-foreground/60 italic py-0.5">
            {lang === 'de' ? 'Kein Blueprint verfügbar' : 'No blueprint available'}
          </div>
        </div>
      )}

      {/* Time Savings Footer */}
      <div className="flex items-center justify-between pl-9 pt-0.5">
        <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
          <span>⏱️</span>
          <span>
            {lang === 'de' ? 'Spart' : 'Saves'} {calculatedTimeSavings.toFixed(1)}h/{periodLabel}
          </span>
        </div>
        
        {onDetailsClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDetailsClick(subtask)}
            className="h-6 text-xs text-primary hover:text-primary"
          >
            {lang === 'de' ? 'Details' : 'Details'}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Helper function to generate default recommendation based on subtask data
function generateDefaultRecommendation(subtask: DynamicSubtask, lang: 'de' | 'en'): string {
  const { systems, complexity, automationPotential, title } = subtask;
  const titleLower = title.toLowerCase();
  
  // Context-aware recommendations with concrete tools
  if (titleLower.includes('aggregat') || titleLower.includes('sammeln') || titleLower.includes('collect')) {
    return lang === 'de'
      ? 'ETL-Pipeline mit Airbyte/Fivetran, Data Warehouse (Snowflake/BigQuery)'
      : 'ETL pipeline with Airbyte/Fivetran, Data Warehouse (Snowflake/BigQuery)';
  }
  
  if (titleLower.includes('daten') || titleLower.includes('data')) {
    if (lang === 'de') {
      return systems.length > 0 
        ? `Datenverarbeitung via ${systems.slice(0, 2).join(', ')}, Python/Pandas für Transformation`
        : 'Datenverarbeitung mit AWS S3, dbt für Transformation, PostgreSQL';
    } else {
      return systems.length > 0
        ? `Data processing via ${systems.slice(0, 2).join(', ')}, Python/Pandas for transformation`
        : 'Data processing with AWS S3, dbt for transformation, PostgreSQL';
    }
  }
  
  if (titleLower.includes('beleg') || titleLower.includes('konti') || titleLower.includes('buchung')) {
    return lang === 'de'
      ? 'OCR mit Tesseract/Google Vision, DATEV-API-Integration, Validierung'
      : 'OCR with Tesseract/Google Vision, DATEV API integration, validation';
  }
  
  if (titleLower.includes('bilanz') || titleLower.includes('abschluss') || titleLower.includes('gwv') || titleLower.includes('verlust')) {
    return lang === 'de'
      ? 'SQL-Aggregation, Excel-Export via OpenPyXL, DATEV-Schnittstelle'
      : 'SQL aggregation, Excel export via OpenPyXL, DATEV interface';
  }
  
  if (titleLower.includes('test') || titleLower.includes('validier') || titleLower.includes('prüf') || titleLower.includes('qa')) {
    return lang === 'de' 
      ? 'GitHub Actions/GitLab CI, Jest/Pytest/Selenium, Slack/Teams-Notifications'
      : 'GitHub Actions/GitLab CI, Jest/Pytest/Selenium, Slack/Teams notifications';
  }
  
  if (titleLower.includes('email') || titleLower.includes('mail')) {
    return lang === 'de'
      ? 'IMAP/Gmail-API, Regex-Filter, SendGrid/Mailgun für Antworten'
      : 'IMAP/Gmail API, regex filters, SendGrid/Mailgun for responses';
  }
  
  if (titleLower.includes('rechnung') || titleLower.includes('invoice')) {
    return lang === 'de'
      ? 'OCR-Parsing (Tesseract/Cloud Vision), DATEV-REST-API, Validation-Rules'
      : 'OCR parsing (Tesseract/Cloud Vision), DATEV REST API, validation rules';
  }
  
  if (titleLower.includes('api') || titleLower.includes('integration')) {
    return lang === 'de'
      ? 'REST/GraphQL-API mit Express/FastAPI, Auth (JWT/OAuth), OpenAPI-Docs'
      : 'REST/GraphQL API with Express/FastAPI, Auth (JWT/OAuth), OpenAPI docs';
  }
  
  if (titleLower.includes('deploy') || titleLower.includes('ci') || titleLower.includes('cd')) {
    return lang === 'de'
      ? 'Docker-Container, GitHub Actions, Deploy auf AWS/Vercel/K8s'
      : 'Docker containers, GitHub Actions, deploy to AWS/Vercel/K8s';
  }
  
  // Generic based on automation potential
  if (automationPotential >= 0.8) {
    if (lang === 'de') {
      return systems.length > 0 
        ? `Vollautomatisierung mit ${systems.slice(0, 2).join(', ')}`
        : 'Vollautomatisierung, kein manueller Eingriff nötig';
    } else {
      return systems.length > 0
        ? `Full automation with ${systems.slice(0, 2).join(', ')}`
        : 'Full automation, no manual intervention needed';
    }
  } else if (automationPotential >= 0.6) {
    if (lang === 'de') {
      return complexity === 'low' 
        ? 'Teilautomatisierung mit manueller Überprüfung'
        : 'Schrittweise Automatisierung mit Qualitätskontrolle';
    } else {
      return complexity === 'low'
        ? 'Partial automation with manual review'
        : 'Step-by-step automation with quality control';
    }
  } else {
    if (lang === 'de') {
      return 'Automatisierung von Teilschritten, Assistenz-Tools nutzen';
    } else {
      return 'Automation of sub-steps, use assistance tools';
    }
  }
}

// Helper function to generate default workflow visualization
function generateDefaultWorkflow(subtask: DynamicSubtask, lang: 'de' | 'en'): string[] {
  const { systems, automationPotential, title } = subtask;
  const titleLower = title.toLowerCase();
  
  // If systems are specified, use them (max 3)
  if (systems.length > 0) {
    return systems.slice(0, 3);
  }
  
  // Generate context-aware workflow based on task content
  // Email/Communication tasks
  if (titleLower.includes('email') || titleLower.includes('mail') || titleLower.includes('kommunikation')) {
    return lang === 'de' ? ['Email', 'Filter', 'Verarbeitung'] : ['Email', 'Filter', 'Process'];
  }
  
  // Data Collection/Aggregation
  if (titleLower.includes('sammeln') || titleLower.includes('collect') || titleLower.includes('aggregat')) {
    return lang === 'de' ? ['Quellen', 'ETL-Pipeline', 'Data-Warehouse'] : ['Sources', 'ETL Pipeline', 'Data Warehouse'];
  }
  
  // Data/Document tasks
  if (titleLower.includes('daten') || titleLower.includes('data') || titleLower.includes('dokument')) {
    return lang === 'de' ? ['S3/Storage', 'Transform', 'PostgreSQL/DB'] : ['S3/Storage', 'Transform', 'PostgreSQL/DB'];
  }
  
  // Invoice/Billing
  if (titleLower.includes('rechnung') || titleLower.includes('invoice') || titleLower.includes('beleg')) {
    return lang === 'de' ? ['Email/Upload', 'OCR-Service', 'DATEV-API'] : ['Email/Upload', 'OCR Service', 'DATEV API'];
  }
  
  // Report/Analysis tasks
  if (titleLower.includes('report') || titleLower.includes('bericht') || titleLower.includes('analyse')) {
    return lang === 'de' ? ['SQL/BigQuery', 'Pandas/Analytics', 'Tableau/PowerBI'] : ['SQL/BigQuery', 'Pandas/Analytics', 'Tableau/PowerBI'];
  }
  
  // Testing/Validation tasks
  if (titleLower.includes('test') || titleLower.includes('validier') || titleLower.includes('prüf') || titleLower.includes('qa')) {
    return lang === 'de' ? ['Git-Webhook', 'Jest/Pytest', 'Slack-Notif'] : ['Git Webhook', 'Jest/Pytest', 'Slack Notif'];
  }
  
  // Deployment/CI/CD tasks
  if (titleLower.includes('deploy') || titleLower.includes('build') || titleLower.includes('release') || titleLower.includes('ci')) {
    return lang === 'de' ? ['GitHub-Action', 'Docker-Build', 'K8s/Vercel'] : ['GitHub Action', 'Docker Build', 'K8s/Vercel'];
  }
  
  // Calendar/Scheduling tasks
  if (titleLower.includes('termin') || titleLower.includes('kalender') || titleLower.includes('meeting') || titleLower.includes('plan')) {
    return lang === 'de' ? ['Form/Booking', 'Google-Cal-API', 'Email-Confirm'] : ['Form/Booking', 'Google Cal API', 'Email Confirm'];
  }
  
  // Payment/Finance tasks
  if (titleLower.includes('zahlung') || titleLower.includes('payment') || titleLower.includes('budget')) {
    return lang === 'de' ? ['Stripe-Webhook', 'DB-Update', 'DATEV-Sync'] : ['Stripe Webhook', 'DB Update', 'DATEV Sync'];
  }
  
  // Email tasks
  if (titleLower.includes('email') || titleLower.includes('mail') || titleLower.includes('kommunikation')) {
    return lang === 'de' ? ['IMAP-Trigger', 'Filter/Parse', 'Auto-Response'] : ['IMAP Trigger', 'Filter/Parse', 'Auto Response'];
  }
  
  // Development/Frontend
  if (titleLower.includes('frontend') || titleLower.includes('ui') || titleLower.includes('interface')) {
    return lang === 'de' ? ['React/Vue', 'API-Call', 'State-Mgmt'] : ['React/Vue', 'API Call', 'State Mgmt'];
  }
  
  // API Development
  if (titleLower.includes('api') || titleLower.includes('backend') || titleLower.includes('server')) {
    return lang === 'de' ? ['Express/FastAPI', 'Auth-Middleware', 'DB-Layer'] : ['Express/FastAPI', 'Auth Middleware', 'DB Layer'];
  }
  
  // Generic workflow based on automation potential
  if (automationPotential >= 0.8) {
    return lang === 'de' 
      ? ['Trigger', 'Automation', 'Output']
      : ['Trigger', 'Automation', 'Output'];
  } else if (automationPotential >= 0.6) {
    return lang === 'de'
      ? ['Input', 'Auto-Check', 'Freigabe']
      : ['Input', 'Auto-Check', 'Approval'];
  } else {
    return lang === 'de'
      ? ['Vorbereitung', 'Manuell']
      : ['Preparation', 'Manual'];
  }
}

export default SubtaskCard;

