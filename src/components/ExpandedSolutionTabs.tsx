/**
 * ExpandedSolutionTabs Component
 * Enhanced UX component for managing Workflows, Agents, and LLMs tabs
 * with animated transitions, smart defaults, and modern design patterns
 */

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Workflow, 
  Bot, 
  MessageSquare, 
  Loader2
} from 'lucide-react';
import { DynamicSubtask } from '@/lib/types';

// Lazy load tab components for better performance
const WorkflowTab = lazy(() => import('./tabs/WorkflowTab'));
const AgentTab = lazy(() => import('./tabs/AgentTab'));
const LLMTab = lazy(() => import('./tabs/LLMTab'));

interface ExpandedSolutionTabsProps {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
  generatedWorkflows?: any[]; // NEW: Generated workflows from TaskPanel
  isGeneratingInitial?: boolean; // NEW: Initial generation state
  onLoadMore?: () => void; // NEW: Load more workflows
  isLoadingMore?: boolean; // NEW: Loading state for more workflows
  onWorkflowSelect?: (workflow: unknown) => void;
  onWorkflowDownload?: (workflow: unknown) => void;
  onWorkflowSetup?: (workflow: unknown) => void;
  onAgentSelect?: (agent: unknown) => void;
  onAgentSetup?: (agent: unknown) => void;
  onPromptSelect?: (prompt: unknown) => void;
  onPromptCopy?: (prompt: unknown) => void;
  onPromptOpenInService?: (prompt: unknown, service: string) => void;
  className?: string;
}

type TabType = 'workflows' | 'agents' | 'llms';

interface TabInfo {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    count: number;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  description: string;
  priority: number; // Higher number = higher priority
}

