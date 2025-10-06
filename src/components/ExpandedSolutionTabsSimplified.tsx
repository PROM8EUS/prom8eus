/**
 * ExpandedSolutionTabs Component - Simplified version
 * Focuses on display and interaction, no data fetching
 */

import React, { useState, useMemo, Suspense, lazy } from 'react';
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
import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';

// Lazy load tab components for better performance
const WorkflowTab = lazy(() => import('./tabs/WorkflowTab'));
const AgentTab = lazy(() => import('./tabs/AgentTab'));
const LLMTab = lazy(() => import('./tabs/LLMTab'));

interface ExpandedSolutionTabsSimplifiedProps {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
  workflows: UnifiedWorkflow[]; // Server-provided workflows
  insights: any[]; // Server-provided insights
  isGeneratingInitial?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  onWorkflowSelect?: (workflow: UnifiedWorkflow) => void;
  onWorkflowDownload?: (workflow: UnifiedWorkflow) => void;
  onWorkflowSetup?: (workflow: UnifiedWorkflow) => void;
  onAgentSelect?: (agent: any) => void;
  onAgentSetup?: (agent: any) => void;
  onPromptSelect?: (prompt: any) => void;
  onPromptCopy?: (prompt: any) => void;
  onPromptOpenInService?: (prompt: any, service: string) => void;
  className?: string;
}

type TabType = 'workflows' | 'agents' | 'llms';

interface TabInfo {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    count: number;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

/**
 * ExpandedSolutionTabs - Content Display Component
 * Responsibilities:
 * - Display solution content in organized tabs
 * - Handle user interactions (select, download, setup)
 * - Manage tab switching
 * - Show loading states
 * - Emit interaction events
 * 
 * Does NOT:
 * - Fetch data (receives from parent)
 * - Handle business logic
 * - Manage global state
 */
export default function ExpandedSolutionTabsSimplified({
  subtask,
  lang = 'de',
  workflows,
  insights,
  isGeneratingInitial = false,
  onLoadMore,
  isLoadingMore = false,
  onWorkflowSelect,
  onWorkflowDownload,
  onWorkflowSetup,
  onAgentSelect,
  onAgentSetup,
  onPromptSelect,
  onPromptCopy,
  onPromptOpenInService,
  className = ''
}: ExpandedSolutionTabsSimplifiedProps) {
  
  const [activeTab, setActiveTab] = useState<TabType>('workflows');

  // Tab configuration
  const tabs: TabInfo[] = useMemo(() => [
    {
      id: 'workflows',
      label: lang === 'de' ? 'Workflow-Lösungen' : 'Workflow Solutions',
      icon: Workflow,
      badge: {
        count: workflows.length,
        variant: workflows.length > 0 ? 'default' : 'outline'
      }
    },
    {
      id: 'agents',
      label: lang === 'de' ? 'AI-Agent Lösungen' : 'AI Agent Solutions',
      icon: Bot,
      badge: {
        count: 0, // TODO: Get from server data
        variant: 'outline'
      }
    },
    {
      id: 'llms',
      label: lang === 'de' ? 'LLM-Prompt Lösungen' : 'LLM Prompt Solutions',
      icon: MessageSquare,
      badge: {
        count: 0, // TODO: Get from server data
        variant: 'outline'
      }
    }
  ], [lang, workflows.length]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (onLoadMore && !isLoadingMore) {
      onLoadMore();
    }
  };

  // Don't render if no subtask
  if (!subtask) {
    return (
      <Card className={`border border-gray-200 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">
              {lang === 'de' 
                ? 'Wählen Sie eine Unteraufgabe aus, um Lösungen anzuzeigen' 
                : 'Select a subtask to view solutions'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border border-gray-200 ${className}`}>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab Header */}
          <div className="border-b border-gray-200 px-6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {subtask.title}
                </h3>
                {subtask.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {subtask.description}
                  </p>
                )}
              </div>
            </div>
            
            <TabsList className="grid w-full grid-cols-3">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge && (
                    <Badge 
                      variant={tab.badge.variant} 
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {tab.badge.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-gray-600">
                  {lang === 'de' ? 'Lade Inhalt...' : 'Loading content...'}
                </span>
              </div>
            }>
              <TabsContent value="workflows" className="mt-0">
                <WorkflowTab
                  subtask={subtask}
                  lang={lang}
                  generatedWorkflows={workflows}
                  isGeneratingInitial={isGeneratingInitial}
                  onLoadMore={handleLoadMore}
                  isLoadingMore={isLoadingMore}
                  onWorkflowSelect={onWorkflowSelect}
                  onDownloadRequest={onWorkflowDownload}
                  onSetupRequest={onWorkflowSetup}
                />
              </TabsContent>

              <TabsContent value="agents" className="mt-0">
                <AgentTab
                  subtask={subtask}
                  lang={lang}
                  onAgentSelect={onAgentSelect}
                  onSetupRequest={onAgentSetup}
                />
              </TabsContent>

              <TabsContent value="llms" className="mt-0">
                <LLMTab
                  subtask={subtask}
                  lang={lang}
                  onPromptSelect={onPromptSelect}
                  onCopyPrompt={onPromptCopy}
                  onOpenInService={onPromptOpenInService}
                />
              </TabsContent>
            </Suspense>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
