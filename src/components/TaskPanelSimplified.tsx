/**
 * TaskPanel Component - Simplified version without AI generation logic
 * Now focuses on displaying server-provided data and coordinating UI layout
 */

import React, { useState, useEffect, useMemo } from 'react';
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
import { InsightsTrendsSection } from './InsightsTrendsSection';
import { ImplementationRequestCTA } from './ImplementationRequestCTA';
import SubtaskSidebarSimplified from './SubtaskSidebarSimplified';
import ExpandedSolutionTabsSimplified from './ExpandedSolutionTabsSimplified';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { SmartDefaultsProvider, useSmartDefaults } from './SmartDefaultsManager';
import { ContextualHelpProvider, useContextualHelp } from './ContextualHelpSystem';
import { HelpTrigger, SectionHelp } from './HelpTrigger';
import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';
import { taskDataService } from '@/lib/services/taskDataService';
import { analysisCacheService } from '@/lib/services/analysisCacheService';
import { 
  monitorSolutionLoad, 
  completeSolutionLoad,
  monitorUserInteraction 
} from '@/lib/monitoring/marketplaceMonitor';

interface TaskPanelProps {
  task: any;
  lang: 'de' | 'en';
  isVisible: boolean;
}

interface TaskPanelContentProps extends TaskPanelProps {}

