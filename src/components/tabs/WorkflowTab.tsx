/**
 * WorkflowTab Component - Migrated to UnifiedWorkflow
 * Displays workflow solutions using the new unified schema
 * Updated: Mock data generation replaced with real AI generation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Workflow, 
  Download, 
  Eye, 
  Clock, 
  Sparkles,
  AlertCircle,
  Loader2,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';
import { UnifiedSolutionCard } from '@/components/UnifiedSolutionCard';
import { clearAllWorkflowCaches } from '@/lib/workflowGenerator';

type WorkflowTabProps = {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
  generatedWorkflows?: UnifiedWorkflow[];
  isGeneratingInitial?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  onWorkflowSelect?: (workflow: UnifiedWorkflow) => void;
  onDownloadRequest?: (workflow: UnifiedWorkflow) => void;
  onSetupRequest?: (workflow: UnifiedWorkflow) => void;
  onUpdateCount?: (count: number) => void;
};

export default function WorkflowTab({
  subtask,
  lang = 'de',
  generatedWorkflows = [],
  isGeneratingInitial = false,
  onLoadMore,
  isLoadingMore = false,
  onWorkflowSelect,
  onDownloadRequest,
  onSetupRequest,
  onUpdateCount
}: WorkflowTabProps) {
  const [workflows, setWorkflows] = useState<UnifiedWorkflow[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<UnifiedWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('ai-generated'); // Default to AI-generated only
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get available sources from workflows
  const getAvailableSources = (workflows: UnifiedWorkflow[]): string[] => {
    const sources = new Set<string>();
    workflows.forEach(workflow => {
      if (workflow.isAIGenerated) {
        sources.add('ai-generated');
      } else {
        sources.add(workflow.source || 'unknown');
      }
    });
    return Array.from(sources).sort();
  };

  // Load workflows when subtask changes OR when generatedWorkflows change
  useEffect(() => {
    // Show loading state if initial generation is in progress
    if (isGeneratingInitial) {
      setIsLoading(true);
      console.log('⏳ [WorkflowTab] Initial generation in progress, showing loading state');
      return;
    }

    if (generatedWorkflows && generatedWorkflows.length > 0) {
      // Check for duplicate IDs
      const workflowIds = generatedWorkflows.map(w => w.id);
      const uniqueIds = new Set(workflowIds);
      if (workflowIds.length !== uniqueIds.size) {
        console.warn('⚠️ [WorkflowTab] Duplicate workflow IDs detected:', workflowIds);
        const duplicates = workflowIds.filter((id, index) => workflowIds.indexOf(id) !== index);
        console.warn('⚠️ [WorkflowTab] Duplicate IDs:', duplicates);
      }
      
      // Filter workflows based on selected subtask
      let filteredWorkflows = generatedWorkflows;
      
      if (subtask && subtask.id !== 'all') {
        // Filter workflows that match the selected subtask and source filter
        filteredWorkflows = generatedWorkflows.filter(w => {
          // Apply source filter first
          const matchesSource = sourceFilter === 'all' || w.source === sourceFilter || 
                               (sourceFilter === 'ai-generated' && w.isAIGenerated);
          
          // Apply subtask-specific filtering
          const matchesSubtask = w.source === 'ai-generated' && w.isAIGenerated;
          
          return matchesSource && matchesSubtask;
        });
        console.log(`🎯 [WorkflowTab] Filtered workflows for subtask "${subtask.title}" with source "${sourceFilter}":`, filteredWorkflows.length);
      } else {
        // Apply only source filter when showing all workflows
        filteredWorkflows = generatedWorkflows.filter(w => {
          return sourceFilter === 'all' || w.source === sourceFilter || 
                 (sourceFilter === 'ai-generated' && w.isAIGenerated);
        });
        console.log(`🎯 [WorkflowTab] Showing workflows with source "${sourceFilter}":`, filteredWorkflows.length);
      }
      
      // Deduplicate workflows by ID
      const deduplicatedWorkflows = filteredWorkflows.filter((workflow, index, self) => 
        index === self.findIndex(w => w.id === workflow.id)
      );
      
      if (deduplicatedWorkflows.length !== filteredWorkflows.length) {
        console.log(`🧹 [WorkflowTab] Removed ${filteredWorkflows.length - deduplicatedWorkflows.length} duplicate workflows`);
      }
      
      // Use UnifiedWorkflow directly - no conversion needed
      setWorkflows(deduplicatedWorkflows);
      setFilteredWorkflows(deduplicatedWorkflows);
      setIsLoading(false); // Stop loading when workflows are ready
      onUpdateCount?.(deduplicatedWorkflows.length);

      // Auto-adjust source filter if current filter has no results
      const availableSources = getAvailableSources(deduplicatedWorkflows);
      if (sourceFilter !== 'all' && !availableSources.includes(sourceFilter)) {
        console.log(`🔄 [WorkflowTab] Source filter "${sourceFilter}" has no results, switching to "all"`);
        setSourceFilter('all');
      }
    } else {
      // Show loading state when no workflows are available yet
      setIsLoading(true);
      console.log('⏳ [WorkflowTab] No workflows available yet, showing loading state');
    }
  }, [subtask, generatedWorkflows, isGeneratingInitial, sourceFilter]);

  // Filter and sort workflows based on search and filter criteria
  useEffect(() => {
    let filtered = [...workflows];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(workflow => 
        workflow.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (workflow.integrations && workflow.integrations.some(integration => 
          integration.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    // Apply complexity filter
    if (complexityFilter !== 'all') {
      filtered = filtered.filter(workflow => workflow.complexity === complexityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'complexity':
          const complexityOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
          comparison = (complexityOrder[a.complexity as keyof typeof complexityOrder] || 0) - 
                      (complexityOrder[b.complexity as keyof typeof complexityOrder] || 0);
          break;
        case 'timeSavings':
          comparison = (a.timeSavings || 0) - (b.timeSavings || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredWorkflows(filtered);
  }, [workflows, searchQuery, complexityFilter, sortBy, sortOrder]);

  // No conversion needed - UnifiedSolutionCard now accepts UnifiedWorkflow directly

  // Handle workflow selection
  const handleWorkflowSelect = React.useCallback((workflow: UnifiedWorkflow) => {
    console.log('🔍 [WorkflowTab] Workflow selected:', workflow.title);
    onWorkflowSelect?.(workflow);
  }, [onWorkflowSelect]);

  // Handle download request
  const handleDownloadRequest = React.useCallback((workflow: UnifiedWorkflow) => {
    console.log('📥 [WorkflowTab] Download requested:', workflow.title);
    onDownloadRequest?.(workflow);
  }, [onDownloadRequest]);

  // Handle setup request
  const handleSetupRequest = React.useCallback((workflow: UnifiedWorkflow) => {
    console.log('⚙️ [WorkflowTab] Setup requested:', workflow.title);
    onSetupRequest?.(workflow);
  }, [onSetupRequest]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">
            {lang === 'de' ? 'Workflows werden geladen...' : 'Loading workflows...'}
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (filteredWorkflows.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Workflow className="h-8 w-8 mx-auto text-gray-400" />
          <p className="text-gray-600">
            {lang === 'de' ? 'Keine Workflows gefunden' : 'No workflows found'}
          </p>
        </div>
      </div>
    );
  }

  // Render workflows
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {lang === 'de' ? 'Workflow-Lösungen' : 'Workflow Solutions'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {lang === 'de' 
              ? `Für: ${subtask?.title || 'Alle Teilaufgaben'}`
              : `For: ${subtask?.title || 'All Subtasks'}`
            }
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {lang === 'de' ? 'Aktualisieren' : 'Refresh'}
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={lang === 'de' ? 'Workflows durchsuchen...' : 'Search workflows...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder={lang === 'de' ? 'Quelle' : 'Source'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-gray-500" />
                    {lang === 'de' ? 'Alle Quellen' : 'All Sources'}
                  </div>
                </SelectItem>
                {getAvailableSources(generatedWorkflows).map(source => (
                  <SelectItem key={source} value={source}>
                    <div className="flex items-center gap-2">
                      {source === 'ai-generated' ? (
                        <>
                          <Sparkles className="h-3 w-3 text-purple-500" />
                          {lang === 'de' ? 'AI-Generiert' : 'AI Generated'}
                        </>
                      ) : source === 'github' ? (
                        <>
                          <Workflow className="h-3 w-3 text-gray-600" />
                          GitHub
                        </>
                      ) : source === 'n8n.io' ? (
                        <>
                          <Workflow className="h-3 w-3 text-blue-600" />
                          n8n.io
                        </>
                      ) : (
                        <>
                          <Workflow className="h-3 w-3 text-gray-500" />
                          {source}
                        </>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={complexityFilter} onValueChange={setComplexityFilter}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder={lang === 'de' ? 'Komplexität' : 'Complexity'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'de' ? 'Alle' : 'All'}</SelectItem>
                <SelectItem value="Low">{lang === 'de' ? 'Einfach' : 'Low'}</SelectItem>
                <SelectItem value="Medium">{lang === 'de' ? 'Mittel' : 'Medium'}</SelectItem>
                <SelectItem value="High">{lang === 'de' ? 'Schwer' : 'High'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder={lang === 'de' ? 'Sortieren' : 'Sort'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">{lang === 'de' ? 'Titel' : 'Title'}</SelectItem>
                <SelectItem value="complexity">{lang === 'de' ? 'Komplexität' : 'Complexity'}</SelectItem>
                <SelectItem value="timeSavings">{lang === 'de' ? 'Zeitersparnis' : 'Time Savings'}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {lang === 'de' 
          ? `${filteredWorkflows.length} Workflow${filteredWorkflows.length !== 1 ? 's' : ''} gefunden`
          : `${filteredWorkflows.length} workflow${filteredWorkflows.length !== 1 ? 's' : ''} found`
        }
        {sourceFilter !== 'all' && (
          <span className="ml-2 text-gray-500">
            {lang === 'de' 
              ? `(Quelle: ${sourceFilter === 'ai-generated' ? 'AI-Generiert' : sourceFilter})`
              : `(Source: ${sourceFilter === 'ai-generated' ? 'AI Generated' : sourceFilter})`
            }
          </span>
        )}
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredWorkflows.map((workflow) => (
          <div 
            key={workflow.id}
            className="cursor-pointer relative"
            onClick={() => handleWorkflowSelect(workflow)}
          >
            {/* AI Generated Badge */}
            {workflow.isAIGenerated && (
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {lang === 'de' ? 'AI' : 'AI'}
                </Badge>
              </div>
            )}
            
            <UnifiedSolutionCard
              solution={workflow}
              lang={lang}
              onSelect={() => handleWorkflowSelect(workflow)}
              onSetupClick={() => handleWorkflowSelect(workflow)}
              onConfigClick={() => handleWorkflowSelect(workflow)}
              onShareClick={() => handleWorkflowSelect(workflow)}
              onDownloadClick={() => handleWorkflowSelect(workflow)}
            />
          </div>
        ))}
      </div>

      {/* Load More Button - moved to bottom */}
      {onLoadMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {lang === 'de' ? 'Lädt...' : 'Loading...'}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {lang === 'de' ? 'Mehr laden' : 'Load More'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}