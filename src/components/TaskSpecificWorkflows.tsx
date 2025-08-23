import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  HelpCircle,
  Send,
  Check
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
  const [setupForm, setSetupForm] = useState({
    name: '',
    email: '',
    company: '',
    requirements: ''
  });
  const [showSetupForm, setShowSetupForm] = useState(false);


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
                    {lang === 'de' ? 'Übersicht' : 'Overview'}
                  </TabsTrigger>
                  <TabsTrigger value="implementation">
                    {lang === 'de' ? 'Implementierung' : 'Implementation'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Key Metrics - Top Row */}
                  <div className="flex items-center justify-between">
                    <div className="text-center p-3 flex-1 border-r border-gray-200">
                      <div className="flex items-center justify-center mb-2">
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">{selectedWorkflow.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Kategorie' : 'Category'}
                      </div>
                    </div>
                    <div className="text-center p-3 flex-1 border-r border-gray-200">
                      <div className="flex items-center justify-center mb-2">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">{selectedWorkflow.estimatedTime}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Zeitersparnis' : 'Time Savings'}
                      </div>
                    </div>
                    <div className="text-center p-3 flex-1 border-r border-gray-200">
                      <div className="flex items-center justify-center mb-2">
                        <PiggyBank className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">€{calculateTotalROI(selectedWorkflow)}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Monatliche Einsparung' : 'Monthly Savings'}
                      </div>
                    </div>
                    <div className="text-center p-3 flex-1 border-r border-gray-200">
                      <div className="flex items-center justify-center mb-2">
                        <Network className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">{selectedWorkflow.nodes}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Komplexität' : 'Complexity'}
                      </div>
                    </div>
                    <div className="text-center p-3 flex-1">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-bold">{selectedWorkflow.downloads.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {lang === 'de' ? 'Downloads' : 'Downloads'}
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
                    {/* Self-Setup Section */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">{lang === 'de' ? 'Selbst-Einrichtung' : 'Self-Setup'}</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>{lang === 'de' ? 'Workflow in n8n importieren' : 'Import workflow into n8n'}</li>
                        <li>{lang === 'de' ? 'API-Keys und Verbindungen konfigurieren' : 'Configure API keys and connections'}</li>
                        <li>{lang === 'de' ? 'Workflow testen und anpassen' : 'Test and customize workflow'}</li>
                        <li>{lang === 'de' ? 'Automatisierung aktivieren' : 'Activate automation'}</li>
                      </ol>
                    </div>

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

                                        {/* Compact Setup Request Section */}
                    <div className="p-6 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold flex items-center gap-3 text-purple-900">
                          <Zap className="w-5 h-5 text-purple-600" />
                          {lang === 'de' ? 'Professionelle Einrichtung' : 'Professional Setup'}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-200 text-purple-700 hover:bg-purple-100 px-4"
                          onClick={() => setShowSetupForm(!showSetupForm)}
                        >
                          {showSetupForm ? (lang === 'de' ? 'Abbrechen' : 'Cancel') : (lang === 'de' ? 'Anfragen' : 'Request')}
                        </Button>
                      </div>
                      
                      {!showSetupForm && (
                        <div className="space-y-4">
                          <p className="text-sm text-purple-700 leading-relaxed">
                            {lang === 'de' 
                              ? 'Lassen Sie uns diese Automatisierung für Sie einrichten.'
                              : 'Let us set up this automation for you.'
                            }
                          </p>
                          
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            <div className="flex flex-col items-center text-center">
                              <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                                <Timer className="w-5 h-5 text-purple-600" />
                              </div>
                              <span className="text-xs font-medium text-gray-700">24h Setup</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                              <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                                <ThumbsUp className="w-5 h-5 text-purple-600" />
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {lang === 'de' ? 'Funktionsgarantie' : 'Functionality Guarantee'}
                              </span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                              <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                                <DollarSign className="w-5 h-5 text-purple-600" />
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {lang === 'de' ? 'Geld zurück' : 'Money Back'}
                              </span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                              <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                                <Check className="w-5 h-5 text-purple-600" />
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {lang === 'de' ? 'Zahlung bei Erfolg' : 'Payment on Success'}
                              </span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                              <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                                <Users className="w-5 h-5 text-purple-600" />
                              </div>
                              <span className="text-xs font-medium text-gray-700">30d Support</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                              <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                                <Zap className="w-5 h-5 text-purple-600" />
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {lang === 'de' ? 'Sofort startklar' : 'Ready to Go'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {showSetupForm && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              placeholder={lang === 'de' ? 'Name' : 'Name'}
                              value={setupForm.name}
                              onChange={(e) => setSetupForm({...setupForm, name: e.target.value})}
                            />
                            <Input
                              placeholder={lang === 'de' ? 'E-Mail' : 'Email'}
                              type="email"
                              value={setupForm.email}
                              onChange={(e) => setSetupForm({...setupForm, email: e.target.value})}
                            />
                          </div>
                          <Input
                            placeholder={lang === 'de' ? 'Firma (optional)' : 'Company (optional)'}
                            value={setupForm.company}
                            onChange={(e) => setSetupForm({...setupForm, company: e.target.value})}
                          />
                          <Textarea
                            placeholder={lang === 'de' ? 'Ihre Anforderungen und Kontext...' : 'Your requirements and context...'}
                            value={setupForm.requirements}
                            onChange={(e) => setSetupForm({...setupForm, requirements: e.target.value})}
                            rows={3}
                          />
                          <Button 
                            className="w-full"
                            onClick={() => {
                              const subject = encodeURIComponent(`${lang === 'de' ? 'Einrichtungsanfrage' : 'Setup Request'}: ${selectedWorkflow.name}`);
                              const body = encodeURIComponent(`${lang === 'de' 
                                ? `Hallo,\n\nich interessiere mich für die professionelle Einrichtung des Workflows "${selectedWorkflow.name}".\n\nMeine Details:\n- Name: ${setupForm.name}\n- E-Mail: ${setupForm.email}\n- Firma: ${setupForm.company || 'Nicht angegeben'}\n\nWorkflow-Details:\n- Name: ${selectedWorkflow.name}\n- Beschreibung: ${selectedWorkflow.description}\n- Kategorie: ${selectedWorkflow.category}\n- Nodes: ${selectedWorkflow.nodes}\n- Verbindungen: ${selectedWorkflow.connections}\n- Bewertung: ${selectedWorkflow.rating.toFixed(1)} (${selectedWorkflow.downloads.toLocaleString()} Downloads)\n- Integrationen: ${selectedWorkflow.integrations.join(', ')}\n\nMeine Anforderungen:\n${setupForm.requirements}\n\nBitte kontaktieren Sie mich für weitere Details.\n\nMit freundlichen Grüßen\n${setupForm.name}`
                                : `Hello,\n\nI am interested in the professional setup of the workflow "${selectedWorkflow.name}".\n\nMy details:\n- Name: ${setupForm.name}\n- Email: ${setupForm.email}\n- Company: ${setupForm.company || 'Not specified'}\n\nWorkflow details:\n- Name: ${selectedWorkflow.name}\n- Description: ${selectedWorkflow.description}\n- Category: ${selectedWorkflow.category}\n- Nodes: ${selectedWorkflow.nodes}\n- Connections: ${selectedWorkflow.connections}\n- Rating: ${selectedWorkflow.rating.toFixed(1)} (${selectedWorkflow.downloads.toLocaleString()} downloads)\n- Integrations: ${selectedWorkflow.integrations.join(', ')}\n\nMy requirements:\n${setupForm.requirements}\n\nPlease contact me for further details.\n\nBest regards\n${setupForm.name}`
                              }`);
                              window.open(`mailto:setup@prom8eus.com?subject=${subject}&body=${body}`, '_blank');
                              setShowSetupForm(false);
                              setSetupForm({name: '', email: '', company: '', requirements: ''});
                            }}
                            disabled={!setupForm.name || !setupForm.email}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {lang === 'de' ? 'Anfrage senden' : 'Send Request'}
                          </Button>
                        </div>
                      )}
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
