import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { DynamicSubtask } from '@/lib/types';
import { SubtaskCard } from './SubtaskCard';
import { BlueprintCard, BlueprintData } from './BlueprintCard';
import { matchWorkflowsToSubtask } from '@/lib/workflowMatcher';
import { WorkflowIndex } from '@/lib/workflowIndexer';
import { generateWorkflowFast } from '@/lib/workflowGenerator';
import { isOpenAIAvailable } from '@/lib/openai';

/**
 * Create a fallback blueprint when AI generation fails
 */
function createFallbackBlueprint(subtask: DynamicSubtask, lang: 'de' | 'en'): BlueprintData {
  const titleLower = subtask.title.toLowerCase();
  
  // Extract likely integrations from title
  const integrations: string[] = [];
  const systems = subtask.systems || [];
  
  // Intelligent workflow extraction based on task content
  let workflowName = '';
  let workflowDescription = '';
  let nodes: string[] = [];
  
  if (titleLower.includes('sammeln') || titleLower.includes('aggreg')) {
    workflowName = lang === 'de' ? 'Datensammel-Workflow' : 'Data Collection Workflow';
    workflowDescription = lang === 'de' 
      ? 'Automatisierte Datensammlung mit ETL-Pipeline und Data Warehouse'
      : 'Automated data collection with ETL pipeline and data warehouse';
    nodes = ['Webhook Trigger', 'Airbyte ETL', 'Snowflake/BigQuery', 'Notification'];
    integrations.push('Airbyte', 'Snowflake', 'Slack');
  } else if (titleLower.includes('interview') || titleLower.includes('termin')) {
    workflowName = lang === 'de' ? 'Termin-Verwaltungs-Workflow' : 'Appointment Management Workflow';
    workflowDescription = lang === 'de'
      ? 'Automatische Kalenderverwaltung und E-Mail-Benachrichtigungen'
      : 'Automatic calendar management and email notifications';
    nodes = ['Form Submission', 'Google Calendar API', 'Email Confirmation', 'Reminder'];
    integrations.push('Google Calendar', 'Gmail', 'Calendly');
  } else if (titleLower.includes('anzeige') || titleLower.includes('post')) {
    workflowName = lang === 'de' ? 'Posting-Workflow' : 'Posting Workflow';
    workflowDescription = lang === 'de'
      ? 'Automatisches Erstellen und Veröffentlichen von Anzeigen'
      : 'Automatic creation and publishing of job postings';
    nodes = ['Job Board API', 'Content Template', 'Multi-Platform Posting', 'Analytics'];
    integrations.push('LinkedIn', 'Indeed', 'Xing');
  } else if (titleLower.includes('mitarbeiterentwicklung') || titleLower.includes('personalplanung')) {
    workflowName = lang === 'de' ? `Talent-Entwickler: ${subtask.title}` : `Talent Developer: ${subtask.title}`;
    workflowDescription = lang === 'de'
      ? `Strategischer Workflow für Mitarbeiterentwicklung: ${subtask.title}`
      : `Strategic workflow for employee development: ${subtask.title}`;
    nodes = ['HR-System', 'Learning Platform', 'Performance Tracking', 'Feedback Loop'];
    integrations.push('HR-Software', 'Learning Management', 'Slack', 'Google Calendar');
  } else if (titleLower.includes('onboarding') || titleLower.includes('einarbeitung')) {
    workflowName = lang === 'de' ? `Onboarding-Guide: ${subtask.title}` : `Onboarding Guide: ${subtask.title}`;
    workflowDescription = lang === 'de'
      ? `Strukturierter Workflow für nahtlose Einarbeitung: ${subtask.title}`
      : `Structured workflow for seamless onboarding: ${subtask.title}`;
    nodes = ['New Employee Trigger', 'Document Creation', 'Welcome Email', 'Task Assignment'];
    integrations.push('Google Docs', 'Gmail', 'Slack', 'Airtable');
  } else if (titleLower.includes('bewerbung') || titleLower.includes('recruiting')) {
    workflowName = lang === 'de' ? `Recruiting-Expert: ${subtask.title}` : `Recruiting Expert: ${subtask.title}`;
    workflowDescription = lang === 'de'
      ? `Intelligenter Workflow für effizientes Recruiting: ${subtask.title}`
      : `Intelligent workflow for efficient recruiting: ${subtask.title}`;
    nodes = ['Application Received', 'AI Analysis', 'Status Update', 'Interview Scheduling'];
    integrations.push('Airtable', 'OpenAI', 'Gmail', 'LinkedIn');
  } else if (titleLower.includes('konflikt') || titleLower.includes('mediation')) {
    workflowName = lang === 'de' ? `Mediations-Assistent: ${subtask.title}` : `Mediation Assistant: ${subtask.title}`;
    workflowDescription = lang === 'de'
      ? `Intelligenter Workflow für strukturierte Konfliktlösung: ${subtask.title}`
      : `Intelligent workflow for structured conflict resolution: ${subtask.title}`;
    nodes = ['Conflict Detection', 'Guide Creation', 'Meeting Scheduling', 'Follow-up'];
    integrations.push('Google Docs', 'Google Calendar', 'Gmail', 'Slack');
  } else if (titleLower.includes('gespräch')) {
    workflowName = lang === 'de' ? `Gesprächs-Coach: ${subtask.title}` : `Conversation Coach: ${subtask.title}`;
    workflowDescription = lang === 'de'
      ? `KI-gestützter Workflow für effektive Gesprächsführung: ${subtask.title}`
      : `AI-powered workflow for effective conversation management: ${subtask.title}`;
    nodes = ['Conversation Setup', 'Guide Generation', 'Meeting Management', 'Outcome Tracking'];
    integrations.push('Google Docs', 'Google Calendar', 'Gmail', 'Slack');
  } else {
    // Generic workflow
    workflowName = lang === 'de' ? `Smart-Workflow: ${subtask.title}` : `Smart Workflow: ${subtask.title}`;
    workflowDescription = lang === 'de'
      ? `Intelligenter Workflow für optimierte Prozesse: ${subtask.title}`
      : `Intelligent workflow for optimized processes: ${subtask.title}`;
    nodes = systems.length > 0 
      ? [...systems.slice(0, 3), 'Processing', 'Notification']
      : ['Webhook', 'Processing', 'Database', 'Notification'];
    integrations.push(...(systems.slice(0, 3) || ['n8n', 'Zapier']));
  }
  
  return {
    id: `fallback-v2-${subtask.id}-${Date.now()}`,
    name: workflowName,
    description: workflowDescription,
    timeSavings: subtask.estimatedTime * subtask.automationPotential,
    complexity: subtask.complexity === 'high' ? 'High' : subtask.complexity === 'low' ? 'Low' : 'Medium',
    integrations,
    category: 'Automation',
    isAIGenerated: true,
    workflowData: {
      nodes: nodes.map((name, idx) => ({
        id: `node_${idx}`,
        name,
        type: 'n8n-nodes-base.function',
        position: [250 + (idx * 200), 300]
      }))
    }
  };
}

