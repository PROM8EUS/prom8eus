/**
 * TaskPanel Component - Refactored for expanded task detail view
 * Now focuses on layout coordination and main content display
 * SubtaskSidebar functionality extracted to separate component
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2,
  ChevronRight,
  Users,
  Clock,
  Target,
  TrendingUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { EffortSection } from './EffortSection';
import { TopSubtasksSection } from './TopSubtasksSection';
import { InsightsTrendsSection } from './InsightsTrendsSection';
import { ImplementationRequestCTA } from './ImplementationRequestCTA';
import SubtaskSidebar from './SubtaskSidebar';
import { ExpandedSolutionTabs } from './ExpandedSolutionTabs';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { SmartDefaultsProvider, useSmartDefaults } from './SmartDefaultsManager';
import { ContextualHelpProvider, useContextualHelp } from './ContextualHelpSystem';
import { HelpTrigger, SectionHelp } from './HelpTrigger';
import { analyzeTrends } from '@/lib/trendAnalysis';
import { matchWorkflowsToSubtasks } from '@/lib/workflowMatcher';
import { DynamicSubtask } from '@/lib/types';
import { generateSubtasksWithAI } from '@/lib/aiAnalysis';
import { isOpenAIAvailable } from '@/lib/openai';
import { workflowIndexer } from '@/lib/workflowIndexer';

// Simple string->SHA256 helper for stable cache keys
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SUBTASK_CACHE_NS = 'subtasks_cache_v1';
const SUBTASK_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

type CachedSubtasks = {
  createdAt: string;
  subtasks: Subtask[];
};

type Subtask = {
  id: string;
  title: string;
  systems?: string[];
  aiTools?: string[];
  selectedTools?: string[];
  manualHoursShare: number;
  automationPotential: number;
  risks?: string[];
  assumptions?: string[];
  kpis?: string[];
  qualityGates?: string[];
};

function readSubtaskCache(): Record<string, CachedSubtasks> {
  try {
    const raw = localStorage.getItem(SUBTASK_CACHE_NS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSubtaskCache(cache: Record<string, CachedSubtasks>) {
  try {
    localStorage.setItem(SUBTASK_CACHE_NS, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
}

async function getCachedSubtasksForText(taskText: string): Promise<Subtask[] | null> {
  const key = await sha256(taskText);
  const cache = readSubtaskCache();
  const entry = cache[key];
  if (!entry) return null;
  const age = Date.now() - new Date(entry.createdAt).getTime();
  if (age > SUBTASK_CACHE_TTL_MS) return null;
  console.log(`✅ [SubtasksCache] Hit for ${key}, age ${(age/1000).toFixed(0)}s, items: ${entry.subtasks.length}`);
  return entry.subtasks;
}

async function setCachedSubtasksForText(taskText: string, subtasks: Subtask[]): Promise<void> {
  const key = await sha256(taskText);
  const cache = readSubtaskCache();
  cache[key] = { createdAt: new Date().toISOString(), subtasks };
  writeSubtaskCache(cache);
  console.log(`💾 [SubtasksCache] Saved ${subtasks.length} items for ${key}`);
}

type TaskPanelProps = {
  task: {
    title?: string;
    name?: string;
    description?: string;
    category?: string;
    subtasks?: Array<{
      id: string;
      title: string;
      description: string;
      automationPotential: number;
      estimatedTime: number;
      priority: 'low' | 'medium' | 'high' | 'critical';
      complexity: 'low' | 'medium' | 'high';
      systems: string[];
      risks: string[];
      opportunities: string[];
      dependencies: string[];
    }>;
  };
  lang?: 'de' | 'en';
  onOpenSolutions?: (mode: 'templates' | 'agents', subtaskId: string) => void;
  isVisible?: boolean;
};

function TaskPanelContent({ task, lang = 'de', isVisible = false }: TaskPanelProps) {
  const { getSectionDefaults, setExpanded } = useSmartDefaults();
  const { trackUserAction } = useContextualHelp();
  const [generatedSubtasks, setGeneratedSubtasks] = useState<Subtask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>('all');
  const [solutionsCount, setSolutionsCount] = useState(0);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const hasLoadedSolutions = useRef(false);

  // Generate subtasks when task becomes visible - WITH DEBOUNCING
  useEffect(() => {
    if (isVisible && task) {
      const taskText = task.title || task.name || task.description || '';
      if (taskText && !task.subtasks) {
        console.log('🔄 [TaskPanel] Generating subtasks for:', taskText);
        setIsGenerating(true);
        
        // DEBOUNCE: Only generate if not already generating for this task
        const taskId = taskText;
        if ((window as any).subtaskGenerationInProgress?.has(taskId)) {
          console.log('⏳ [TaskPanel] Subtask generation already in progress for:', taskText);
          return;
        }
        
        // Mark as in progress
        if (!(window as any).subtaskGenerationInProgress) {
          (window as any).subtaskGenerationInProgress = new Set();
        }
        (window as any).subtaskGenerationInProgress.add(taskId);
        
        const generateSubtasks = async () => {
          try {
            // 0) Try cache per analysis first
            const cached = await getCachedSubtasksForText(taskText);
            if (cached && cached.length > 0) {
              console.log('✅ [TaskPanel] Using cached subtasks:', cached.length);
              setGeneratedSubtasks(cached);
              (window as any).subtaskGenerationInProgress.delete(taskId);
              return;
            }
            
            // 1) Try AI-powered generation first if available
            if (isOpenAIAvailable()) {
              console.log('🤖 [TaskPanel] Using AI for subtask generation...');
              const aiResult = await generateSubtasksWithAI(taskText, lang);
              
              if (aiResult.aiEnabled && aiResult.subtasks.length > 0) {
                console.log('✅ [TaskPanel] AI generated subtasks:', aiResult.subtasks.length);
                const mappedSubtasks = aiResult.subtasks.map(subtask => ({
                  id: subtask.id,
                  title: subtask.title,
                  systems: subtask.systems || [],
                  aiTools: subtask.aiTools || [],
                  selectedTools: [],
                  manualHoursShare: (100 - subtask.automationPotential) / 100,
                  automationPotential: subtask.automationPotential / 100,
                  risks: subtask.risks || [],
                  assumptions: [],
                  kpis: [],
                  qualityGates: []
                }));
                setGeneratedSubtasks(mappedSubtasks);
                await setCachedSubtasksForText(taskText, mappedSubtasks);
                (window as any).subtaskGenerationInProgress.delete(taskId);
                return;
              }
            }
            
            // No fallback - AI is required
            console.log('❌ [TaskPanel] AI subtask generation failed - no fallback available');
            setGeneratedSubtasks([]);
            (window as any).subtaskGenerationInProgress.delete(taskId);
          } catch (error) {
            console.error('❌ [TaskPanel] Error generating subtasks:', error);
            (window as any).subtaskGenerationInProgress.delete(taskId);
            setGeneratedSubtasks([]);
          } finally {
            setIsGenerating(false);
          }
        };
        
        generateSubtasks();
      }
    }
  }, [isVisible, task, lang]);
  
  // Use real subtasks from task prop or generated subtasks
  const realSubtasks = useMemo(() => {
    console.log('🔍 [TaskPanel] Debug subtasks check:', {
      hasTask: !!task,
      hasSubtasks: !!(task?.subtasks),
      subtasksLength: task?.subtasks?.length || 0,
      subtasksData: task?.subtasks
    });
    
    if (task?.subtasks && task.subtasks.length > 0) {
      console.log('✅ [TaskPanel] Using real subtasks from task prop:', task.subtasks.length);
      const mapped = task.subtasks.map(subtask => ({
        id: subtask.id || `subtask-${Math.random().toString(36).substr(2, 9)}`,
        title: subtask.title || 'Unbekannte Teilaufgabe',
        systems: subtask.systems || [],
        manualHoursShare: subtask.automationPotential ? (100 - subtask.automationPotential) / 100 : 0.3,
        automationPotential: subtask.automationPotential ? subtask.automationPotential / 100 : 0.7,
        risks: subtask.risks || [],
        assumptions: [],
        kpis: [],
        qualityGates: []
      }));
      // Sort by highest savings (manualHoursShare * automationPotential)
      return mapped.sort((a, b) => (b.manualHoursShare * b.automationPotential) - (a.manualHoursShare * a.automationPotential));
    } else if (generatedSubtasks.length > 0) {
      console.log('✅ [TaskPanel] Using generated subtasks:', generatedSubtasks.length);
      // Sort generated by highest savings
      return [...generatedSubtasks].sort((a, b) => (b.manualHoursShare * b.automationPotential) - (a.manualHoursShare * a.automationPotential));
    } else {
      console.log('⚠️ [TaskPanel] No subtasks available, using fallback');
      return [
        {
          id: 'planning',
          title: 'Aufgabe planen und strukturieren',
          systems: ['Planning Tools', 'Documentation'],
          manualHoursShare: 0.20,
          automationPotential: 0.60
        },
        {
          id: 'execution',
          title: 'Aufgabe ausführen',
          systems: ['Execution Tools', 'Workflow'],
          manualHoursShare: 0.40,
          automationPotential: 0.80
        },
        {
          id: 'coordination',
          title: 'Koordination und Kommunikation',
          systems: ['Communication Tools', 'Collaboration'],
          manualHoursShare: 0.25,
          automationPotential: 0.75
        },
        {
          id: 'evaluation',
          title: 'Ergebnisse evaluieren und dokumentieren',
          systems: ['Analytics', 'Documentation'],
          manualHoursShare: 0.15,
          automationPotential: 0.85
        }
      ];
    }
  }, [task?.subtasks, generatedSubtasks]);

  // Preload workflows when task panel becomes visible
  useEffect(() => {
    if (isVisible && realSubtasks && realSubtasks.length > 0) {
      // Mark as loading; SolutionsTab will perform loading via indexer and update count
      setIsLoadingSolutions(true);
    }
  }, [isVisible, realSubtasks]);

  // New: selected period synced with BusinessCase
  type Period = 'year' | 'month' | 'week' | 'day';
  const [period, setPeriod] = useState<Period>('month');
  const HOURS_PER_PERIOD: Record<Period, number> = {
    year: 2080,
    month: 160,
    week: 40,
    day: 8,
  };

  // Calculate business case based on actual subtask effort reduction
  let manualHoursTotal = 0;
  let residualHoursTotal = 0;
  const basePerTaskHours = 8; // baseline per subtask for a day
  const scale = HOURS_PER_PERIOD[period] / HOURS_PER_PERIOD['day'];
  
  // Calculate total manual hours from subtasks
  realSubtasks.forEach(s => {
    manualHoursTotal += s.manualHoursShare * basePerTaskHours * scale;
  });
  
  // Calculate residual hours after automation
  realSubtasks.forEach(s => {
    residualHoursTotal += s.manualHoursShare * basePerTaskHours * (1 - s.automationPotential) * scale;
  });
  
  // Fallback to default values if no subtasks
  if (realSubtasks.length === 0) {
    manualHoursTotal = basePerTaskHours * scale;
    residualHoursTotal = (basePerTaskHours * 0.5) * scale; // Assume 50% automation potential
  }

  // Memoize task object to prevent unnecessary re-renders
  const businessCaseTask = useMemo(() => ({
    name: task.name || task.title,
    text: task.description,
    automationRatio: realSubtasks.reduce((acc, s) => acc + s.automationPotential, 0) / Math.max(realSubtasks.length, 1) * 100,
    humanRatio: realSubtasks.reduce((acc, s) => acc + (1 - s.automationPotential), 0) / Math.max(realSubtasks.length, 1) * 100,
    subtasks: realSubtasks.map(s => ({
      id: s.id,
      title: s.title,
      estimatedTime: s.manualHoursShare * basePerTaskHours, // base at day; BusinessCase scales by period
      automationPotential: s.automationPotential
    }))
  }), [task.name, task.title, task.description, realSubtasks, basePerTaskHours]);

  // Convert realSubtasks to DynamicSubtask format for new components
  const dynamicSubtasks: DynamicSubtask[] = useMemo(() => {
    return realSubtasks.map(s => ({
      id: s.id,
      title: s.title,
      description: '', // Not available in current format
      automationPotential: s.automationPotential,
      estimatedTime: s.manualHoursShare * basePerTaskHours,
      priority: 'medium' as const,
      complexity: 'medium' as const,
      systems: s.systems || [],
      dependencies: [],
      risks: s.risks || [],
      opportunities: [],
      aiTools: s.aiTools
    }));
  }, [realSubtasks, basePerTaskHours]);

  // Load workflows for matching
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [trendInsights, setTrendInsights] = useState<any[]>([]);

  useEffect(() => {
    if (isVisible && dynamicSubtasks.length > 0) {
      // Load workflows from indexer
      const loadWorkflows = async () => {
        try {
          const taskQuery = task.title || task.name || '';
          console.log('🔍 [TaskPanel] Loading workflows for query:', taskQuery);
          
          const results = await workflowIndexer.searchWorkflows({
            q: taskQuery,
            limit: 50 // Increase limit for better matching
          });
          
          console.log('✅ [TaskPanel] Loaded workflows:', results.workflows.length);
          setWorkflows(results.workflows); // FIX: Use results.workflows instead of results

          // Analyze trends
          const trends = analyzeTrends(results.workflows, dynamicSubtasks, {
            includeCategory: task.category
          });
          console.log('📊 [TaskPanel] Trend insights:', trends.length);
          setTrendInsights(trends);
        } catch (error) {
          console.error('❌ [TaskPanel] Error loading workflows:', error);
        }
      };
      loadWorkflows();
    }
  }, [isVisible, dynamicSubtasks, task.title, task.name, task.category]);

  // Handle subtask selection
  const handleSubtaskSelect = (subtaskId: string) => {
    setSelectedSubtaskId(subtaskId);
    console.log('🔍 [TaskPanel] Selected subtask:', subtaskId);
  };


  // Get selected subtask for display
  const selectedSubtask = useMemo(() => {
    if (selectedSubtaskId === 'all') {
      return null; // Show all solutions
    }
    return dynamicSubtasks.find(s => s.id === selectedSubtaskId) || null;
  }, [selectedSubtaskId, dynamicSubtasks]);

  if (!isVisible) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Simplified Layout without Grid */}
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        
        {/* Effort/ROI Section - Direct Display without Container */}
        <EffortSection
          manualHours={manualHoursTotal}
          automatedHours={residualHoursTotal}
          hourlyRate={60}
          period={period}
          lang={lang}
          onHourlyRateChange={(newRate) => {
            console.log('Hourly rate changed:', newRate);
          }}
        />

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Subtask Navigation */}
          <div className="lg:w-1/3">
            <div className="sticky top-6">
              <SubtaskSidebar
                task={task}
                lang={lang}
                isVisible={isVisible}
                onSubtaskSelect={handleSubtaskSelect}
                selectedSubtaskId={selectedSubtaskId}
              />
            </div>
          </div>

          {/* Main Content Area - Solution Tabs */}
          <div className="lg:w-2/3 space-y-6">
            {/* Direct Solution Tabs Display - No Container */}
            <ExpandedSolutionTabs
              subtask={selectedSubtask}
              lang={lang}
              onWorkflowSelect={(workflow) => {
                const name = 'title' in workflow.workflow ? workflow.workflow.title : 
                             'name' in workflow.workflow ? workflow.workflow.name : 'Unknown';
                console.log('🔍 [TaskPanel] Workflow selected:', name);
              }}
              onWorkflowDownload={(workflow) => {
                const name = 'title' in workflow.workflow ? workflow.workflow.title : 
                             'name' in workflow.workflow ? workflow.workflow.name : 'Unknown';
                console.log('📥 [TaskPanel] Download requested:', name);
              }}
              onWorkflowSetup={(workflow) => {
                const name = 'title' in workflow.workflow ? workflow.workflow.title : 
                             'name' in workflow.workflow ? workflow.workflow.name : 'Unknown';
                console.log('⚙️ [TaskPanel] Setup requested:', name);
              }}
              onAgentSelect={(agent) => {
                console.log('🔍 [TaskPanel] Agent selected:', agent.name);
              }}
              onAgentSetup={(agent) => {
                console.log('⚙️ [TaskPanel] Agent setup requested:', agent.name);
              }}
              onPromptSelect={(prompt) => {
                console.log('🔍 [TaskPanel] Prompt selected:', prompt.id);
              }}
              onPromptCopy={(prompt) => {
                console.log('📋 [TaskPanel] Prompt copied:', prompt.id);
              }}
              onPromptOpenInService={(prompt, service) => {
                console.log('🔗 [TaskPanel] Open in service:', service, prompt.id);
              }}
              className="bg-transparent border-0 shadow-none"
            />

            {/* Top Subtasks Section with Progressive Disclosure */}
            <CollapsibleSection
              title={lang === 'de' ? 'Top Teilaufgaben' : 'Top Subtasks'}
              description={lang === 'de' 
                ? 'Die wichtigsten Teilaufgaben mit höchstem Automatisierungspotential'
                : 'Most important subtasks with highest automation potential'
              }
              priority="medium"
              badge={{
                text: lang === 'de' ? 'Top 3' : 'Top 3',
                count: Math.min(3, dynamicSubtasks.length)
              }}
              icon={TrendingUp}
              {...getSectionDefaults('top-subtasks', 'medium')}
              onToggle={(expanded) => setExpanded('top-subtasks', expanded)}
              className="bg-white/80 backdrop-blur-sm border-white/20"
            >
              {isGenerating ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm">
                    {lang === 'de' ? 'Generiere spezifische Teilaufgaben...' : 'Generating specific subtasks...'}
                  </p>
                </div>
              ) : (
                <TopSubtasksSection
                  subtasks={dynamicSubtasks}
                  workflows={workflows}
                  lang={lang}
                  topCount={3}
                  sortBy="automationPotential"
                  period={period}
                />
              )}
            </CollapsibleSection>

            {/* Insights & Trends Section with Progressive Disclosure */}
            {trendInsights.length > 0 && (
              <CollapsibleSection
                title={lang === 'de' ? 'Erkenntnisse & Trends' : 'Insights & Trends'}
                description={lang === 'de' 
                  ? 'Automatisierungs-Trends und Marktanalysen'
                  : 'Automation trends and market analysis'
                }
                priority="low"
                badge={{
                  text: lang === 'de' ? 'Erkenntnisse' : 'Insights',
                  count: trendInsights.length
                }}
                icon={Target}
                {...getSectionDefaults('insights', 'low')}
                onToggle={(expanded) => setExpanded('insights', expanded)}
                className="bg-white/80 backdrop-blur-sm border-white/20"
              >
                <InsightsTrendsSection
                  insights={trendInsights}
                  lang={lang}
                />
              </CollapsibleSection>
            )}
          </div>
        </div>

        {/* Bottom Section - Full Width CTA */}
        <div>
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <div className="flex justify-center">
              <ImplementationRequestCTA
                taskTitle={task.title || task.name}
                taskDescription={task.description}
                subtasks={dynamicSubtasks}
                automationScore={Math.round(businessCaseTask.automationRatio)}
                estimatedSavings={{
                  hours: manualHoursTotal - residualHoursTotal,
                  cost: (manualHoursTotal - residualHoursTotal) * 60,
                  period: period === 'year' ? (lang === 'de' ? 'Jahr' : 'year') :
                         period === 'month' ? (lang === 'de' ? 'Monat' : 'month') :
                         period === 'week' ? (lang === 'de' ? 'Woche' : 'week') :
                         (lang === 'de' ? 'Tag' : 'day')
                }}
                lang={lang}
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main TaskPanel component with SmartDefaultsProvider and ContextualHelpProvider
export default function TaskPanel(props: TaskPanelProps) {
  return (
    <SmartDefaultsProvider>
      <ContextualHelpProvider>
        <TaskPanelContent {...props} />
      </ContextualHelpProvider>
    </SmartDefaultsProvider>
  );
}