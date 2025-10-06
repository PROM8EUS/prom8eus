/**
 * WorkflowTab Component
 * Displays workflow solutions with enhanced BlueprintCard integration
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
  Search,
  Filter,
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  Loader2,
  Zap,
  Settings,
  Target,
  TrendingUp,
  X,
  RefreshCw,
  Plus
} from 'lucide-react';
import { UnifiedSolutionCard, UnifiedSolutionData } from '../UnifiedSolutionCard';
import { SmartSearch } from '../ui/SmartSearch';
import { SmartFilter } from '../ui/SmartFilter';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { DynamicSubtask } from '@/lib/types';
import { WorkflowMatch } from '@/lib/workflowMatcher';
import { matchWorkflowsWithFallback } from '@/lib/workflowMatcher';
import { generateWorkflowFast } from '@/lib/workflowGenerator';
import { cacheManager } from '@/lib/services/cacheManager';

type WorkflowTabProps = {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
  generatedWorkflows?: any[]; // NEW: Generated workflows from TaskPanel
  isGeneratingInitial?: boolean; // NEW: Initial generation state
  onLoadMore?: () => void; // NEW: Load more workflows
  isLoadingMore?: boolean; // NEW: Loading state for more workflows
  onWorkflowSelect?: (workflow: WorkflowMatch) => void;
  onDownloadRequest?: (workflow: WorkflowMatch) => void;
  onSetupRequest?: (workflow: WorkflowMatch) => void;
  onUpdateCount?: (count: number) => void;
};

export default function WorkflowTab({ 
  subtask, 
  lang = 'en', 
  generatedWorkflows = [],
  isGeneratingInitial = false,
  onLoadMore,
  isLoadingMore = false,
  onWorkflowSelect,
  onDownloadRequest,
  onSetupRequest,
  onUpdateCount
}: WorkflowTabProps) {
  const [workflows, setWorkflows] = useState<WorkflowMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Smart search and filter configuration
  // Filter configurations with dynamic counts
  const filterConfigs = [
    {
      id: 'status',
      label: lang === 'de' ? 'Status' : 'Status',
      type: 'select' as const,
      options: [
        { value: 'all', label: lang === 'de' ? 'Alle' : 'All', count: workflows.length },
        { value: 'verified', label: lang === 'de' ? 'Verifiziert' : 'Verified', count: workflows.filter(w => w.source === 'verified').length },
        { value: 'generated', label: lang === 'de' ? 'Generiert' : 'Generated', count: workflows.filter(w => w.source === 'generated').length },
        { value: 'subtask-specific', label: lang === 'de' ? 'Teilaufgabe-spezifisch' : 'Subtask-specific', count: workflows.filter(w => w.source === 'subtask-specific').length },
        { value: 'complete-solution', label: lang === 'de' ? 'Komplettlösung' : 'Complete solution', count: workflows.filter(w => w.source === 'complete-solution').length }
      ],
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      id: 'complexity',
      label: lang === 'de' ? 'Komplexität' : 'Complexity',
      type: 'select' as const,
      options: [
        { value: 'all', label: lang === 'de' ? 'Alle' : 'All', count: workflows.length },
        { value: 'low', label: lang === 'de' ? 'Niedrig' : 'Low', count: workflows.filter(w => w.workflow.complexity === 'low').length },
        { value: 'medium', label: lang === 'de' ? 'Mittel' : 'Medium', count: workflows.filter(w => w.workflow.complexity === 'medium').length },
        { value: 'high', label: lang === 'de' ? 'Hoch' : 'High', count: workflows.filter(w => w.workflow.complexity === 'high').length }
      ],
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'category',
      label: lang === 'de' ? 'Kategorie' : 'Category',
      type: 'select' as const,
      options: [
        { value: 'all', label: lang === 'de' ? 'Alle' : 'All', count: workflows.length },
        { value: 'marketing', label: lang === 'de' ? 'Marketing' : 'Marketing', count: workflows.filter(w => w.workflow.category === 'marketing').length },
        { value: 'analytics', label: lang === 'de' ? 'Analytics' : 'Analytics', count: workflows.filter(w => w.workflow.category === 'analytics').length },
        { value: 'communication', label: lang === 'de' ? 'Kommunikation' : 'Communication', count: workflows.filter(w => w.workflow.category === 'communication').length },
        { value: 'data', label: lang === 'de' ? 'Daten' : 'Data', count: workflows.filter(w => w.workflow.category === 'data').length },
        { value: 'integration', label: lang === 'de' ? 'Integration' : 'Integration', count: workflows.filter(w => w.workflow.category === 'integration').length },
        { value: 'general', label: lang === 'de' ? 'Allgemein' : 'General', count: workflows.filter(w => w.workflow.category === 'general').length }
      ],
      icon: <Settings className="h-4 w-4" />
    }
  ];

  const sortConfigs = [
    {
      id: 'relevance',
      label: lang === 'de' ? 'Relevanz' : 'Relevance',
      field: 'score',
      direction: 'desc' as const,
      icon: <Target className="h-4 w-4" />
    },
    {
      id: 'complexity',
      label: lang === 'de' ? 'Komplexität' : 'Complexity',
      field: 'workflow.complexity',
      direction: 'asc' as const,
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'time',
      label: lang === 'de' ? 'Einrichtungszeit' : 'Setup Time',
      field: 'workflow.estimatedTime',
      direction: 'asc' as const,
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: 'automation',
      label: lang === 'de' ? 'Automatisierung' : 'Automation',
      field: 'workflow.automationLevel',
      direction: 'desc' as const,
      icon: <TrendingUp className="h-4 w-4" />
    }
  ];

  // Use smart search hook
  const {
    searchQuery,
    setSearchQuery,
    filterValues,
    setFilterValues,
    sortConfig,
    setSortConfig,
    filteredData: filteredWorkflows,
    searchSuggestions,
    totalCount,
    filteredCount,
    hasActiveFilters,
    addToHistory
  } = useSmartSearch({
    data: workflows,
    searchFields: ['workflow.title', 'workflow.name', 'workflow.description', 'workflow.integrations'],
    filterConfigs,
    sortConfigs,
    debounceMs: 300,
    maxSuggestions: 8,
    enableHistory: true,
    historyKey: 'workflow-search-history'
  });

  // Load workflows when subtask changes OR when generatedWorkflows change
  useEffect(() => {
    // Show loading state if initial generation is in progress
    if (isGeneratingInitial) {
      setIsLoading(true);
      console.log('⏳ [WorkflowTab] Initial generation in progress, showing loading state');
      return;
    }

    if (generatedWorkflows && generatedWorkflows.length > 0) {
      // Filter workflows based on selected subtask
      let filteredWorkflows = generatedWorkflows;
      
      if (subtask && subtask.id !== 'all') {
        // Filter workflows that match the selected subtask
        filteredWorkflows = generatedWorkflows.filter(w => 
          w.subtaskMatches && w.subtaskMatches.includes(subtask.id)
        );
        console.log(`🎯 [WorkflowTab] Filtered workflows for subtask "${subtask.title}":`, filteredWorkflows.length);
      } else {
        console.log('🎯 [WorkflowTab] Showing all workflows for "Alle":', generatedWorkflows.length);
      }
      
      const convertedWorkflows = filteredWorkflows.map(w => ({
        workflow: {
          id: w.id,
          title: w.title,
          description: w.summary,
          category: w.category,
          complexity: w.complexity,
          integrations: w.integrations,
          estimatedTime: w.timeSavings,
          automationLevel: w.automationPotential * 100,
          source: w.source,
          link: w.link,
          domains: w.domains,
          domain_confidences: w.domain_confidences,
          domain_origin: w.domain_origin
        },
        score: 95,
        reasons: ['AI-generated', 'Task-specific'],
        source: 'ai-generated'
      }));
      setWorkflows(convertedWorkflows);
      setIsLoading(false); // Stop loading when workflows are ready
      onUpdateCount?.(convertedWorkflows.length);
    } else {
      // Show loading state when no workflows are available yet
      setIsLoading(true);
      console.log('⏳ [WorkflowTab] No workflows available yet, showing loading state');
      // Don't call loadWorkflows() - TaskPanel will generate workflows
    }
  }, [subtask, generatedWorkflows, isGeneratingInitial]);

  const loadWorkflows = async () => {
      // console.log('🔍 [WorkflowTab] Current subtask:', subtask);
      // console.log('🔍 [WorkflowTab] Is "Alle (Komplettlösungen)" selected?', !subtask);
      // console.log('🔍 [WorkflowTab] Subtask ID:', subtask?.id);
      // console.log('🔍 [WorkflowTab] Subtask title:', subtask?.title);

    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check cache first
      const cacheKey = `workflows_${subtask?.id || 'all'}`;
      // console.log('🔍 [WorkflowTab] Cache key:', cacheKey);
      
      // TEMPORARY: Clear ALL cache to test generation
      // cacheManager.clear();
      // console.log('🧹 [WorkflowTab] Cleared ALL cache for testing');
      
      const cached = cacheManager.get<WorkflowMatch[]>(cacheKey);
      
      if (cached && cached.length > 0) {
        // console.log('✅ [WorkflowTab] Using cached workflows:', cached.length);
        // console.log('🔍 [WorkflowTab] Cached workflow titles:', cached.map(w => w.workflow.title));
        setWorkflows(cached);
        onUpdateCount?.(cached.length);
        setIsLoading(false);
        return;
      }

      // Generate workflows based on context
      let matches: WorkflowMatch[] = [];
      
      if (subtask && subtask.id !== 'all') {
        // Generate specific workflows for individual subtask
        // console.log('🔍 [WorkflowTab] Generating SPECIFIC workflows for subtask:', subtask.title);
        matches = generateSubtaskWorkflows(subtask, lang);
        // console.log('🔍 [WorkflowTab] Generated specific workflows:', matches.map(w => w.workflow.title));
      } else {
        // Generate complete solution workflows for "Alle (Komplettlösungen)"
        // console.log('🔍 [WorkflowTab] Generating COMPLETE SOLUTION workflows for "Alle (Komplettlösungen)"');
        matches = generateCompleteSolutionWorkflows(lang);
        // console.log('🔍 [WorkflowTab] Generated complete solution workflows:', matches.map(w => w.workflow.title));
      }

      // console.log('✅ [WorkflowTab] Loaded workflows:', matches.length);
      setWorkflows(matches);
      onUpdateCount?.(matches.length);

      // Cache the results
      cacheManager.set(cacheKey, matches, 60 * 60 * 1000); // 1 hour cache

    } catch (error) {
      console.error('❌ [WorkflowTab] Error loading workflows:', error);
      setError(error instanceof Error ? error.message : 'Failed to load workflows');
      setWorkflows([]);
      onUpdateCount?.(0);
    } finally {
      setIsLoading(false);
    }
  };


  // Enhanced helper functions

  const handleShare = (blueprint: EnhancedBlueprintData) => {
    if (navigator.share) {
      navigator.share({
        title: blueprint.name,
        text: blueprint.description,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${blueprint.name} - ${blueprint.description}`);
    }
  };

  // Convert WorkflowMatch to EnhancedBlueprintData
  const convertToUnifiedSolution = (workflow: WorkflowMatch): UnifiedSolutionData => {
    const workflowData = 'workflow' in workflow ? workflow.workflow : workflow;
    return {
      id: workflow.id,
      name: workflowData.title || workflowData.name || 'Untitled Workflow',
      description: workflowData.description || 'No description available',
      type: 'workflow',
      complexity: workflow.complexity || 'Medium',
      integrations: workflow.integrations || [],
      category: workflow.category,
      isAIGenerated: workflow.isAIGenerated || false,
      status: workflow.status || 'generated',
      generationMetadata: workflow.generationMetadata,
      setupCost: workflow.setupCost || 0,
      popularity: Math.floor(Math.random() * 100),
      rating: Math.floor(Math.random() * 2) + 3, // 3-5 stars
      lastUpdated: new Date().toISOString(),
      author: 'AI Assistant',
      tags: workflow.tags || [],
      difficulty: workflow.complexity === 'Low' ? 'beginner' : 
                  workflow.complexity === 'High' ? 'advanced' : 'intermediate',
      triggerType: workflow.triggerType,
      matchScore: workflow.matchScore
    };
  };

  const handleDownload = async (workflow: WorkflowMatch) => {
    try {
      // If it's a generated workflow, ensure we have the blueprint
      if (workflow.isAIGenerated && !workflow.downloadUrl) {
        console.log('🔄 [WorkflowTab] Generating blueprint for download...');
        const blueprint = await generateWorkflowFast(subtask!, lang);
        if (blueprint) {
          workflow.downloadUrl = blueprint.downloadUrl;
        }
      }
      
      onDownloadRequest?.(workflow);
    } catch (error) {
      console.error('❌ [WorkflowTab] Error preparing download:', error);
    }
  };

  const handleSetupRequest = (workflow: WorkflowMatch) => {
    onSetupRequest?.(workflow);
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generated':
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'fallback':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return lang === 'de' ? 'Verifiziert' : 'Verified';
      case 'generated':
        return lang === 'de' ? 'KI-generiert' : 'AI Generated';
      case 'fallback':
        return lang === 'de' ? 'Fallback' : 'Fallback';
      default:
        return lang === 'de' ? 'Unbekannt' : 'Unknown';
    }
  };

  // Always show workflows, even without selected subtask

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {lang === 'de' ? 'Workflow-Lösungen' : 'Workflow Solutions'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {lang === 'de' ? 'Für:' : 'For:'} {subtask?.title || (lang === 'de' ? 'Alle Teilaufgaben' : 'All Subtasks')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadWorkflows()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {lang === 'de' ? 'Aktualisieren' : 'Refresh'}
        </Button>
      </div>

      {/* Search, Filter and Sort in one line */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                addToHistory(e.target.value);
              }
            }}
            placeholder={lang === 'de' ? 'Workflows durchsuchen...' : 'Search workflows...'}
            className="pl-10 w-full"
          />
        </div>

        {/* Filter Trigger */}
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 ${hasActiveFilters ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Filter className="h-4 w-4" />
          {lang === 'de' ? 'Filter' : 'Filters'}
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
              {Object.values(filterValues).filter(v => v && v !== 'all').length}
            </Badge>
          )}
        </Button>

        {/* Sort Dropdown */}
        <Select value={sortConfig?.field || 'relevance'} onValueChange={(value) => setSortConfig({ field: value, direction: 'asc' })}>
          <SelectTrigger className="w-40">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">{lang === 'de' ? 'Relevanz' : 'Relevance'}</SelectItem>
            <SelectItem value="popularity">{lang === 'de' ? 'Beliebtheit' : 'Popularity'}</SelectItem>
            <SelectItem value="complexity">{lang === 'de' ? 'Komplexität' : 'Complexity'}</SelectItem>
            <SelectItem value="setupTime">{lang === 'de' ? 'Einrichtungszeit' : 'Setup Time'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters in one line */}
      {showFilters && (
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">{lang === 'de' ? 'Status' : 'Status'}</label>
            <Select 
              value={filterValues.status || 'all'} 
              onValueChange={(value) => setFilterValues(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterConfigs[0].options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Complexity Filter */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">{lang === 'de' ? 'Komplexität' : 'Complexity'}</label>
            <Select 
              value={filterValues.complexity || 'all'} 
              onValueChange={(value) => setFilterValues(prev => ({ ...prev, complexity: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterConfigs[1].options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">{lang === 'de' ? 'Kategorie' : 'Category'}</label>
            <Select 
              value={filterValues.category || 'all'} 
              onValueChange={(value) => setFilterValues(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterConfigs[2].options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear All Button - only show if filters are active */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterValues({})}
              className="ml-auto p-2"
              title={lang === 'de' ? 'Alle Filter zurücksetzen' : 'Clear all filters'}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">
              {lang === 'de' ? 'Lade Workflows...' : 'Loading workflows...'}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Workflows Grid */}
      {error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lang === 'de' ? 'Fehler beim Laden' : 'Error Loading'}
          </h3>
          <p className="text-gray-600">
            {lang === 'de' ? 'Workflows konnten nicht geladen werden.' : 'Workflows could not be loaded.'}
          </p>
        </div>
      ) : !isLoading && filteredWorkflows.length > 0 ? (
        <div className="space-y-4">
          {filteredWorkflows.map((workflow, index) => {
            const unifiedSolution = convertToUnifiedSolution(workflow);
            return (
              <UnifiedSolutionCard
                key={workflow.workflow.id || index}
                solution={unifiedSolution}
                lang={lang}
                onSelect={(unifiedSolution) => onWorkflowSelect?.(workflow)}
                onDownloadClick={(unifiedSolution) => handleDownload(workflow)}
                onSetupClick={(unifiedSolution) => handleSetupRequest(workflow)}
                onShareClick={handleShare}
                compact={true}
                isInteractive={true}
                className="group"
              />
            );
          })}
        </div>
      ) : null}

      {/* Load More Button */}
      {!isLoading && !error && filteredWorkflows.length > 0 && onLoadMore && (
        <div className="text-center py-6">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {lang === 'de' ? 'Lade weitere...' : 'Loading more...'}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {lang === 'de' ? 'Mehr Workflows laden' : 'Load More Workflows'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lang === 'de' ? 'Keine Workflows gefunden' : 'No Workflows Found'}
          </h3>
          <p className="text-gray-600">
            {lang === 'de' ? 'Versuchen Sie andere Suchbegriffe oder Filter.' : 'Try different search terms or filters.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Generate complete solution workflows for "Alle (Komplettlösungen)" - DISABLED
function generateCompleteSolutionWorkflows(lang: 'de' | 'en'): WorkflowMatch[] {
  console.log('🔍 [generateCompleteSolutionWorkflows] DISABLED - No more generic workflows!');
  // Return empty array - no more hardcoded generic workflows
  return [];
}

// Generate specific workflows for individual subtasks
function generateSubtaskWorkflows(subtask: DynamicSubtask, lang: 'de' | 'en'): WorkflowMatch[] {
  const titleLower = subtask.title.toLowerCase();
  
  console.log('🔍 [generateSubtaskWorkflows] Generating SPECIFIC workflows for:', subtask.title);
  
  // Generate workflows based on subtask content
  if (titleLower.includes('sammeln') || titleLower.includes('aggreg')) {
    return [
      {
        workflow: {
          id: `subtask-${subtask.id}-1`,
          title: lang === 'de' ? 'Datensammel-Workflow' : 'Data Collection Workflow',
          description: lang === 'de' 
            ? 'Automatisierte Datensammlung mit ETL-Pipeline und Data Warehouse'
            : 'Automated data collection with ETL pipeline and data warehouse',
          category: 'data',
          complexity: 'high',
          integrations: ['Airbyte', 'Snowflake', 'Slack'],
          estimatedTime: 12.0,
          automationLevel: 85
        },
        score: 90,
        reasons: [
          lang === 'de' ? 'Spezifisch für Datensammlung' : 'Specific for data collection',
          lang === 'de' ? 'ETL-Pipeline' : 'ETL pipeline'
        ],
        source: 'subtask-specific'
      }
    ];
  } else if (titleLower.includes('interview') || titleLower.includes('termin')) {
    return [
      {
        workflow: {
          id: `subtask-${subtask.id}-1`,
          title: lang === 'de' ? 'Termin-Verwaltungs-Workflow' : 'Appointment Management Workflow',
          description: lang === 'de'
            ? 'Automatische Kalenderverwaltung und E-Mail-Benachrichtigungen'
            : 'Automatic calendar management and email notifications',
          category: 'scheduling',
          complexity: 'medium',
          integrations: ['Google Calendar', 'Gmail', 'Calendly'],
          estimatedTime: 8.0,
          automationLevel: 75
        },
        score: 85,
        reasons: [
          lang === 'de' ? 'Kalender-Integration' : 'Calendar integration',
          lang === 'de' ? 'Automatische Benachrichtigungen' : 'Automatic notifications'
        ],
        source: 'subtask-specific'
      }
    ];
  } else if (titleLower.includes('anzeige') || titleLower.includes('post')) {
    return [
      {
        workflow: {
          id: `subtask-${subtask.id}-1`,
          title: lang === 'de' ? 'Posting-Workflow' : 'Posting Workflow',
          description: lang === 'de'
            ? 'Automatisches Erstellen und Veröffentlichen von Anzeigen'
            : 'Automatic creation and publishing of job postings',
          category: 'publishing',
          complexity: 'medium',
          integrations: ['LinkedIn', 'Indeed', 'Xing'],
          estimatedTime: 6.0,
          automationLevel: 70
        },
        score: 80,
        reasons: [
          lang === 'de' ? 'Multi-Platform Posting' : 'Multi-platform posting',
          lang === 'de' ? 'Automatisierte Erstellung' : 'Automated creation'
        ],
        source: 'subtask-specific'
      }
    ];
  }
  
  // Generate multiple specific workflows for any subtask
  const workflows: WorkflowMatch[] = [];
  
  // Generate specific workflows based on task type
  const taskTitle = subtask.title.toLowerCase();
  
  if (taskTitle.includes('mitarbeiterentwicklung') || taskTitle.includes('personalplanung')) {
    // Workflow 1: Talent Development
    workflows.push({
      workflow: {
        id: `subtask-${subtask.id}-1`,
        title: lang === 'de' ? `Talent-Entwickler: ${subtask.title}` : `Talent Developer: ${subtask.title}`,
        description: lang === 'de'
          ? `Strategischer Workflow für Mitarbeiterentwicklung: ${subtask.title}`
          : `Strategic workflow for employee development: ${subtask.title}`,
        category: 'hr',
        complexity: 'medium',
        integrations: ['HR-Software', 'Learning Management', 'Slack'],
        estimatedTime: 12.0,
        automationLevel: 80
      },
      score: 85,
      reasons: [
        lang === 'de' ? 'HR-spezifisch' : 'HR-specific',
        lang === 'de' ? 'Strategisch ausgerichtet' : 'Strategically aligned'
      ],
      source: 'subtask-specific'
    });

    // Workflow 2: Performance Tracking
    workflows.push({
      workflow: {
        id: `subtask-${subtask.id}-2`,
        title: lang === 'de' ? `Performance-Tracker: ${subtask.title}` : `Performance Tracker: ${subtask.title}`,
        description: lang === 'de'
          ? `Automatisierte Leistungsverfolgung und Feedback: ${subtask.title}`
          : `Automated performance tracking and feedback: ${subtask.title}`,
        category: 'analytics',
        complexity: 'high',
        integrations: ['Google Analytics', 'Slack', 'Google Sheets'],
        estimatedTime: 15.0,
        automationLevel: 85
      },
      score: 80,
      reasons: [
        lang === 'de' ? 'Leistungsanalyse' : 'Performance analysis',
        lang === 'de' ? 'KI-gestützt' : 'AI-powered'
      ],
      source: 'subtask-specific'
    });

    // Workflow 3: Learning Path
    workflows.push({
      workflow: {
        id: `subtask-${subtask.id}-3`,
        title: lang === 'de' ? `Lernpfad-Designer: ${subtask.title}` : `Learning Path Designer: ${subtask.title}`,
        description: lang === 'de'
          ? `Intelligente Lernpfad-Erstellung: ${subtask.title}`
          : `Intelligent learning path creation: ${subtask.title}`,
        category: 'education',
        complexity: 'medium',
        integrations: ['Learning Management', 'Google Calendar', 'Gmail'],
        estimatedTime: 10.0,
        automationLevel: 75
      },
      score: 75,
      reasons: [
        lang === 'de' ? 'Bildungsfokus' : 'Education-focused',
        lang === 'de' ? 'Personalisierung' : 'Personalization'
      ],
      source: 'subtask-specific'
    });
  } else if (taskTitle.includes('onboarding') || taskTitle.includes('einarbeitung')) {
    // Workflow 1: Onboarding Guide
    workflows.push({
      workflow: {
        id: `subtask-${subtask.id}-1`,
        title: lang === 'de' ? `Onboarding-Guide: ${subtask.title}` : `Onboarding Guide: ${subtask.title}`,
        description: lang === 'de'
          ? `Strukturierter Workflow für nahtlose Einarbeitung: ${subtask.title}`
          : `Structured workflow for seamless onboarding: ${subtask.title}`,
        category: 'hr',
        complexity: 'medium',
        integrations: ['Google Docs', 'Gmail', 'Slack'],
        estimatedTime: 8.0,
        automationLevel: 80
      },
      score: 85,
      reasons: [
        lang === 'de' ? 'Onboarding-spezifisch' : 'Onboarding-specific',
        lang === 'de' ? 'Strukturiert' : 'Structured'
      ],
      source: 'subtask-specific'
    });

    // Workflow 2: Document Automation
    workflows.push({
      workflow: {
        id: `subtask-${subtask.id}-2`,
        title: lang === 'de' ? `Dokument-Assistent: ${subtask.title}` : `Document Assistant: ${subtask.title}`,
        description: lang === 'de'
          ? `Automatisierte Dokumentenerstellung: ${subtask.title}`
          : `Automated document creation: ${subtask.title}`,
        category: 'documentation',
        complexity: 'medium',
        integrations: ['Google Docs', 'Airtable', 'Gmail'],
        estimatedTime: 6.0,
        automationLevel: 75
      },
      score: 80,
      reasons: [
        lang === 'de' ? 'Dokumentenautomatisierung' : 'Document automation',
        lang === 'de' ? 'Zeitersparnis' : 'Time-saving'
      ],
      source: 'subtask-specific'
    });

    // Workflow 3: Welcome Sequence
    workflows.push({
      workflow: {
        id: `subtask-${subtask.id}-3`,
        title: lang === 'de' ? `Willkommens-Sequenz: ${subtask.title}` : `Welcome Sequence: ${subtask.title}`,
        description: lang === 'de'
          ? `Automatisierte Willkommens-E-Mails und Termine: ${subtask.title}`
          : `Automated welcome emails and appointments: ${subtask.title}`,
        category: 'communication',
        complexity: 'low',
        integrations: ['Gmail', 'Google Calendar', 'Slack'],
        estimatedTime: 4.0,
        automationLevel: 90
      },
      score: 75,
      reasons: [
        lang === 'de' ? 'Kommunikationsautomatisierung' : 'Communication automation',
        lang === 'de' ? 'Benutzerfreundlich' : 'User-friendly'
      ],
      source: 'subtask-specific'
    });
  } else {
    // Generic workflows for other task types
    workflows.push({
      workflow: {
        id: `subtask-${subtask.id}-1`,
        title: lang === 'de' ? `Smart-Workflow: ${subtask.title}` : `Smart Workflow: ${subtask.title}`,
        description: lang === 'de'
          ? `Intelligenter Workflow für optimierte Prozesse: ${subtask.title}`
          : `Intelligent workflow for optimized processes: ${subtask.title}`,
        category: 'general',
        complexity: 'medium',
        integrations: ['General Tools', 'APIs'],
        estimatedTime: 10.0,
        automationLevel: 75
      },
      score: 80,
      reasons: [
        lang === 'de' ? 'Spezifisch für diese Teilaufgabe' : 'Specific for this subtask',
        lang === 'de' ? 'Maßgeschneidert' : 'Tailored'
      ],
      source: 'subtask-specific'
    });

    workflows.push({
      workflow: {
        id: `subtask-${subtask.id}-2`,
        title: lang === 'de' ? `Prozess-Optimierer: ${subtask.title}` : `Process Optimizer: ${subtask.title}`,
        description: lang === 'de'
          ? `Intelligente Prozessoptimierung: ${subtask.title}`
          : `Intelligent process optimization: ${subtask.title}`,
        category: 'optimization',
        complexity: 'high',
        integrations: ['Analytics', 'APIs', 'Database'],
        estimatedTime: 15.0,
        automationLevel: 85
      },
      score: 75,
      reasons: [
        lang === 'de' ? 'Prozessoptimierung' : 'Process optimization',
        lang === 'de' ? 'KI-gestützt' : 'AI-powered'
      ],
      source: 'subtask-specific'
    });

    workflows.push({
      workflow: {
        id: `subtask-${subtask.id}-3`,
        title: lang === 'de' ? `System-Connector: ${subtask.title}` : `System Connector: ${subtask.title}`,
        description: lang === 'de'
          ? `Intelligente Systemverbindungen: ${subtask.title}`
          : `Intelligent system connections: ${subtask.title}`,
        category: 'integration',
        complexity: 'medium',
        integrations: ['Zapier', 'n8n', 'Webhooks'],
        estimatedTime: 8.0,
        automationLevel: 70
      },
      score: 70,
      reasons: [
        lang === 'de' ? 'System-Integration' : 'System integration',
        lang === 'de' ? 'Multi-Platform' : 'Multi-platform'
      ],
      source: 'subtask-specific'
    });
  }

  return workflows;
}

// Generate example workflows when no real data is available (DEPRECATED - use specific functions above)
function generateExampleWorkflows(lang: 'de' | 'en'): WorkflowMatch[] {
  // This function should NEVER be called anymore!
  // All workflows should go through the proper context-aware functions
  console.error('🚨 [generateExampleWorkflows] This function should NOT be called! Use context-aware functions instead!');
  
  // Return empty array to force proper function usage
  return [];
}
