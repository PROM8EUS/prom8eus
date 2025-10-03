/**
 * ExpandedSolutionTabs Component
 * Enhanced UX component for managing Workflows, Agents, and LLMs tabs
 * with animated transitions, smart defaults, and modern design patterns
 */

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Workflow, 
  Bot, 
  MessageSquare, 
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { DynamicSubtask } from '@/lib/types';

// Lazy load tab components for better performance
const WorkflowTab = lazy(() => import('./tabs/WorkflowTab'));
const AgentTab = lazy(() => import('./tabs/AgentTab'));
const LLMTab = lazy(() => import('./tabs/LLMTab'));

interface ExpandedSolutionTabsProps {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
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

  // Set smart default on subtask change
  useEffect(() => {
    if (subtask) {
      const newDefaultTab = smartDefaultTab;
      if (newDefaultTab !== activeTab) {
        setIsTransitioning(true);
        setTimeout(() => {
          setActiveTab(newDefaultTab);
          setIsTransitioning(false);
        }, 150);
      }
    }
  }, [subtask, smartDefaultTab, activeTab]);

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

  // Handle tab change with smooth transition
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab || isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
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
        className={`
          relative flex items-center gap-2 px-4 py-3 transition-all duration-200
          ${isActive 
            ? 'bg-primary text-primary-foreground shadow-sm' 
            : 'hover:bg-muted/50'
          }
          ${isTransitioning ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={() => handleTabChange(tab.id)}
      >
        <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
        <span className="font-medium">{tab.label}</span>
        
        {/* Enhanced badge with status indicator */}
        <Badge 
          variant={tab.badge?.variant || 'outline'}
          className={`
            ml-1 transition-all duration-200
            ${status === 'rich' ? 'bg-green-100 text-green-700 border-green-200' : ''}
            ${status === 'available' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
            ${status === 'empty' ? 'bg-gray-100 text-gray-500 border-gray-200' : ''}
          `}
        >
          {tab.badge?.count || 0}
        </Badge>

        {/* Status indicator */}
        {status === 'rich' && (
          <Sparkles className="h-3 w-3 text-green-600 ml-1" />
        )}
        {status === 'available' && (
          <CheckCircle className="h-3 w-3 text-blue-600 ml-1" />
        )}
        {status === 'empty' && (
          <AlertCircle className="h-3 w-3 text-gray-400 ml-1" />
        )}
      </TabsTrigger>
    );
  };

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
      onUpdateCount: (count: number) => {
        setTabCounts(prev => ({ ...prev, [tabId]: count }));
      }
    };

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

  // Empty state when no subtask is selected
  if (!subtask) {
    return (
      <Card className={`shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-8">
          <div className="text-center">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              {lang === 'de' ? 'Wähle eine Teilaufgabe' : 'Select a Subtask'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {lang === 'de' 
                ? 'Wähle eine Teilaufgabe aus der Seitenleiste, um Lösungen anzuzeigen'
                : 'Select a subtask from the sidebar to view solutions'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-0">
        <Tabs value={activeTab} className="w-full">
          {/* Enhanced TabsList with modern styling */}
          <div className="border-b bg-muted/20">
            <TabsList className="grid w-full grid-cols-3 h-auto bg-transparent p-0">
              {sortedTabs.map(renderTabTrigger)}
            </TabsList>
            
            {/* Tab descriptions */}
            <div className="px-6 py-3 bg-muted/10 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>
                  {tabs.find(t => t.id === activeTab)?.description}
                </span>
                {subtask && (
                  <>
                    <span className="mx-2">•</span>
                    <Clock className="h-4 w-4" />
                    <span>
                      {Math.round(subtask.automationPotential * 100)}% {lang === 'de' ? 'Automatisierung' : 'Automation'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tab content with smooth transitions */}
          <div className="relative">
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
