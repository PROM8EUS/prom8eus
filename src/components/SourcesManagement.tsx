import React, { useState, useEffect } from 'react';
import { AI_TOOLS } from '@/lib/catalog/aiTools';
import { WorkflowBrowser } from './WorkflowBrowser';
import { getGitHubConfig } from '@/lib/config';
import { workflowIndexer } from '@/lib/workflowIndexer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIconCard, AppIcon } from '@/components/AppIcon';
import { getToolDescription, getToolFeatures } from '@/lib/catalog/aiTools';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Database, 
  Bot, 
  Workflow, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Globe,
  Github,
  BookOpen,
  Search
} from 'lucide-react';

interface WorkflowSource {
  id: string;
  name: string;
  type: 'github' | 'api' | 'manual';
  url: string;
  description: string;
  category: string;
  workflowCount: number;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'error';
}

interface AIAgentSource {
  id: string;
  name: string;
  type: 'catalog' | 'api' | 'manual';
  url?: string;
  description: string;
  category: string;
  agentCount: number;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'error';
}

interface SourcesManagementProps {
  lang?: 'de' | 'en';
}

export default function SourcesManagement({ lang = 'de' }: SourcesManagementProps) {
  const [workflowSources, setWorkflowSources] = useState<WorkflowSource[]>([]);
  const [aiAgentSources, setAIAgentSources] = useState<AIAgentSource[]>([]);
  const [aiTools, setAITools] = useState(AI_TOOLS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [selectedWorkflowSource, setSelectedWorkflowSource] = useState<WorkflowSource | null>(null);
  const [githubTokenStatus, setGithubTokenStatus] = useState<'configured' | 'missing' | 'invalid'>('missing');
  const [workflowStats, setWorkflowStats] = useState<any>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState<string>('');

  useEffect(() => {
    loadSources();
    checkGitHubTokenStatus();
    loadWorkflowStats();
  }, []);

  // Convert source name to cache key
  const getSourceKey = (sourceName: string) => {
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

  const loadWorkflowStats = async (source?: string) => {
    try {
      const stats = await workflowIndexer.getStats(source);
      setWorkflowStats(stats);
    } catch (error) {
      console.error('Error loading workflow stats:', error);
    }
  };

  const checkGitHubTokenStatus = () => {
    const githubConfig = getGitHubConfig();
    if (githubConfig.token && (githubConfig.token.startsWith('ghp_') || githubConfig.token.startsWith('github_pat_'))) {
      setGithubTokenStatus('configured');
    } else if (githubConfig.token) {
      setGithubTokenStatus('invalid');
    } else {
      setGithubTokenStatus('missing');
    }
  };

  const loadSources = async () => {
    setIsLoading(true);
    
    try {
      // Load real workflow sources
      const workflowSourcesData: WorkflowSource[] = [
        {
          id: '1',
          name: 'n8n Community Workflows',
          type: 'github',
          url: 'https://github.com/Zie619/n8n-workflows',
          description: 'Community-driven n8n workflow collection with ready-to-use workflows for automation',
          category: 'General',
          workflowCount: 0, // Will be updated with real count
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        },
        {
          id: '2',
          name: 'n8n.io Official Templates',
          type: 'api',
          url: 'https://n8n.io/workflows/',
          description: 'Official n8n workflow templates and examples (5,386+ templates)',
          category: 'Official',
          workflowCount: 5386,
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        },
        {
          id: '3',
          name: 'n8n Free Templates (AI-Enhanced)',
          type: 'github',
          url: 'https://github.com/wassupjay/n8n-free-templates',
          description: '200+ plug-and-play n8n workflows that fuse classic automation with AI stack—vector DBs, embeddings, and LLMs',
          category: 'AI-Enhanced',
          workflowCount: 200,
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        }
      ];

      // Use estimated counts for now (GitHub API requires valid token)
      workflowSourcesData[0].workflowCount = 2053;
      workflowSourcesData[1].workflowCount = 5386;
      workflowSourcesData[2].workflowCount = 200;

      setWorkflowSources(workflowSourcesData);

      // Load real AI agent sources (Repositories of AI Agents)
      const aiAgentSourcesData: AIAgentSource[] = [
        {
          id: '1',
          name: 'AutoGPT Repository',
          type: 'catalog',
          url: 'https://github.com/Significant-Gravitas/AutoGPT',
          description: 'AutoGPT - An experimental open-source attempt to make GPT-4 fully autonomous',
          category: 'General AI Agents',
          agentCount: 0, // Framework, not pre-built agents
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        },
        {
          id: '2',
          name: 'LangChain Agents',
          type: 'catalog',
          url: 'https://github.com/langchain-ai/langchain',
          description: 'LangChain - Building applications with LLMs through composability',
          category: 'AI Framework',
          agentCount: 0, // Framework with examples, not pre-built agents
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        },
        {
          id: '3',
          name: 'CrewAI Framework',
          type: 'catalog',
          url: 'https://github.com/joaomdmoura/crewAI',
          description: 'CrewAI - Framework for orchestrating role-playing, autonomous AI agents',
          category: 'Multi-Agent Systems',
          agentCount: 0, // Framework with examples, not pre-built agents
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        },
        {
          id: '4',
          name: 'OpenAI Assistants API',
          type: 'api',
          url: 'https://platform.openai.com/docs/assistants/overview',
          description: 'OpenAI Assistants API - Build AI assistants that can use tools and access knowledge',
          category: 'AI Assistants',
          agentCount: 0, // API to create assistants, not pre-built agents
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        },
        {
          id: '5',
          name: 'Microsoft Autogen',
          type: 'catalog',
          url: 'https://github.com/microsoft/autogen',
          description: 'AutoGen - A framework that enables development of LLM applications using multiple agents',
          category: 'Multi-Agent Systems',
          agentCount: 0, // Framework with examples, not pre-built agents
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        },
        {
          id: '6',
          name: 'Hugging Face Spaces',
          type: 'catalog',
          url: 'https://huggingface.co/spaces',
          description: 'Hugging Face Spaces - Community-driven AI agents and applications',
          category: 'Community Agents',
          agentCount: 0, // Community platform, exact count varies
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        },
        {
          id: '7',
          name: 'AgentGPT',
          type: 'catalog',
          url: 'https://github.com/reworkd/AgentGPT',
          description: 'AgentGPT - Assemble, configure, and deploy autonomous AI agents in your browser',
          category: 'Web-based Agents',
          agentCount: 0, // Web interface to create agents, not pre-built agents
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        },
        {
          id: '8',
          name: 'SuperAGI',
          type: 'catalog',
          url: 'https://github.com/TransformerOptimus/SuperAGI',
          description: 'SuperAGI - A dev-first open source autonomous AI agent framework',
          category: 'Autonomous Agents',
          agentCount: 0, // Framework with examples, not pre-built agents
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'active'
        }
      ];

      setAIAgentSources(aiAgentSourcesData);

      // Load AI Tools (general tools for recommendations)
      setAITools(AI_TOOLS);

    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'github':
        return <Github className="w-5 h-5 text-gray-600" />;
      case 'api':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'catalog':
        return <BookOpen className="w-5 h-5 text-green-600" />;
      default:
        return <Database className="w-5 h-5 text-gray-600" />;
    }
  };



  const handleToolClick = (tool: any) => {
    setSelectedTool(tool);
    setIsToolModalOpen(true);
  };

  const handleWorkflowSourceClick = async (source: WorkflowSource) => {
    setSelectedWorkflowSource(source);
    // Load workflow stats for the specific source
    const sourceKey = getSourceKey(source.name);
    await loadWorkflowStats(sourceKey);
  };

  const handleBackToSources = () => {
    setSelectedWorkflowSource(null);
    // Load global workflow stats when going back to sources
    loadWorkflowStats();
  };

  const handleIndexWorkflows = async () => {
    setIsIndexing(true);
    setIndexingProgress('Starting workflow indexing...');
    
    try {
      // Get Supabase URL from config
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/index-workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          sources: ['github', 'n8n.io', 'ai-enhanced'],
          batchSize: 800
        })
      });

      if (!response.ok) {
        throw new Error(`Indexing failed: ${response.status}`);
      }

      const result = await response.json();
      setIndexingProgress(`Indexed ${result.updated} features and ${result.embedded} embeddings`);
      
      // Reload stats after indexing
      await loadWorkflowStats();
      
    } catch (error) {
      console.error('Error indexing workflows:', error);
      setIndexingProgress(`Error: ${(error as Error).message}`);
    } finally {
      setIsIndexing(false);
      // Clear progress message after 3 seconds
      setTimeout(() => setIndexingProgress(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>{lang === 'de' ? 'Lade Quellen...' : 'Loading sources...'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {lang === 'de' ? 'Quellen-Management' : 'Sources Management'}
          </h2>
          <p className="text-gray-600">
            {lang === 'de' 
              ? 'Verwalten Sie Workflow- und AI-Agent-Quellen' 
              : 'Manage workflow and AI agent sources'
            }
          </p>
          
          {/* GitHub Token Status */}
          <div className="mt-2 flex items-center gap-2">
            <Github className="w-4 h-4" />
            <span className="text-sm text-gray-600">
              GitHub Token: 
            </span>
            <StatusBadge 
              status={githubTokenStatus === 'configured' ? 'active' : 
                     githubTokenStatus === 'invalid' ? 'error' : 'inactive'}
            />
          </div>
          
          {/* Indexing Progress */}
          {indexingProgress && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              {indexingProgress}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleIndexWorkflows}
            disabled={isIndexing}
            variant="outline"
          >
            {isIndexing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            {lang === 'de' ? 'Workflows indizieren' : 'Index Workflows'}
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {lang === 'de' ? 'Quelle hinzufügen' : 'Add Source'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            {lang === 'de' ? 'Workflows' : 'Workflows'}
            <Badge variant="secondary">{workflowSources.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ai-agents" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            {lang === 'de' ? 'AI-Agent-APIs' : 'AI Agent APIs'}
            <Badge variant="secondary">{aiAgentSources.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ai-tools" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            {lang === 'de' ? 'AI-Tools-Katalog' : 'AI Tools Catalog'}
            <Badge variant="secondary">{aiTools.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {selectedWorkflowSource ? (
            <div className="space-y-4">
              {/* Back Button and Header with Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={handleBackToSources}>
                    ← {lang === 'de' ? 'Zurück zu Quellen' : 'Back to Sources'}
                  </Button>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedWorkflowSource.name}</h3>
                    <p className="text-sm text-gray-600">{selectedWorkflowSource.description}</p>
                  </div>
                </div>
                
                {/* Workflow Stats */}
                {workflowStats && (
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>Total: <span className="font-medium text-gray-900">{workflowStats.total.toLocaleString()}</span></span>
                    <span>Active: <span className="font-medium text-gray-900">{workflowStats.active.toLocaleString()}</span></span>
                    <span>Integrations: <span className="font-medium text-gray-900">{workflowStats.uniqueIntegrations}</span></span>
                    <span>Nodes: <span className="font-medium text-gray-900">{workflowStats.totalNodes.toLocaleString()}</span></span>
                  </div>
                )}
                
                {/* Index Button for Individual Source */}
                <Button 
                  onClick={handleIndexWorkflows}
                  disabled={isIndexing}
                  variant="outline"
                  size="sm"
                >
                  {isIndexing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  {lang === 'de' ? 'Indizieren' : 'Index'}
                </Button>
              </div>
              
              {/* Workflow Browser */}
              <WorkflowBrowser sourceFilter={selectedWorkflowSource.name} isAdmin={true} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflowSources.map((source) => (
                <Card key={source.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleWorkflowSourceClick(source)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(source.type)}
                        <div>
                          <CardTitle className="text-lg">{source.name}</CardTitle>
                          <p className="text-sm text-gray-600">{source.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={source.status} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-500">Type</Label>
                        <p className="font-medium capitalize">{source.type}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Category</Label>
                        <p className="font-medium">{source.category}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Workflows</Label>
                        <p className="font-medium">{source.workflowCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Last Updated</Label>
                        <p className="font-medium">{source.lastUpdated}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          View Source
                        </a>
                      </Button>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>


        <TabsContent value="ai-agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiAgentSources.map((source) => (
              <Card key={source.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(source.type)}
                      <div>
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                        <p className="text-sm text-gray-600">{source.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={source.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-500">Type</Label>
                      <p className="font-medium capitalize">{source.type}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Category</Label>
                      <p className="font-medium">{source.category}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Agents</Label>
                      <p className="font-medium">{source.agentCount}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Last Updated</Label>
                      <p className="font-medium">{source.lastUpdated}</p>
                    </div>
                  </div>
                  {source.url && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          View Source
                        </a>
                      </Button>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTools.map((tool) => (
              <AppIconCard
                key={tool.id}
                tool={tool}
                onClick={() => handleToolClick(tool)}
                className="cursor-pointer hover:shadow-md transition-shadow"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tool Details Modal */}
      <Dialog open={isToolModalOpen} onOpenChange={setIsToolModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <AppIcon tool={selectedTool} size={32} />
              {selectedTool?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTool && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{getToolDescription(selectedTool)}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {getToolFeatures(selectedTool).map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Category</h4>
                <Badge variant="outline">{selectedTool.category}</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
