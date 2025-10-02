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
  Loader2
} from 'lucide-react';
import { BlueprintCard } from '../BlueprintCard';
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
};

export default function WorkflowTab({ 
  subtask, 
  lang = 'en', 
  onWorkflowSelect,
  onDownloadRequest,
  onSetupRequest 
}: WorkflowTabProps) {
  const [workflows, setWorkflows] = useState<WorkflowMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'generated' | 'fallback'>('all');
  const [filterComplexity, setFilterComplexity] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');

  // Load workflows when subtask changes
  useEffect(() => {
    if (subtask) {
      loadWorkflows();
    } else {
      setWorkflows([]);
    }
  }, [subtask]);

  const loadWorkflows = async () => {
    if (!subtask) return;

    setIsLoading(true);
    try {
      // Check cache first
      const cacheKey = `workflows_${subtask.id}`;
      const cached = cacheManager.get<WorkflowMatch[]>(cacheKey);
      
      if (cached && cached.length > 0) {
        console.log('✅ [WorkflowTab] Using cached workflows:', cached.length);
        setWorkflows(cached);
        setIsLoading(false);
        return;
      }

      // Generate workflows with fallback
      const matches = await matchWorkflowsWithFallback(subtask, [], {
        maxResults: 10,
        minScore: 20,
        autoGenerateFallback: true,
        language: lang
      });

      console.log('✅ [WorkflowTab] Loaded workflows:', matches.length);
      setWorkflows(matches);

      // Cache the results
      cacheManager.set(cacheKey, matches, 60 * 60 * 1000); // 1 hour cache

    } catch (error) {
      console.error('❌ [WorkflowTab] Error loading workflows:', error);
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (subtask) {
      // Clear cache and reload
      const cacheKey = `workflows_${subtask.id}`;
      cacheManager.delete(cacheKey);
      loadWorkflows();
    }
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

  // Filter workflows based on search and filters
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = !searchQuery || 
      workflow.workflow.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.workflow.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || workflow.status === filterStatus;
    
    const matchesComplexity = filterComplexity === 'all' || 
      workflow.workflow.complexity === filterComplexity;
    
    return matchesSearch && matchesStatus && matchesComplexity;
  });

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

  if (!subtask) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">
            {lang === 'de' ? 'Wählen Sie eine Teilaufgabe aus' : 'Select a subtask'}
          </p>
          <p className="text-sm">
            {lang === 'de' 
              ? 'Wählen Sie eine Teilaufgabe aus der Seitenleiste aus, um Workflows anzuzeigen'
              : 'Select a subtask from the sidebar to view workflows'
            }
          </p>
        </div>
      </div>
    );
  }

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
              ? `Für: ${subtask.title}`
              : `For: ${subtask.title}`
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={lang === 'de' ? 'Workflows durchsuchen...' : 'Search workflows...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{lang === 'de' ? 'Alle Status' : 'All Status'}</option>
            <option value="verified">{lang === 'de' ? 'Verifiziert' : 'Verified'}</option>
            <option value="generated">{lang === 'de' ? 'KI-generiert' : 'AI Generated'}</option>
            <option value="fallback">{lang === 'de' ? 'Fallback' : 'Fallback'}</option>
          </select>
          
          <select
            value={filterComplexity}
            onChange={(e) => setFilterComplexity(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{lang === 'de' ? 'Alle Komplexität' : 'All Complexity'}</option>
            <option value="Low">{lang === 'de' ? 'Niedrig' : 'Low'}</option>
            <option value="Medium">{lang === 'de' ? 'Mittel' : 'Medium'}</option>
            <option value="High">{lang === 'de' ? 'Hoch' : 'High'}</option>
          </select>
        </div>
      </div>

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

      {/* Workflows Grid */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkflows.map((workflow, index) => (
            <Card key={workflow.workflow.id || index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {workflow.workflow.name || workflow.workflow.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(workflow.status)}
                        <span className="text-xs text-gray-600">
                          {getStatusText(workflow.status)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {workflow.workflow.complexity || 'Medium'}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {workflow.workflow.description || workflow.workflow.summary}
                  </p>

                  {/* Match Score */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${workflow.matchScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {workflow.matchScore}%
                    </span>
                  </div>

                  {/* Time Savings */}
                  {workflow.estimatedTimeSavings && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {workflow.estimatedTimeSavings.toFixed(1)}h {lang === 'de' ? 'gespart' : 'saved'}/Monat
                      </span>
                    </div>
                  )}

                  {/* Setup Cost */}
                  {workflow.setupCost && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">
                        {workflow.setupCost}€ {lang === 'de' ? 'Setup' : 'Setup'}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(workflow)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {lang === 'de' ? 'Download' : 'Download'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetupRequest(workflow)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {lang === 'de' ? 'Einrichtung' : 'Setup'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {lang === 'de' ? 'Keine Workflows gefunden' : 'No workflows found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {lang === 'de' 
              ? 'Versuchen Sie, Ihre Suchkriterien zu ändern oder die Seite zu aktualisieren'
              : 'Try changing your search criteria or refreshing the page'
            }
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {lang === 'de' ? 'Erneut versuchen' : 'Try Again'}
          </Button>
        </div>
      )}
    </div>
  );
}