function TaskPanelContent({ task, lang, isVisible }: TaskPanelContentProps) {
  // State management - simplified without AI generation
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // Server-provided data (no AI generation)
  const [serverWorkflows, setServerWorkflows] = useState<UnifiedWorkflow[]>([]);
  const [serverInsights, setServerInsights] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Cache statistics
  const [cacheStats, setCacheStats] = useState<any>(null);

  // Smart defaults and contextual help
  const { getSectionDefaults } = useSmartDefaults();
  const { getHelpContent } = useContextualHelp();

  // Server-provided subtasks
  const [serverSubtasks, setServerSubtasks] = useState<DynamicSubtask[]>([]);

  // Use server-provided subtasks or fallback to task.subtasks
  const realSubtasks = useMemo(() => {
    console.log('🔍 [TaskPanel] Using subtasks:', {
      hasServerSubtasks: serverSubtasks.length > 0,
      hasTaskSubtasks: !!(task?.subtasks),
      serverSubtasksLength: serverSubtasks.length,
      taskSubtasksLength: task?.subtasks?.length || 0,
    });

    // Prefer server-provided subtasks
    if (serverSubtasks.length > 0) {
      return serverSubtasks;
    }

    // Fallback to task.subtasks
    if (task?.subtasks && task.subtasks.length > 0) {
      return task.subtasks.map((subtask: any, index: number) => ({
        id: subtask.id || `subtask-${index}`,
        title: subtask.title || subtask.text || `Subtask ${index + 1}`,
        description: subtask.description || '',
        systems: subtask.systems || [],
        aiTools: subtask.aiTools || [],
        selectedTools: subtask.selectedTools || [],
        manualHoursShare: subtask.manualHoursShare || 0.5,
        automationPotential: subtask.automationPotential || 0.5,
        risks: subtask.risks || [],
        assumptions: subtask.assumptions || [],
        kpis: subtask.kpis || [],
        qualityGates: subtask.qualityGates || []
      }));
    }

    return [];
  }, [serverSubtasks, task?.subtasks]);

  // Load server data when component becomes visible
  useEffect(() => {
    if (isVisible && task) {
      loadServerData();
      updateCacheStats();
    }
  }, [isVisible, task]);

  // Update cache statistics
  const updateCacheStats = () => {
    const stats = analysisCacheService.getStats();
    setCacheStats(stats);
  };

  // Clear cache function
  const clearCache = async (type?: string) => {
    await analysisCacheService.clear(type);
    updateCacheStats();
    console.log(`🗑️ [TaskPanel] Cache cleared${type ? ` for type: ${type}` : ''}`);
  };

  // Load data from server/edge layer
  const loadServerData = async () => {
    setIsLoadingData(true);
    try {
      console.log('🔄 [TaskPanel] Loading server data for task:', task.title);
      
      // Monitor solution loading
      monitorSolutionLoad('workflow', task.id || 'unknown');
      
      // Use TaskDataService to fetch data from server
      const taskData = await taskDataService.fetchTaskData(task.id || 'default');
      setServerWorkflows(taskData.workflows);
      setServerInsights(taskData.insights);
      setServerSubtasks(taskData.subtasks);
      
      console.log('✅ [TaskPanel] Server data loaded:', {
        workflows: taskData.workflows.length,
        insights: taskData.insights.length
      });
      
      // Complete solution loading monitoring
      completeSolutionLoad('workflow', task.id || 'unknown', true, undefined, {
        workflowsCount: taskData.workflows.length,
        insightsCount: taskData.insights.length
      });
      
    } catch (error) {
      console.error('❌ [TaskPanel] Failed to load server data:', error);
      
      // Record error in monitoring
      completeSolutionLoad('workflow', task.id || 'unknown', false, error instanceof Error ? error : new Error('Unknown error'));
      
      // Fallback to empty arrays
      setServerWorkflows([]);
      setServerInsights([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handle subtask selection
  const handleSubtaskSelect = (subtaskId: string) => {
    console.log('🔍 [TaskPanel] Subtask selected:', subtaskId);
    setSelectedSubtaskId(subtaskId);
    
    // Load workflows for selected subtask from server
    if (subtaskId !== 'all') {
      loadWorkflowsForSubtask(subtaskId);
    } else {
      loadAllWorkflows();
    }
  };

  // Load workflows for specific subtask from server
  const loadWorkflowsForSubtask = async (subtaskId: string) => {
    try {
      console.log('🔄 [TaskPanel] Loading workflows for subtask:', subtaskId);
      
      const workflows = await taskDataService.fetchWorkflowsForSubtask({
        taskId: task.id || 'default',
        subtaskId,
        limit: 10
      });
      setServerWorkflows(workflows);
      
      console.log('✅ [TaskPanel] Workflows loaded for subtask:', workflows.length);
    } catch (error) {
      console.error('❌ [TaskPanel] Failed to load workflows:', error);
    }
  };

  // Load all workflows from server
  const loadAllWorkflows = async () => {
    try {
      console.log('🔄 [TaskPanel] Loading all workflows');
      
      const workflows = await taskDataService.fetchAllWorkflows(task.id || 'default');
      setServerWorkflows(workflows);
      
      console.log('✅ [TaskPanel] All workflows loaded:', workflows.length);
    } catch (error) {
      console.error('❌ [TaskPanel] Failed to load all workflows:', error);
    }
  };

  // Load more workflows (pagination)
  const loadMoreWorkflows = async () => {
    try {
      console.log('🔄 [TaskPanel] Loading more workflows');
      
      const moreWorkflows = await taskDataService.fetchAllWorkflows(
        task.id || 'default',
        10,
        serverWorkflows.length
      );
      setServerWorkflows(prev => [...prev, ...moreWorkflows]);
      
      console.log('✅ [TaskPanel] More workflows loaded:', moreWorkflows.length);
    } catch (error) {
      console.error('❌ [TaskPanel] Failed to load more workflows:', error);
    }
  };

  // Get selected subtask
  const selectedSubtask = useMemo(() => {
    if (selectedSubtaskId === 'all') {
      return {
        id: 'all',
        title: lang === 'de' ? 'Alle Aufgaben' : 'All Tasks',
        description: lang === 'de' ? 'Übergreifende Lösungen' : 'Cross-cutting solutions'
      };
    }
    return realSubtasks.find(s => s.id === selectedSubtaskId);
  }, [selectedSubtaskId, realSubtasks, lang]);

  // Business case calculations (simplified)
  const businessCaseTask = useMemo(() => {
    if (!task) return { automationRatio: 0, manualHours: 0, automatedHours: 0 };
    
    return {
      automationRatio: task.automationRatio || 0,
      manualHours: task.manualHours || 0,
      automatedHours: task.automatedHours || 0
    };
  }, [task]);

  // Effort calculations
  const manualHoursTotal = useMemo(() => {
    return realSubtasks.reduce((total, subtask) => {
      const hours = subtask.manualHoursShare * 40; // Assume 40 hours per subtask
      return total + hours;
    }, 0);
  }, [realSubtasks]);

  const residualHoursTotal = useMemo(() => {
    return realSubtasks.reduce((total, subtask) => {
      const hours = subtask.manualHoursShare * 40 * (1 - subtask.automationPotential);
      return total + hours;
    }, 0);
  }, [realSubtasks]);

  if (!task) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {lang === 'de' ? 'Lade Aufgabe...' : 'Loading task...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {task.title || task.name}
              </h2>
              <p className="text-gray-600 mb-4">
                {task.description}
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {Math.round(businessCaseTask.automationRatio)}% {lang === 'de' ? 'Automatisierbar' : 'Automatable'}
                </Badge>
                <Badge variant="outline">
                  {realSubtasks.length} {lang === 'de' ? 'Unteraufgaben' : 'Subtasks'}
                </Badge>
                {cacheStats && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Cache: {cacheStats.totalEntries} entries ({Math.round(cacheStats.hitRate * 100)}% hit rate)
                  </Badge>
                )}
              </div>
            </div>
            <HelpTrigger section="task-overview" />
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Subtask Navigation */}
          <div className="lg:w-1/3 w-full">
            <SubtaskSidebarSimplified
              task={task}
              lang={lang}
              isVisible={isVisible}
              onSubtaskSelect={handleSubtaskSelect}
              selectedSubtaskId={selectedSubtaskId}
              subtasks={realSubtasks}
              isLoadingSubtasks={isLoadingData}
            />
          </div>

          {/* Main Content Area - Solution Tabs */}
          <div className="lg:w-2/3 w-full space-y-6">
            {/* Solution Tabs Display */}
            <ExpandedSolutionTabsSimplified
              subtask={selectedSubtask}
              lang={lang}
              workflows={serverWorkflows}
              insights={serverInsights}
              isGeneratingInitial={isLoadingData}
              onLoadMore={loadMoreWorkflows}
              isLoadingMore={false}
              onWorkflowSelect={(workflow: UnifiedWorkflow) => {
                console.log('🔍 [TaskPanel] Workflow selected:', workflow.title);
              }}
              onWorkflowDownload={(workflow: UnifiedWorkflow) => {
                console.log('📥 [TaskPanel] Download requested:', workflow.title);
              }}
              onWorkflowSetup={(workflow: UnifiedWorkflow) => {
                console.log('⚙️ [TaskPanel] Setup requested:', workflow.title);
              }}
              onAgentSelect={(agent: any) => {
                console.log('🔍 [TaskPanel] Agent selected:', agent?.name);
              }}
              onAgentSetup={(agent: any) => {
                console.log('⚙️ [TaskPanel] Agent setup requested:', agent?.name);
              }}
              onPromptSelect={(prompt: any) => {
                console.log('🔍 [TaskPanel] Prompt selected:', prompt?.id);
              }}
              onPromptCopy={(prompt: any) => {
                console.log('📋 [TaskPanel] Prompt copied:', prompt?.id);
              }}
              onPromptOpenInService={(prompt: any, service: string) => {
                console.log('🔗 [TaskPanel] Open in service:', service, prompt?.id);
              }}
              className="bg-transparent border-0 shadow-none"
            />

            {/* Insights & Trends Section */}
            {serverInsights.length > 0 && (
              <CollapsibleSection
                title={lang === 'de' ? 'Erkenntnisse & Trends' : 'Insights & Trends'}
                description={lang === 'de' 
                  ? 'Automatisierungs-Trends und Marktanalysen'
                  : 'Automation trends and market analysis'
                }
                priority="low"
                badge={{
                  text: lang === 'de' ? 'Erkenntnisse' : 'Insights',
                  count: serverInsights.length
                }}
                icon={Target}
                {...getSectionDefaults('insights', 'low')}
                onToggle={(expanded) => setExpanded(prev => ({ ...prev, insights: expanded }))}
                className=""
              >
                <InsightsTrendsSection
                  insights={serverInsights}
                  lang={lang}
                />
              </CollapsibleSection>
            )}
          </div>
        </div>

        {/* Bottom Section - Implementation CTA */}
        <div>
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <div className="w-full">
              <ImplementationRequestCTA
                taskTitle={task.title || task.name}
                taskDescription={task.description}
                subtasks={realSubtasks}
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

// Main TaskPanel component with providers
export default function TaskPanelSimplified(props: TaskPanelProps) {
  return (
    <SmartDefaultsProvider>
      <ContextualHelpProvider>
        <TaskPanelContent {...props} />
      </ContextualHelpProvider>
    </SmartDefaultsProvider>
  );
}