interface TopSubtasksSectionProps {
  subtasks: DynamicSubtask[];
  workflows?: WorkflowIndex[]; // Available workflows to match
  lang?: 'de' | 'en';
  topCount?: number;
  sortBy?: 'automationPotential' | 'timeSavings';
  period?: 'year' | 'month' | 'week' | 'day';
  className?: string;
  onSubtaskSelect?: (subtask: DynamicSubtask) => void;
}

export const TopSubtasksSection: React.FC<TopSubtasksSectionProps> = ({
  subtasks,
  workflows = [],
  lang = 'de',
  topCount = 3,
  sortBy = 'automationPotential',
  period = 'month',
  className = '',
  onSubtaskSelect
}) => {
  const [showAll, setShowAll] = useState(false);
  const [subtaskWorkflowMatches, setSubtaskWorkflowMatches] = useState<Map<string, BlueprintData[]>>(new Map());

  // ALWAYS generate AI blueprints for all subtasks (prioritize AI over workflow matching)
  useEffect(() => {
    const matchAndGenerateBlueprints = async () => {
      if (subtasks.length === 0) {
        console.log('⚠️ [TopSubtasksSection] No subtasks available');
        return;
      }

      console.log('🎯 [TopSubtasksSection] Starting blueprint generation for', subtasks.length, 'subtasks');
      console.log('🔍 [TopSubtasksSection] OpenAI available:', isOpenAIAvailable());
      const matches = new Map<string, BlueprintData[]>();
      
      // ALWAYS try to generate AI blueprints with short timeout (don't wait forever)
      console.log(`✨ [TopSubtasksSection] Attempting AI blueprint generation for top 3 subtasks (with 3s timeout)...`);
        
      // Generate for top 3 subtasks only (to avoid rate limits)
      const topSubtasks = subtasks.slice(0, 3);
      
      // Try fast AI generation with immediate fallback
      const aiPromises = topSubtasks.map(async (subtask) => {
        try {
          console.log(`⚡ [TopSubtasksSection] Fast generating workflow for: "${subtask.title}"`);
          const aiBlueprint = await generateWorkflowFast(subtask, lang);
          console.log(`✅ [TopSubtasksSection] Generated workflow: "${aiBlueprint.name}"`);
          return { subtaskId: subtask.id, blueprint: aiBlueprint };
        } catch (error) {
          console.warn(`⚠️ [TopSubtasksSection] Fast generation failed for "${subtask.title}":`, error.message);
          // Fallback
          const fallbackBlueprint = createFallbackBlueprint(subtask, lang);
          console.log(`📦 [TopSubtasksSection] Created fallback blueprint for "${subtask.title}"`);
          return { subtaskId: subtask.id, blueprint: fallbackBlueprint };
        }
      });
      
      // Wait for all AI attempts to complete (or timeout)
      const results = await Promise.allSettled(aiPromises);
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          matches.set(result.value.subtaskId, [result.value.blueprint]);
        }
      });

      // Ensure ALL remaining subtasks get a blueprint (fallback for subtasks 4+)
      console.log('📦 [TopSubtasksSection] Creating fallback blueprints for remaining subtasks...');
      for (const subtask of subtasks) {
        // Skip if already has a blueprint
        if (matches.has(subtask.id)) continue;
        
        // Create fallback blueprint for this subtask
        const fallbackBlueprint = createFallbackBlueprint(subtask, lang);
        matches.set(subtask.id, [fallbackBlueprint]);
        console.log(`📦 [TopSubtasksSection] Created fallback blueprint for remaining subtask: "${subtask.title}"`);
      }
      
      // Optional: Try workflow matching to enhance fallback blueprints
      if (workflows.length > 0) {
        console.log('🔗 [TopSubtasksSection] Optionally trying workflow matching to enhance blueprints');
        
        for (const subtask of subtasks) {
          const workflowMatches = matchWorkflowsToSubtask(subtask, workflows, {
            maxResults: 1,
            minScore: 50 // Higher threshold - only replace if really good match
          });

          if (workflowMatches.length > 0) {
            const blueprints: BlueprintData[] = workflowMatches.map(match => ({
              id: match.workflow.id,
              name: match.workflow.title || (match.workflow as any).name || 'Workflow',
              description: match.workflow.summary || (match.workflow as any).description,
              timeSavings: match.estimatedTimeSavings,
              complexity: match.workflow.complexity,
              integrations: match.workflow.integrations,
              category: match.workflow.category
            }));
            matches.set(subtask.id, blueprints); // Replace fallback with matched workflow
            console.log(`✅ [TopSubtasksSection] Enhanced with workflow match for "${subtask.title}": ${blueprints[0].name}`);
          }
        }
      }

      console.log(`📊 [TopSubtasksSection] Final: ${matches.size}/${subtasks.length} subtasks have blueprints`);
      console.log('🗂️ [TopSubtasksSection] Blueprint map keys:', Array.from(matches.keys()));
      console.log('🗂️ [TopSubtasksSection] Subtask IDs:', subtasks.map(s => s.id));
      setSubtaskWorkflowMatches(matches);
    };

    matchAndGenerateBlueprints();
  }, [workflows, subtasks, lang]);

  // Sort subtasks based on sortBy criteria
  const sortedSubtasks = [...subtasks].sort((a, b) => {
    if (sortBy === 'automationPotential') {
      return b.automationPotential - a.automationPotential;
    } else {
      // Sort by time savings (estimatedTime * automationPotential)
      const savingsA = a.estimatedTime * a.automationPotential;
      const savingsB = b.estimatedTime * b.automationPotential;
      return savingsB - savingsA;
    }
  });

  // Split into top and remaining
  const topSubtasks = sortedSubtasks.slice(0, topCount);
  const remainingSubtasks = sortedSubtasks.slice(topCount);
  const displayedSubtasks = showAll ? sortedSubtasks : topSubtasks;

  // Calculate time savings per period
  const getTimeSavingsPerPeriod = (subtask: DynamicSubtask) => {
    const periodMultipliers = {
      year: 12,
      month: 1,
      week: 0.25,
      day: 1 / 30,
    };
    
    // estimatedTime is typically in hours per month
    const monthlySavings = subtask.estimatedTime * subtask.automationPotential;
    const periodSavings = monthlySavings * periodMultipliers[period];
    
    return periodSavings;
  };

  if (subtasks.length === 0) {
    return (
      <div className={`p-6 text-center text-muted-foreground ${className}`}>
        {lang === 'de' 
          ? 'Keine Teilaufgaben verfügbar' 
          : 'No subtasks available'}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Section Header */}
      <div className="mb-2 px-3 pt-2">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
          {lang === 'de' ? 'Teilaufgaben – Top 3' : 'Subtasks – Top 3'}
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {lang === 'de' 
            ? 'Sortiert nach Automatisierungspotenzial' 
            : 'Sorted by automation potential'}
        </p>
      </div>

      {/* Subtasks List */}
      <div className="space-y-0">
        {displayedSubtasks.map((subtask, index) => {
          const timeSavings = getTimeSavingsPerPeriod(subtask);
          const isTopThree = index < topCount;
          
          const matchedBlueprints = subtaskWorkflowMatches.get(subtask.id) || [];
          
          // Debug log
          if (index === 0) {
            console.log('🔍 [TopSubtasksSection] Rendering subtask:', subtask.title);
            console.log('📋 [TopSubtasksSection] Matched blueprints:', matchedBlueprints.length);
            console.log('📊 [TopSubtasksSection] All matches:', subtaskWorkflowMatches.size, 'total');
            console.log('🗂️ [TopSubtasksSection] Map contents:', Array.from(subtaskWorkflowMatches.keys()));
          }
          
          return (
            <React.Fragment key={subtask.id}>
              <SubtaskCard
                subtask={subtask}
                index={index}
                lang={lang}
                period={period}
                timeSavings={timeSavings}
                onDetailsClick={onSubtaskSelect}
                className="hover:bg-muted/50 transition-colors"
                matchedBlueprintsData={matchedBlueprints}
                matchedBlueprints={
                  matchedBlueprints.length > 0 ? (
                    <div className="space-y-2">
                      {matchedBlueprints.map(blueprint => (
                        <BlueprintCard
                          key={blueprint.id}
                          blueprint={blueprint}
                          lang={lang}
                          period={period}
                          compact={true}
                        />
                      ))}
                    </div>
                  ) : undefined
                }
              />
              
              {/* Separator line - except after last item */}
              {index < displayedSubtasks.length - 1 && (
                <div className="border-t border-border" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Expand/Collapse Button */}
      {remainingSubtasks.length > 0 && (
        <div className="mt-2 pb-2 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 h-7 px-3"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                {lang === 'de' ? 'Weniger anzeigen' : 'Show less'}
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                {lang === 'de' 
                  ? `+${remainingSubtasks.length} weitere anzeigen`
                  : `Show +${remainingSubtasks.length} more`}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TopSubtasksSection;

