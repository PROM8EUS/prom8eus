/**
 * Monitoring Dashboard Component
 * 
 * Displays real-time monitoring data for refactored paths
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { performanceMonitor } from '@/lib/monitoring/performanceMonitor';
import { analysisMonitor } from '@/lib/monitoring/analysisMonitor';
import { marketplaceMonitor } from '@/lib/monitoring/marketplaceMonitor';

interface MonitoringDashboardProps {
  isVisible?: boolean;
  refreshInterval?: number; // milliseconds
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  isVisible = true,
  refreshInterval = 5000 // 5 seconds
}) => {
  const [stats, setStats] = useState(performanceMonitor.getStats());
  const [analysisMetrics, setAnalysisMetrics] = useState(analysisMonitor.getCurrentAnalysisMetrics());
  const [marketplaceMetrics, setMarketplaceMetrics] = useState(marketplaceMonitor.getSessionMetrics());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh data
  useEffect(() => {
    if (!isVisible || !autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isVisible, autoRefresh, refreshInterval]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      setStats(performanceMonitor.getStats());
      setAnalysisMetrics(analysisMonitor.getCurrentAnalysisMetrics());
      setMarketplaceMetrics(marketplaceMonitor.getSessionMetrics());
    } catch (error) {
      console.error('Failed to refresh monitoring data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      performance: stats,
      analysis: analysisMetrics,
      marketplace: marketplaceMetrics
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const flushData = async () => {
    try {
      await performanceMonitor.flush();
      console.log('Monitoring data flushed successfully');
    } catch (error) {
      console.error('Failed to flush monitoring data:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring for refactored analysis and marketplace flows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={flushData}
          >
            Flush Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analysis">Analysis Pipeline</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  Performance events tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Timers</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTimers}</div>
                <p className="text-xs text-muted-foreground">
                  Currently running operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.memoryUsage / 1024 / 1024).toFixed(1)} MB
                </div>
                <p className="text-xs text-muted-foreground">
                  JavaScript heap size
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.floor(marketplaceMetrics.sessionDuration / 1000 / 60)}m
                </div>
                <p className="text-xs text-muted-foreground">
                  Current session time
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Performance Monitor</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Analysis Pipeline</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Marketplace Monitor</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Events tracked</span>
                    <span className="font-mono">{stats.totalEvents}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Metrics collected</span>
                    <span className="font-mono">{stats.totalMetrics}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Session ID</span>
                    <span className="font-mono text-xs">{marketplaceMetrics.sessionId.substring(0, 8)}...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Memory Usage</h4>
                  <div className="text-2xl font-bold">
                    {(stats.memoryUsage / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Active Timers</h4>
                  <div className="text-2xl font-bold">{stats.activeTimers}</div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Total Events</h4>
                  <div className="text-2xl font-bold">{stats.totalEvents}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Pipeline Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisMetrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Total Tasks</h4>
                    <div className="text-2xl font-bold">{analysisMetrics.totalTasks || 0}</div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Total Subtasks</h4>
                    <div className="text-2xl font-bold">{analysisMetrics.totalSubtasks || 0}</div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Pipeline Status</h4>
                    <Badge variant={analysisMetrics.pipelineSuccess ? "default" : "destructive"}>
                      {analysisMetrics.pipelineSuccess ? "Success" : "Error"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No active analysis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Solution Views</h4>
                  <div className="text-2xl font-bold">{marketplaceMetrics.solutionViews}</div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Searches</h4>
                  <div className="text-2xl font-bold">{marketplaceMetrics.searches}</div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Downloads</h4>
                  <div className="text-2xl font-bold">{marketplaceMetrics.downloads}</div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Shares</h4>
                  <div className="text-2xl font-bold">{marketplaceMetrics.shares}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
