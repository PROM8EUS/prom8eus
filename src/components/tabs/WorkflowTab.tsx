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
  ListFilter,
  RefreshCw
} from 'lucide-react';
import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';
import { UnifiedSolutionCard } from '@/components/UnifiedSolutionCard';
import { clearAllWorkflowCaches } from '@/lib/workflowGenerator';
import FilterBar from '@/components/FilterBar';
import WorkflowDetailModal from '@/components/WorkflowDetailModal';

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
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal state
  const [selectedWorkflow, setSelectedWorkflow] = useState<UnifiedWorkflow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert UnifiedWorkflow to WorkflowIndex for the modal
  const convertToWorkflowIndex = (workflow: UnifiedWorkflow) => {
    return {
      id: workflow.id,
      source: 'ai-generated',
      title: workflow.title,
      summary: workflow.description,
      link: '#',
      category: workflow.category || 'General',
      integrations: workflow.integrations || [],
      complexity: workflow.complexity as 'Low' | 'Medium' | 'High',
      tags: workflow.tags || [],
      active: true,
      triggerType: 'Manual' as const,
      nodeCount: workflow.steps?.length || 0,
      license: 'Unknown'
    };
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
        // Filter workflows that match the selected subtask
        filteredWorkflows = generatedWorkflows.filter(w => {
          // Apply subtask-specific filtering
          const matchesSubtask = w.source === 'ai-generated' && w.isAIGenerated;
          
          return matchesSubtask;
        });
        console.log(`🎯 [WorkflowTab] Filtered workflows for subtask "${subtask.title}":`, filteredWorkflows.length);
      } else {
        // Show all workflows when no specific subtask is selected
        filteredWorkflows = generatedWorkflows;
        console.log(`🎯 [WorkflowTab] Showing all workflows:`, filteredWorkflows.length);
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

    } else {
      // Show loading state when no workflows are available yet
      setIsLoading(true);
      console.log('⏳ [WorkflowTab] No workflows available yet, showing loading state');
    }
  }, [subtask, generatedWorkflows, isGeneratingInitial]);

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
    setSelectedWorkflow(workflow);
    setIsModalOpen(true);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <ListFilter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      {showFilters && (
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={lang === 'de' ? 'Workflows durchsuchen...' : 'Search workflows...'}
          filters={[
            {
              label: lang === 'de' ? 'Komplexität' : 'Complexity',
              value: complexityFilter,
              options: [
                { value: 'all', label: lang === 'de' ? 'Alle' : 'All' },
                { value: 'Low', label: lang === 'de' ? 'Einfach' : 'Low' },
                { value: 'Medium', label: lang === 'de' ? 'Mittel' : 'Medium' },
                { value: 'High', label: lang === 'de' ? 'Schwer' : 'High' }
              ],
              onValueChange: setComplexityFilter
            }
          ]}
          sortBy={sortBy}
          sortOptions={[
            { value: 'title', label: lang === 'de' ? 'Titel' : 'Title' },
            { value: 'complexity', label: lang === 'de' ? 'Komplexität' : 'Complexity' },
            { value: 'timeSavings', label: lang === 'de' ? 'Zeitersparnis' : 'Time Savings' }
          ]}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          lang={lang}
        />
      )}

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

      {/* Workflow Detail Modal */}
      <WorkflowDetailModal
        workflow={selectedWorkflow ? convertToWorkflowIndex(selectedWorkflow) : null}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWorkflow(null);
        }}
        lang={lang}
      />
    </div>
  );
}