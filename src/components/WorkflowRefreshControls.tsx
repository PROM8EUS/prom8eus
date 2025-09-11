import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { workflowIndexer } from '@/lib/workflowIndexer';

interface WorkflowRefreshControlsProps {
  onRefresh?: () => void;
  source?: string; // Source context for per-source caching
}

export default function WorkflowRefreshControls({ onRefresh, source }: WorkflowRefreshControlsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [workflowCount, setWorkflowCount] = useState(0);
  const [hasCache, setHasCache] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);

  // Convert source name to cache key
  const getCacheKey = (sourceName?: string) => {
    if (!sourceName) return undefined;
    
    // Map display names to cache keys
    if (sourceName.toLowerCase().includes('n8n.io') || sourceName.toLowerCase().includes('official')) {
      return 'n8n.io';
    }
    if (sourceName.toLowerCase().includes('github') || sourceName.toLowerCase().includes('community') || sourceName.toLowerCase().includes('n8n community')) {
      return 'github';
    }
    if (sourceName.toLowerCase().includes('ai-enhanced') || sourceName.toLowerCase().includes('free templates')) {
      return 'ai-enhanced';
    }
    
    return sourceName.toLowerCase().replace(/\s+/g, '-');
  };

  const loadCacheStatus = async () => {
    const cacheKey = getCacheKey(source);
    const status = await workflowIndexer.getCacheStatus(cacheKey);
    setLastFetch(status.lastFetch);
    setWorkflowCount(status.workflowCount);
    setHasCache(status.hasCache);
  };

  useEffect(() => {
    loadCacheStatus();
  }, [source]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshResult(null);
    
    try {
      const cacheKey = getCacheKey(source);
      const result = await workflowIndexer.forceRefreshWorkflows(cacheKey);
      setRefreshResult(result);
      
      // Reload cache status
      await loadCacheStatus();
      
      // Notify parent component
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setRefreshResult({
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastFetch = (date: Date | null) => {
    if (!date) return 'Nie';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Compact Header with Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-sm">Cache Management</span>
            <Badge variant={hasCache ? "default" : "destructive"} className="text-xs">
              {hasCache ? 'Aktiv' : 'Leer'}
            </Badge>
          </div>
          
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            className="flex items-center gap-1.5"
          >
            {isRefreshing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {isRefreshing ? 'Lädt...' : 'Aktualisieren'}
          </Button>
        </div>

        {/* Compact Status Row */}
        <div className="flex items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Letzter Abruf: <span className="font-medium text-gray-900">{formatLastFetch(lastFetch)}</span></span>
          </div>
          
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>Workflows: <span className="font-medium text-gray-900">{workflowCount.toLocaleString()}</span></span>
          </div>
        </div>

        {/* Compact Success Message */}
        {refreshResult && (
          <div className={`mt-2 px-2 py-1 rounded text-xs flex items-center gap-1 ${
            refreshResult.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {refreshResult.success ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            <span>
              {refreshResult.success 
                ? `${refreshResult.count.toLocaleString()} Workflows geladen`
                : `Fehler: ${refreshResult.error}`
              }
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
