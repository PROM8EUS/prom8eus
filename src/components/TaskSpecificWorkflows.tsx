import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  DollarSign, 
  Download,
  Star,
  Workflow,
  Zap,
  FolderOpen,
  Timer,
  PiggyBank,
  ThumbsUp,
  Users,
  Network,
  HelpCircle
} from 'lucide-react';
import { n8nApiClient, N8nWorkflow } from '../lib/n8nApi';
import { WorkflowItem, WorkflowItemData } from './WorkflowItem';


interface TaskSpecificWorkflowsProps {
  taskText: string;
  lang?: 'de' | 'en';
  selectedApplications?: string[];
  onSolutionsLoaded?: (count: number) => void;
}

export const TaskSpecificWorkflows: React.FC<TaskSpecificWorkflowsProps> = ({
  taskText,
  lang = 'de',
  selectedApplications = [],
  onSolutionsLoaded
}) => {
  const [workflows, setWorkflows] = useState<WorkflowItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItemData | null>(null);


  useEffect(() => {
    if (taskText) {
      loadWorkflows();
    }
  }, [taskText, selectedApplications]);

  const loadWorkflows = async () => {
    setLoading(true);
    setError(null);
    
    try {

      
              const foundWorkflows = await n8nApiClient.fastSearchWorkflows(taskText, selectedApplications);
      setWorkflows(foundWorkflows);
      
      if (onSolutionsLoaded) {
        onSolutionsLoaded(foundWorkflows.length);
      }
    } catch (err) {
      console.error('Error loading workflows:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      if (onSolutionsLoaded) {
        onSolutionsLoaded(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Test function to debug workflow fetching
  const testWorkflowFetching = async () => {
    console.log('Testing workflow fetching...');
    await n8nApiClient.testWorkflowFetching();
  };

  // Force complete refresh of all workflows
  const forceCompleteRefresh = async () => {
    console.log('Forcing complete workflow refresh...');
    await n8nApiClient.forceCompleteRefresh();
    // Reload workflows after refresh
    await loadWorkflows();
  };

  // Debug available categories
  const debugCategories = async () => {
    console.log('=== DEBUGGING AVAILABLE CATEGORIES ===');
    const categories = await n8nApiClient.getAvailableCategories();
    console.log('Available categories:', categories);
    console.log('Total categories:', categories.length);
  };

  const calculateTotalROI = (workflow: WorkflowItemData) => {
    // Parse estimatedTime string (e.g., "30 min", "2 h")
    let hours = 0;
    if (typeof workflow.estimatedTime === 'string') {
      if (workflow.estimatedTime.includes('min')) {
        hours = parseInt(workflow.estimatedTime.replace(' min', '')) / 60;
      } else if (workflow.estimatedTime.includes('h')) {
        hours = parseInt(workflow.estimatedTime.replace(' h', ''));
      }
    } else {
      hours = workflow.estimatedTime;
    }
    
    const monthlyTimeSavings = hours * 4;
    const hourlyRate = workflow.category === 'Finance' ? 80 : workflow.category === 'Marketing' ? 70 : 60;
    const monthlyCostSavings = monthlyTimeSavings * hourlyRate;
    
    // Parse estimatedCost string (e.g., "€100")
    let cost = 0;
    if (typeof workflow.estimatedCost === 'string') {
      cost = parseInt(workflow.estimatedCost.replace('€', ''));
    } else {
      cost = workflow.estimatedCost;
    }
    
    return monthlyCostSavings - cost;
  };

  const handleDownloadWorkflow = async (workflow: WorkflowItemData) => {
    try {
      // Try to fetch the actual n8n node definition from the jsonUrl
      if (workflow.jsonUrl) {
        const response = await fetch(workflow.jsonUrl);
        if (response.ok) {
          const nodeDefinition = await response.json();
          
          // Create a comprehensive workflow file with n8n node definition
          const workflowData = {
            metadata: {
              id: workflow.id,
              title: workflow.name,
              description: workflow.description,
              category: workflow.category,
              difficulty: workflow.difficulty,
              estimatedTime: workflow.estimatedTime,
              estimatedCost: workflow.estimatedCost,
              integrations: workflow.integrations,
              url: workflow.url,
              downloads: workflow.downloads,
              rating: workflow.rating,
              createdAt: workflow.createdAt
            },
            n8nNodeDefinition: nodeDefinition,
            workflowTemplate: {
              name: workflow.name,
              nodes: [
                {
                  id: '1',
                  name: workflow.name,
                  type: nodeDefinition.node || 'n8n-nodes-base.generic',
                  typeVersion: nodeDefinition.nodeVersion || '1.0',
                  position: [240, 300],
                  parameters: {}
                }
              ],
              connections: {},
              active: false,
              settings: {},
              versionId: '1'
            }
          };

          const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${workflow.id}_n8n_workflow.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          return;
        }
      }
      
      // Fallback: create workflow JSON with available data
      const workflowData = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        difficulty: workflow.difficulty,
        estimatedTime: workflow.estimatedTime,
        estimatedCost: workflow.estimatedCost,
        integrations: workflow.integrations,
        nodes: workflow.nodes,
        connections: workflow.connections,
        url: workflow.url,
        jsonUrl: workflow.jsonUrl,
        downloads: workflow.downloads,
        rating: workflow.rating,
        createdAt: workflow.createdAt
      };

      const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workflow.id}_workflow.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading workflow:', error);
      // Fallback to basic download
      const workflowData = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        integrations: workflow.integrations,
        url: workflow.url
      };

      const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workflow.id}_workflow.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {lang === 'de' ? 'Fehler beim Laden der Workflows' : 'Error loading workflows'}
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {lang === 'de' ? 'Keine passenden Workflows gefunden' : 'No matching workflows found'}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {workflows.map((workflow) => (
          <WorkflowItem
            key={workflow.id}
            workflow={workflow}
            lang={lang}
            compact={true}
            onDetails={setSelectedWorkflow}
            onDownload={handleDownloadWorkflow}
          />
        ))}
      </div>

      {/* Workflow Details Modal */}
      <Dialog open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedWorkflow && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  {selectedWorkflow.name}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">
                    {lang === 'de' ? 'Übersicht & Details' : 'Overview & Details'}
                  </TabsTrigger>
                  <TabsTrigger value="implementation">
                    {lang === 'de' ? 'Implementierung' : 'Implementation'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Key Metrics - Top Row */}
                  <div className="grid grid-cols-6 gap-3">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">{selectedWorkflow.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Kategorie' : 'Category'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">{selectedWorkflow.estimatedTime}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Zeitersparnis' : 'Time Savings'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <PiggyBank className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">€{calculateTotalROI(selectedWorkflow)}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Monatliche Einsparung' : 'Monthly Savings'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">{selectedWorkflow.rating}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Bewertung' : 'Rating'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">{selectedWorkflow.downloads.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Downloads' : 'Downloads'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Network className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">{selectedWorkflow.nodes}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Nodes' : 'Nodes'}
                      </div>
                    </div>
                  </div>

                            {/* Description and Author */}
          <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
            <div className="space-y-2">
              <h4 className="font-semibold">{lang === 'de' ? 'Beschreibung' : 'Description'}</h4>
              <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
            </div>
            <div className="space-y-2 text-right">
              <h4 className="font-semibold">{lang === 'de' ? 'Autor' : 'Author'}</h4>
              <p className="text-sm text-muted-foreground">{selectedWorkflow.author || 'Community'}</p>
            </div>
          </div>

                            {/* Integrations, Trigger and Status */}
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold">{lang === 'de' ? 'Integrationen' : 'Integrations'}</h4>
              <div className="flex flex-wrap gap-2">
                {selectedWorkflow.integrations.map((integration) => (
                  <Badge key={integration} variant="secondary">
                    {integration}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">{lang === 'de' ? 'Trigger' : 'Trigger'}</h4>
              <Badge variant="outline">{selectedWorkflow.triggerType}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{lang === 'de' ? 'Status' : 'Status'}</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      {lang === 'de' 
                        ? 'Aktiv: Workflow wird automatisch ausgeführt. Inaktiv: Workflow ist pausiert und kann manuell gestartet werden.'
                        : 'Active: Workflow runs automatically. Inactive: Workflow is paused and can be started manually.'
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant={selectedWorkflow.active ? "default" : "secondary"} className={selectedWorkflow.active ? "bg-green-100 text-green-800 border-green-200" : ""}>
                {selectedWorkflow.active ? (lang === 'de' ? 'Aktiv' : 'Active') : (lang === 'de' ? 'Inaktiv' : 'Inactive')}
              </Badge>
            </div>
          </div>
                </TabsContent>



                <TabsContent value="implementation" className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">{lang === 'de' ? 'Implementierungsschritte' : 'Implementation Steps'}</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>{lang === 'de' ? 'Workflow in n8n importieren' : 'Import workflow into n8n'}</li>
                        <li>{lang === 'de' ? 'API-Keys und Verbindungen konfigurieren' : 'Configure API keys and connections'}</li>
                        <li>{lang === 'de' ? 'Workflow testen und anpassen' : 'Test and customize workflow'}</li>
                        <li>{lang === 'de' ? 'Automatisierung aktivieren' : 'Activate automation'}</li>
                      </ol>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{lang === 'de' ? 'Workflow-Komplexität' : 'Workflow Complexity'}</h4>
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            <span className="font-medium">{selectedWorkflow.nodes}</span> {lang === 'de' ? 'Nodes' : 'Nodes'}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{selectedWorkflow.connections}</span> {lang === 'de' ? 'Verbindungen' : 'Connections'}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">{lang === 'de' ? 'Community-Bewertung' : 'Community Rating'}</h4>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{selectedWorkflow.rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({selectedWorkflow.downloads.toLocaleString()} {lang === 'de' ? 'Downloads' : 'Downloads'})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedWorkflow.url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Workflow className="w-4 h-4" />
                        {lang === 'de' ? 'Auf n8n.io anzeigen' : 'View on n8n.io'}
                      </Button>
                      <Button
                        onClick={() => handleDownloadWorkflow(selectedWorkflow)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {lang === 'de' ? 'Workflow herunterladen' : 'Download Workflow'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
