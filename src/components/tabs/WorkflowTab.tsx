/**
 * WorkflowTab Component
 * Displays workflow solutions with enhanced BlueprintCard integration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Workflow, 
  Download, 
  Eye, 
  Clock, 
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
  Settings,
  Target,
  TrendingUp
} from 'lucide-react';
import { BlueprintCard } from '../BlueprintCard';
import { EnhancedBlueprintCard, EnhancedBlueprintData } from '../ui/EnhancedBlueprintCard';
import { WorkflowTabSkeleton, EmptyStateSkeleton, ErrorStateSkeleton } from '../ui/WorkflowTabSkeleton';
import { SmartSearch } from '../ui/SmartSearch';
import { SmartFilter } from '../ui/SmartFilter';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { DynamicSubtask } from '@/lib/types';
import { WorkflowMatch } from '@/lib/workflowMatcher';
import { matchWorkflowsWithFallback } from '@/lib/workflowMatcher';
import { generateBlueprintWithFallback } from '@/lib/blueprintGenerator';
import { cacheManager } from '@/lib/services/cacheManager';

type WorkflowTabProps = {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
  onWorkflowSelect?: (workflow: WorkflowMatch) => void;
  onDownloadRequest?: (workflow: WorkflowMatch) => void;
  onSetupRequest?: (workflow: WorkflowMatch) => void;
  onUpdateCount?: (count: number) => void;
};

export default function WorkflowTab({ 
  subtask, 
  lang = 'en', 
  onWorkflowSelect,
  onDownloadRequest,
  onSetupRequest,
  onUpdateCount
}: WorkflowTabProps) {
  const [workflows, setWorkflows] = useState<WorkflowMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Smart search and filter configuration
  const filterConfigs = [
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Status', count: workflows.length },
        { value: 'verified', label: 'Verified', count: workflows.filter(w => w.status === 'verified').length },
        { value: 'generated', label: 'Generated', count: workflows.filter(w => w.status === 'generated').length },
        { value: 'fallback', label: 'Fallback', count: workflows.filter(w => w.status === 'fallback').length }
      ],
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      id: 'complexity',
      label: 'Complexity',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Levels', count: workflows.length },
        { value: 'Low', label: 'Low', count: workflows.filter(w => w.workflow.complexity === 'Low').length },
        { value: 'Medium', label: 'Medium', count: workflows.filter(w => w.workflow.complexity === 'Medium').length },
        { value: 'High', label: 'High', count: workflows.filter(w => w.workflow.complexity === 'High').length }
      ],
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'integrations',
      label: 'Integrations',
      type: 'multiselect' as const,
      options: Array.from(new Set(workflows.flatMap(w => w.workflow.integrations || []))).map(integration => ({
        value: integration,
        label: integration,
        count: workflows.filter(w => w.workflow.integrations?.includes(integration)).length
      })),
      icon: <Settings className="h-4 w-4" />
    }
  ];

  const sortConfigs = [
    {
      id: 'relevance',
      label: 'Relevance',
      field: 'relevanceScore',
      direction: 'desc' as const,
      icon: <Target className="h-4 w-4" />
    },
    {
      id: 'popularity',
      label: 'Popularity',
      field: 'popularity',
      direction: 'desc' as const,
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      id: 'complexity',
      label: 'Complexity',
      field: 'complexity',
      direction: 'asc' as const,
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'time',
      label: 'Setup Time',
      field: 'estimatedSetupTime',
      direction: 'asc' as const,
      icon: <Clock className="h-4 w-4" />
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

  // Load workflows when subtask changes
  useEffect(() => {
    if (subtask) {
      loadWorkflows();
    } else {
      setWorkflows([]);
      onUpdateCount?.(0);
    }
  }, [subtask]);

  const loadWorkflows = async () => {
    if (!subtask) return;

    setIsLoading(true);
    setShowSkeleton(true);
    setError(null);
    
    try {
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check cache first
      const cacheKey = `workflows_${subtask?.id || 'all'}`;
      const cached = cacheManager.get<WorkflowMatch[]>(cacheKey);
      
      if (cached && cached.length > 0) {
        console.log('✅ [WorkflowTab] Using cached workflows:', cached.length);
        setWorkflows(cached);
        onUpdateCount?.(cached.length);
        setIsLoading(false);
        setShowSkeleton(false);
        return;
      }

      // Generate workflows with fallback or show example workflows
      let matches: WorkflowMatch[] = [];
      
      if (subtask) {
        // Try to match workflows for specific subtask
        matches = await matchWorkflowsWithFallback(subtask, [], {
          maxResults: 10,
          minScore: 20,
          autoGenerateFallback: true,
          language: lang
        });
      }
      
      // If no matches or no subtask, show example workflows
      if (matches.length === 0) {
        matches = generateExampleWorkflows(lang);
      }

      console.log('✅ [WorkflowTab] Loaded workflows:', matches.length);
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
      setShowSkeleton(false);
    }
  };

  const handleRefresh = () => {
    if (subtask) {
      // Clear cache and reload
      const cacheKey = `workflows_${subtask.id}`;
      cacheManager.delete(cacheKey);
      loadWorkflows();
    } else {
      // Clear cache for 'all' and reload
      const cacheKey = `workflows_all`;
      cacheManager.delete(cacheKey);
      loadWorkflows();
    }
  };

  // Enhanced helper functions
  const handleFavorite = (blueprint: EnhancedBlueprintData) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(blueprint.id)) {
      newFavorites.delete(blueprint.id);
    } else {
      newFavorites.add(blueprint.id);
    }
    setFavorites(newFavorites);
  };

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
  const convertToEnhancedBlueprint = (workflow: WorkflowMatch): EnhancedBlueprintData => {
    const workflowData = 'workflow' in workflow ? workflow.workflow : workflow;
    return {
      id: workflow.id,
      name: workflowData.title || workflowData.name || 'Untitled Workflow',
      description: workflowData.description || 'No description available',
      timeSavings: workflow.timeSavings || Math.floor(Math.random() * 20) + 5,
      complexity: workflow.complexity || 'Medium',
      integrations: workflow.integrations || [],
      category: workflow.category,
      isAIGenerated: workflow.isAIGenerated || false,
      status: workflow.status || 'generated',
      generationMetadata: workflow.generationMetadata,
      setupCost: workflow.setupCost || 0,
      downloadUrl: workflow.downloadUrl,
      validationStatus: workflow.validationStatus || 'valid',
      popularity: Math.floor(Math.random() * 100),
      rating: Math.floor(Math.random() * 2) + 3, // 3-5 stars
      lastUpdated: new Date().toISOString(),
      author: 'AI Assistant',
      tags: workflow.tags || [],
      estimatedSetupTime: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
      difficulty: workflow.complexity === 'Low' ? 'beginner' : 
                  workflow.complexity === 'High' ? 'advanced' : 'intermediate'
    };
  };

  const handleDownload = async (workflow: WorkflowMatch) => {
    try {
      // If it's a generated workflow, ensure we have the blueprint
      if (workflow.isAIGenerated && !workflow.downloadUrl) {
        console.log('🔄 [WorkflowTab] Generating blueprint for download...');
        const blueprint = await generateBlueprintWithFallback(subtask!, lang);
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
            {lang === 'de' 
              ? `Für: ${subtask?.title || 'Alle Teilaufgaben'}`
              : `For: ${subtask?.title || 'All Subtasks'}`
            }
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {lang === 'de' ? 'Aktualisieren' : 'Refresh'}
        </Button>
      </div>

      {/* Smart Search */}
      <SmartSearch
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          if (value.trim()) {
            addToHistory(value);
          }
        }}
        onSuggestionSelect={(suggestion) => {
          setSearchQuery(suggestion.text);
          addToHistory(suggestion.text);
        }}
        placeholder={lang === 'de' ? 'Workflows durchsuchen...' : 'Search workflows...'}
        suggestions={searchSuggestions}
        recentSearches={[]}
        popularSearches={[]}
        showFilters={false}
        showSuggestions={true}
        showHistory={true}
        maxSuggestions={8}
        debounceMs={300}
        size="md"
        variant="outline"
        className="w-full"
      />

      {/* Smart Filters */}
      <SmartFilter
        filters={filterConfigs}
        sortOptions={sortConfigs}
        values={filterValues}
        onChange={setFilterValues}
        onSortChange={setSortConfig}
        layout="horizontal"
        showLabels={true}
        showCounts={true}
        collapsible={true}
        defaultCollapsed={false}
        size="md"
        variant="outline"
        totalCount={totalCount}
        filteredCount={filteredCount}
        className="w-full"
      />

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
      {showSkeleton ? (
        <WorkflowTabSkeleton count={6} compact={true} />
      ) : error ? (
        <ErrorStateSkeleton />
      ) : !isLoading && filteredWorkflows.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkflows.map((workflow, index) => {
            const enhancedBlueprint = convertToEnhancedBlueprint(workflow);
            return (
              <EnhancedBlueprintCard
                key={workflow.workflow.id || index}
                blueprint={enhancedBlueprint}
                lang={lang}
                period="month"
                onDetailsClick={(blueprint) => onWorkflowSelect?.(workflow)}
                onDownloadClick={(blueprint) => handleDownload(workflow)}
                onSetupClick={(blueprint) => handleSetupRequest(workflow)}
                onFavoriteClick={handleFavorite}
                onShareClick={handleShare}
                compact={true}
                isInteractive={true}
                className="group"
              />
            );
          })}
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && !error && filteredWorkflows.length === 0 && (
        <EmptyStateSkeleton />
      )}
    </div>
  );
}

