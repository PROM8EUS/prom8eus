import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Download,
  Star,
  Workflow,
  Zap
} from 'lucide-react';
import { n8nApiClient, N8nWorkflow } from '../lib/n8nApi';
import { WorkflowItem, WorkflowItemData } from './WorkflowItem';

interface TaskSpecificWorkflowsProps {
  taskText: string;
  lang?: 'de' | 'en';
}

export const TaskSpecificWorkflows: React.FC<TaskSpecificWorkflowsProps> = ({
  taskText,
  lang = 'de'
}) => {
  const [workflows, setWorkflows] = useState<WorkflowItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItemData | null>(null);

  useEffect(() => {
    if (taskText) {
      fetchWorkflows();
    }
  }, [taskText]);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use n8n API client to fetch workflows
      const n8nWorkflows = await n8nApiClient.searchWorkflowsByTask(taskText, 3);
      setWorkflows(n8nWorkflows);
    } catch (err) {
      console.error('Error loading workflows:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalROI = (workflow: WorkflowItemData) => {
    const monthlyTimeSavings = workflow.estimatedTime * 4;
    const hourlyRate = workflow.category === 'finance' ? 80 : workflow.category === 'marketing' ? 70 : 60;
    const monthlyCostSavings = monthlyTimeSavings * hourlyRate;
    return monthlyCostSavings + workflow.estimatedCost;
  };

  const handleDownloadWorkflow = (workflow: WorkflowItemData) => {
    // Create workflow JSON for download
    const workflowData = {
      id: workflow.id,
      title: workflow.title,
      description: workflow.description,
      category: workflow.category,
      difficulty: workflow.difficulty,
      estimatedTime: workflow.estimatedTime,
      estimatedCost: workflow.estimatedCost,
      tools: workflow.tools,
      tags: workflow.tags,
      nodes: workflow.nodes,
      connections: workflow.connections,
      author: workflow.author,
      url: workflow.url,
      jsonUrl: workflow.jsonUrl
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
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Workflow className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">
            {lang === 'de' ? 'Passende Workflow-Templates' : 'Matching Workflow Templates'}
          </h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Workflow className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">
            {lang === 'de' ? 'Passende Workflow-Templates' : 'Matching Workflow Templates'}
          </h3>
        </div>
        <div className="text-center py-4 text-xs text-muted-foreground">
          {lang === 'de' ? 'Fehler beim Laden der Workflows' : 'Error loading workflows'}
        </div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Workflow className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">
            {lang === 'de' ? 'Passende Workflow-Templates' : 'Matching Workflow Templates'}
          </h3>
        </div>
        <div className="text-center py-4 text-xs text-muted-foreground">
          {lang === 'de' ? 'Keine passenden Workflows gefunden' : 'No matching workflows found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Workflow className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium">
          {lang === 'de' ? 'Passende Workflow-Templates' : 'Matching Workflow Templates'}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {workflows.length}
        </Badge>
      </div>

            <div className="space-y-3">
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
                  {selectedWorkflow.title}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">
                    {lang === 'de' ? 'Übersicht' : 'Overview'}
                  </TabsTrigger>
                  <TabsTrigger value="details">
                    {lang === 'de' ? 'Details' : 'Details'}
                  </TabsTrigger>
                  <TabsTrigger value="implementation">
                    {lang === 'de' ? 'Implementierung' : 'Implementation'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{lang === 'de' ? 'Beschreibung' : 'Description'}</h4>
                      <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{lang === 'de' ? 'Kategorie' : 'Category'}</h4>
                      <Badge variant="outline">{selectedWorkflow.category}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{selectedWorkflow.estimatedTime}h</div>
                      <div className="text-sm text-muted-foreground">
                        {lang === 'de' ? 'Zeitersparnis' : 'Time Savings'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">€{calculateTotalROI(selectedWorkflow)}</div>
                      <div className="text-sm text-muted-foreground">
                        {lang === 'de' ? 'Monatliche Einsparung' : 'Monthly Savings'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{selectedWorkflow.rating}</div>
                      <div className="text-sm text-muted-foreground">
                        {lang === 'de' ? 'Bewertung' : 'Rating'}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{lang === 'de' ? 'Tools' : 'Tools'}</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkflow.tools.map((tool) => (
                          <Badge key={tool} variant="secondary">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{lang === 'de' ? 'Tags' : 'Tags'}</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkflow.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{lang === 'de' ? 'Autor' : 'Author'}</h4>
                      <p className="text-sm text-muted-foreground">{selectedWorkflow.author}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{lang === 'de' ? 'Downloads' : 'Downloads'}</h4>
                      <p className="text-sm text-muted-foreground">{selectedWorkflow.downloads.toLocaleString()}</p>
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

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedWorkflow.url, '_blank')}
                      >
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