export function ExpandedSolutionTabs({
  subtask,
  generatedWorkflows = [],
  isGeneratingInitial = false,
  onLoadMore,
  isLoadingMore = false,
  lang = 'de',
  onWorkflowSelect,
  onWorkflowDownload,
  onWorkflowSetup,
  onAgentSelect,
  onAgentSetup,
  onPromptSelect,
  onPromptCopy,
  onPromptOpenInService,
  className = ''
}: ExpandedSolutionTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('workflows');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<TabType, number>>({
    workflows: 0,
    agents: 0,
    llms: 0
  });
  const [isPreloading, setIsPreloading] = useState(true);
  const [tabPositions, setTabPositions] = useState<Record<TabType, { left: number; width: number }>>({
    workflows: { left: 0, width: 0 },
    agents: { left: 0, width: 0 },
    llms: { left: 0, width: 0 }
  });

  // Estimate tab counts based on subtask properties (no API calls)
  useEffect(() => {
    if (!subtask) {
      setIsPreloading(false);
      return;
    }

    // Simple estimation without imports to avoid async issues
    const estimateCounts = () => {
      // Estimate workflow count (always some workflows available)
      const workflowEstimate = Math.max(1, Math.floor(Math.random() * 3) + 1);
      
      // Estimate agent count based on subtask characteristics
      let agentEstimate = 0;
      const automationPotential = subtask.automationPotential || 0.5;
      const complexity = subtask.complexity || 'medium';
      
      if (automationPotential > 0.6) {
        agentEstimate = complexity === 'high' ? 4 : 2;
      } else if (automationPotential > 0.4) {
        agentEstimate = complexity === 'high' ? 3 : 1;
      }
      
      // Estimate LLM count based on subtask characteristics
      let llmEstimate = 0;
      if (automationPotential > 0.2) {
        // Lower threshold for LLMs - they're useful for most tasks
        llmEstimate = complexity === 'high' ? 3 : 2;
      } else if (automationPotential > 0.1) {
        // Even very low automation potential can benefit from LLMs
        llmEstimate = 1;
      }
      
      // Adjust based on systems complexity
      const systemsCount = subtask.systems?.length || 0;
      if (systemsCount > 3) {
        agentEstimate = Math.min(agentEstimate + 1, 5);
        llmEstimate = Math.min(llmEstimate + 1, 4);
      }

      setTabCounts({
        workflows: workflowEstimate,
        agents: agentEstimate,
        llms: llmEstimate
      });
      setIsPreloading(false);
    };

    // Small delay to show loading state briefly
    setTimeout(estimateCounts, 100);
  }, [subtask]);

  // Tab configuration with enhanced UX
  const tabs: TabInfo[] = useMemo(() => [
    {
      id: 'workflows',
      label: lang === 'de' ? 'Workflows' : 'Workflows',
      icon: Workflow,
      badge: {
        count: tabCounts.workflows,
        variant: tabCounts.workflows > 0 ? 'default' : 'outline'
      },
      description: lang === 'de' 
        ? 'Automatisierte Workflows und Prozesse'
        : 'Automated workflows and processes',
      priority: 3
    },
    {
      id: 'agents',
      label: lang === 'de' ? 'Agents' : 'Agents',
      icon: Bot,
      badge: {
        count: tabCounts.agents,
        variant: tabCounts.agents > 0 ? 'default' : 'outline'
      },
      description: lang === 'de'
        ? 'KI-Agenten für intelligente Automatisierung'
        : 'AI agents for intelligent automation',
      priority: 2
    },
    {
      id: 'llms',
      label: lang === 'de' ? 'LLMs' : 'LLMs',
      icon: MessageSquare,
      badge: {
        count: tabCounts.llms,
        variant: tabCounts.llms > 0 ? 'default' : 'outline'
      },
      description: lang === 'de'
        ? 'Optimierte Prompts für Sprachmodelle'
        : 'Optimized prompts for language models',
      priority: 1
    }
  ], [lang, tabCounts]);

  // Sort tabs by priority (highest first)
  const sortedTabs = useMemo(() => 
    [...tabs].sort((a, b) => b.priority - a.priority),
    [tabs]
  );

  // Measure tab positions for animation
  useEffect(() => {
    const measureTabPositions = () => {
      const positions: Record<TabType, { left: number; width: number }> = {} as any;
      
      sortedTabs.forEach((tab) => {
        const element = document.querySelector(`[data-tab-id="${tab.id}"]`) as HTMLElement;
        if (element) {
          const rect = element.getBoundingClientRect();
          const container = element.closest('.bg-gray-50') as HTMLElement;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            positions[tab.id] = {
              left: rect.left - containerRect.left,
              width: rect.width
            };
          }
        }
      });
      
      setTabPositions(positions);
    };

    // Measure after a short delay to ensure DOM is ready
    const timer = setTimeout(measureTabPositions, 100);
    
    // Re-measure on window resize
    window.addEventListener('resize', measureTabPositions);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureTabPositions);
    };
  }, [sortedTabs, activeTab]);

  // Smart default tab selection based on subtask characteristics
  const smartDefaultTab = useMemo((): TabType => {
    if (!subtask) return 'workflows';

    const { automationPotential, complexity, systems } = subtask;

    // High automation potential + simple complexity = prefer workflows
    if (automationPotential >= 0.8 && complexity === 'low') {
      return 'workflows';
    }

    // Medium automation + complex systems = prefer agents
    if (automationPotential >= 0.6 && complexity === 'high' && systems.length > 3) {
      return 'agents';
    }

    // Low automation or creative tasks = prefer LLMs
    if (automationPotential < 0.6 || systems.includes('Creative Tools')) {
      return 'llms';
    }

    // Default to workflows for most cases
    return 'workflows';
  }, [subtask]);

  // Set smart default on subtask change - DISABLED to preserve user's tab selection
  // useEffect(() => {
  //   if (subtask) {
  //     const newDefaultTab = smartDefaultTab;
  //     if (newDefaultTab !== activeTab) {
  //       setIsTransitioning(true);
  //       setTimeout(() => {
  //         setActiveTab(newDefaultTab);
  //         setIsTransitioning(false);
  //       }, 150);
  //     }
  //   }
  // }, [subtask, smartDefaultTab, activeTab]);

  // Handle tab change with smooth transition
  const handleTabChange = (newTab: string) => {
    const tabType = newTab as TabType;
    if (tabType === activeTab || isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabType);
      setIsTransitioning(false);
    }, 150);
  };

  // Get tab status based on content availability
  const getTabStatus = (tabId: TabType) => {
    const count = tabCounts[tabId];
    if (count === 0) return 'empty';
    if (count > 5) return 'rich';
    return 'available';
  };

  // Render tab trigger with enhanced styling
  const renderTabTrigger = (tab: TabInfo) => {
    const status = getTabStatus(tab.id);
    const isActive = activeTab === tab.id;
    const Icon = tab.icon;

    return (
      <TabsTrigger
        key={tab.id}
        value={tab.id}
        data-tab-id={tab.id}
        className={`
          relative flex items-center gap-2 px-4 py-3 transition-all duration-200 rounded-lg border-0 overflow-hidden
          ${isActive 
            ? 'text-violet-600' 
            : 'text-gray-600 hover:text-gray-900'
          }
          ${isTransitioning ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={() => handleTabChange(tab.id)}
      >
        <Icon className={`h-4 w-4 ${isActive ? 'text-violet-600' : 'text-gray-500'}`} />
        <span className="font-medium">{tab.label}</span>
        
        {/* Enhanced badge with status indicator */}
        <Badge 
          variant={tab.badge?.variant || 'outline'}
          className={`
            ml-1 pointer-events-none hover:bg-inherit flex-shrink-0 min-w-[20px] text-xs
            ${status === 'rich' ? 'bg-green-100 text-green-700 border-green-200' : ''}
            ${status === 'available' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
            ${status === 'empty' ? 'bg-gray-100 text-gray-500 border-gray-200' : ''}
            ${isPreloading ? 'animate-pulse' : ''}
          `}
        >
          {isPreloading ? '...' : (tab.badge?.count || 0)}
        </Badge>
      </TabsTrigger>
    );
  };

  // Memoize the onUpdateCount function to prevent infinite loops
  const createUpdateCountHandler = useCallback((tabId: TabType) => {
    return (count: number) => {
      setTabCounts(prev => ({ ...prev, [tabId]: count }));
    };
  }, []);

  // Render tab content with loading states
  const renderTabContent = (tabId: TabType) => {
    if (isTransitioning) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            {lang === 'de' ? 'Lade Inhalte...' : 'Loading content...'}
          </span>
        </div>
      );
    }

    const commonProps = {
      subtask,
      lang,
      onUpdateCount: createUpdateCountHandler(tabId)
    };

    // console.log('🔍 [ExpandedSolutionTabs] Passing subtask to WorkflowTab:', subtask);

    // Loading fallback component
    const LoadingFallback = () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          {lang === 'de' ? 'Lade Komponente...' : 'Loading component...'}
        </span>
      </div>
    );

    switch (tabId) {
      case 'workflows':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WorkflowTab
              {...commonProps}
              generatedWorkflows={generatedWorkflows}
              isGeneratingInitial={isGeneratingInitial}
              onLoadMore={onLoadMore}
              isLoadingMore={isLoadingMore}
              onWorkflowSelect={onWorkflowSelect}
              onDownloadRequest={onWorkflowDownload}
              onSetupRequest={onWorkflowSetup}
            />
          </Suspense>
        );
      case 'agents':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AgentTab
              {...commonProps}
              onAgentSelect={onAgentSelect}
              onSetupRequest={onAgentSetup}
            />
          </Suspense>
        );
      case 'llms':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <LLMTab
              {...commonProps}
              onPromptSelect={onPromptSelect}
              onCopyPrompt={onPromptCopy}
              onOpenInService={onPromptOpenInService}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  // Always show tabs, even when no subtask is selected

  return (
    <Card className={`shadow-sm relative z-10 ${className}`}>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Enhanced TabsList with modern styling */}
          <div className="bg-gray-50 p-2 rounded-lg relative z-10">
            {/* Animated background */}
            {tabPositions[activeTab] && (
              <div
                className="absolute top-2 bottom-2 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
                style={{
                  left: `${tabPositions[activeTab].left}px`,
                  width: `${tabPositions[activeTab].width}px`,
                }}
              />
            )}
            <TabsList className="grid w-full grid-cols-3 h-auto bg-transparent p-0 border-0 relative z-10">
              {sortedTabs.map(renderTabTrigger)}
            </TabsList>
          </div>

          {/* Tab content with smooth transitions */}
          <div className="relative pt-6">
            <div className={`
              transition-all duration-200 ease-in-out
              ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
            `}>
              <TabsContent value="workflows" className="mt-0">
                {renderTabContent('workflows')}
              </TabsContent>
              <TabsContent value="agents" className="mt-0">
                {renderTabContent('agents')}
              </TabsContent>
              <TabsContent value="llms" className="mt-0">
                {renderTabContent('llms')}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ExpandedSolutionTabs;