// Generate example workflows when no real data is available
function generateExampleWorkflows(lang: 'de' | 'en'): WorkflowMatch[] {
  const workflows: WorkflowMatch[] = [
    {
      workflow: {
        id: 'example-1',
        title: lang === 'de' ? 'Social Media Automatisierung' : 'Social Media Automation',
        description: lang === 'de' 
          ? 'Automatisiertes Posting und Monitoring für Social Media Plattformen'
          : 'Automated posting and monitoring for social media platforms',
        category: 'marketing',
        complexity: 'medium',
        integrations: ['Twitter', 'LinkedIn', 'Facebook'],
        estimatedTime: 2.5,
        automationLevel: 85
      },
      score: 92,
      reasons: [
        lang === 'de' ? 'Hohe Automatisierungsrate' : 'High automation rate',
        lang === 'de' ? 'Beliebte Integrationen' : 'Popular integrations'
      ],
      source: 'example'
    },
    {
      workflow: {
        id: 'example-2',
        title: lang === 'de' ? 'E-Mail Marketing Workflow' : 'Email Marketing Workflow',
        description: lang === 'de'
          ? 'Automatisierte E-Mail Kampagnen und Lead-Nurturing'
          : 'Automated email campaigns and lead nurturing',
        category: 'marketing',
        complexity: 'high',
        integrations: ['Mailchimp', 'HubSpot', 'Salesforce'],
        estimatedTime: 4.0,
        automationLevel: 90
      },
      score: 88,
      reasons: [
        lang === 'de' ? 'Umfassende Automatisierung' : 'Comprehensive automation',
        lang === 'de' ? 'Professionelle Tools' : 'Professional tools'
      ],
      source: 'example'
    },
    {
      workflow: {
        id: 'example-3',
        title: lang === 'de' ? 'Datenanalyse Pipeline' : 'Data Analysis Pipeline',
        description: lang === 'de'
          ? 'Automatisierte Datensammlung und Berichterstellung'
          : 'Automated data collection and reporting',
        category: 'analytics',
        complexity: 'high',
        integrations: ['Google Analytics', 'Tableau', 'Power BI'],
        estimatedTime: 3.5,
        automationLevel: 75
      },
      score: 85,
      reasons: [
        lang === 'de' ? 'Zeitsparende Automatisierung' : 'Time-saving automation',
        lang === 'de' ? 'Umfassende Berichte' : 'Comprehensive reports'
      ],
      source: 'example'
    }
  ];

  return workflows;
}
