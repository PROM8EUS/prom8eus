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
  RefreshCw
} from 'lucide-react';
import { UnifiedSolutionCard, UnifiedSolutionData } from '../UnifiedSolutionCard';
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
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
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

  // Load workflows when subtask changes
  useEffect(() => {
    loadWorkflows();
  }, [subtask]);

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

// Generate complete solution workflows for "Alle (Komplettlösungen)"
function generateCompleteSolutionWorkflows(lang: 'de' | 'en'): WorkflowMatch[] {
  console.log('🔍 [generateCompleteSolutionWorkflows] Creating COMPLETE SOLUTION workflows');
  const workflows: WorkflowMatch[] = [
    {
      workflow: {
        id: 'complete-1',
        title: lang === 'de' ? 'Komplette Marketing-Automatisierung' : 'Complete Marketing Automation',
        description: lang === 'de' 
          ? 'End-to-End Marketing-Automatisierung von Lead-Generierung bis Conversion-Tracking'
          : 'End-to-end marketing automation from lead generation to conversion tracking',
        category: 'marketing',
        complexity: 'high',
        integrations: ['HubSpot', 'Mailchimp', 'Google Analytics', 'Facebook Ads', 'LinkedIn'],
        estimatedTime: 25.0,
        automationLevel: 85
      },
      score: 95,
      reasons: [
        lang === 'de' ? 'Umfassende Automatisierung' : 'Comprehensive automation',
        lang === 'de' ? 'End-to-End Lösung' : 'End-to-end solution'
      ],
      source: 'complete-solution'
    },
    {
      workflow: {
        id: 'complete-2',
        title: lang === 'de' ? 'Vollständige Datenanalyse-Pipeline' : 'Complete Data Analysis Pipeline',
        description: lang === 'de'
          ? 'Komplette Datenverarbeitung von Sammlung bis Berichterstellung mit KI-Insights'
          : 'Complete data processing from collection to reporting with AI insights',
        category: 'analytics',
        complexity: 'high',
        integrations: ['Google Analytics', 'Tableau', 'Power BI', 'Python', 'Jupyter'],
        estimatedTime: 30.0,
        automationLevel: 90
      },
      score: 92,
      reasons: [
        lang === 'de' ? 'KI-gestützte Analyse' : 'AI-powered analysis',
        lang === 'de' ? 'Automatisierte Berichte' : 'Automated reports'
      ],
      source: 'complete-solution'
    },
    {
      workflow: {
        id: 'complete-3',
        title: lang === 'de' ? 'Integrierte Kommunikations-Plattform' : 'Integrated Communication Platform',
        description: lang === 'de'
          ? 'Zentrale Kommunikations-Automatisierung für alle Kanäle und Stakeholder'
          : 'Central communication automation for all channels and stakeholders',
        category: 'communication',
        complexity: 'medium',
        integrations: ['Slack', 'Microsoft Teams', 'Zoom', 'Calendly', 'Email'],
        estimatedTime: 18.0,
        automationLevel: 80
      },
      score: 88,
      reasons: [
        lang === 'de' ? 'Multi-Channel Integration' : 'Multi-channel integration',
        lang === 'de' ? 'Zentrale Steuerung' : 'Central control'
      ],
      source: 'complete-solution'
    }
  ];

  return workflows;
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
  
  // Workflow 1: Main automation workflow
  workflows.push({
    workflow: {
      id: `subtask-${subtask.id}-1`,
      title: lang === 'de' ? `${subtask.title} - Automatisierung` : `${subtask.title} - Automation`,
      description: lang === 'de'
        ? `Spezifischer Workflow für: ${subtask.title}`
        : `Specific workflow for: ${subtask.title}`,
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

  // Workflow 2: Data processing workflow
  workflows.push({
    workflow: {
      id: `subtask-${subtask.id}-2`,
      title: lang === 'de' ? `${subtask.title} - Datenverarbeitung` : `${subtask.title} - Data Processing`,
      description: lang === 'de'
        ? `Automatisierte Datenverarbeitung für: ${subtask.title}`
        : `Automated data processing for: ${subtask.title}`,
      category: 'data',
      complexity: 'high',
      integrations: ['Python', 'SQL', 'APIs'],
      estimatedTime: 15.0,
      automationLevel: 85
    },
    score: 75,
    reasons: [
      lang === 'de' ? 'Datenverarbeitung' : 'Data processing',
      lang === 'de' ? 'KI-gestützt' : 'AI-powered'
    ],
    source: 'subtask-specific'
  });

  // Workflow 3: Integration workflow
  workflows.push({
    workflow: {
      id: `subtask-${subtask.id}-3`,
      title: lang === 'de' ? `${subtask.title} - Integration` : `${subtask.title} - Integration`,
      description: lang === 'de'
        ? `System-Integration für: ${subtask.title}`
        : `System integration for: ${subtask.title}`,
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
