import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  RefreshCw,
  Database,
  Bot,
  Workflow,
  AlertTriangle,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
  Globe,
  Github
} from 'lucide-react';

import {
  workflowIndexer,
  WorkflowIndex,
  AgentIndex,
  isAgentIndex
} from '@/lib/workflowIndexer';
import { CacheStats } from '@/lib/workflowIndexer';
import SolutionCard, { SolutionData } from './SolutionCard';
import SolutionDetailModal from './SolutionDetailModal';
import { Solution, SolutionCategory } from '@/types/solutions';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useToast } from '@/hooks/use-toast';

type WorkflowSourceType = 'github' | 'api' | 'manual';

interface WorkflowSource {
  id: string;
  name: string;
  type: WorkflowSourceType;
  url?: string;
  description: string;
  category: string;
  workflowCount: number;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'error';
  tags?: string[];
}

interface AgentSource {
  id: string;
  name: string;
  type: 'catalog' | 'api' | 'manual';
  url?: string;
  description: string;
  category: string;
  agentCount: number;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'error';
  tags?: string[];
}

type ManagedSource =
  | { kind: 'workflow'; source: WorkflowSource }
  | { kind: 'agent'; source: AgentSource };

interface SourceMetrics {
  id: string;
  kind: 'workflow' | 'agent';
  successRate: number;
  errorCount: number;
  entryCount: number;
  lastUpdated: string;
}

interface SourceEntriesState {
  items: SolutionData[];
  raw: Array<WorkflowIndex | AgentIndex>;
  page: number;
  pageSize: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

interface EnhancedSourcesManagementProps {
  lang?: 'de' | 'en';
}

const DEFAULT_WORKFLOW_SOURCES: WorkflowSource[] = [
  {
    id: 'github',
    name: 'n8n Community Workflows',
    type: 'github',
    url: 'https://github.com/Zie619/n8n-workflows',
    description: 'Community-driven n8n workflow collection with ready-to-use workflows for automation.',
    category: 'Community',
    workflowCount: 2056,
    lastUpdated: '2025-09-15',
    status: 'active'
  },
  {
    id: 'n8n.io',
    name: 'n8n Official Templates',
    type: 'api',
    url: 'https://n8n.io/workflows/',
    description: 'Official n8n workflow templates and examples curated by the n8n team.',
    category: 'Official',
    workflowCount: 0,
    lastUpdated: '2025-09-15',
    status: 'active'
  },
  {
    id: 'ai-enhanced',
    name: 'n8n Free Templates (AI-Enhanced)',
    type: 'github',
    url: 'https://github.com/wassupjay/n8n-free-templates',
    description: 'Plug-and-play n8n workflows combining classic automation with AI stack.',
    category: 'AI Enhanced',
    workflowCount: 150,
    lastUpdated: '2025-09-15',
    status: 'active'
  },
  {
    id: 'awesome-n8n-templates',
    name: 'Awesome n8n Templates',
    type: 'github',
    url: 'https://github.com/enescingoz/awesome-n8n-templates',
    description: 'Curated community n8n templates across many categories.',
    category: 'Community',
    workflowCount: 0,
    lastUpdated: new Date().toISOString().split('T')[0],
    status: 'active'
  }
];

const DEFAULT_AGENT_SOURCES: AgentSource[] = [
  {
    id: 'crewai',
    name: 'CrewAI Examples',
    type: 'catalog',
    url: 'https://github.com/joaomdmoura/crewAI',
    description: 'CrewAI - Framework for orchestrating role-playing, autonomous AI agents.',
    category: 'Multi-Agent Systems',
    agentCount: 0,
    lastUpdated: new Date().toISOString().split('T')[0],
    status: 'active'
  },
  {
    id: 'huggingface',
    name: 'HuggingFace Spaces',
    type: 'catalog',
    url: 'https://huggingface.co/spaces',
    description: 'Community-driven AI agents and applications hosted on HuggingFace Spaces.',
    category: 'Community Agents',
    agentCount: 0,
    lastUpdated: new Date().toISOString().split('T')[0],
    status: 'active'
  },
  {
    id: 'custom-agents',
    name: 'Custom Agents',
    type: 'manual',
    description: 'Internal or experimental agents managed directly inside the platform.',
    category: 'Internal',
    agentCount: 0,
    lastUpdated: new Date().toISOString().split('T')[0],
    status: 'inactive'
  }
];

const WORKFLOW_OVERRIDES_KEY = 'workflow_source_overrides';
const AGENT_OVERRIDES_KEY = 'agent_source_overrides';

const humanizeTitle = (raw?: string) => {
  if (!raw) return 'Untitled Workflow';
  const cleaned = raw
    .replace(/\.json$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Untitled Workflow';
  const specialUpper = new Set(['ai', 'llm', 'api', 'http', 'https', 'sql', 'crm', 'erp', 'saas', 'n8n', 'gpt']);
  return cleaned
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === 'nn') return 'n8n';
      if (specialUpper.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
};

const normalizeCategory = (category?: string): SolutionCategory => {
  if (!category) return 'General Business';
  const lower = category.toLowerCase();
  const mapping: Record<string, SolutionCategory> = {
    hr: 'HR & Recruitment',
    recruitment: 'HR & Recruitment',
    finance: 'Finance & Accounting',
    accounting: 'Finance & Accounting',
    marketing: 'Marketing & Sales',
    sales: 'Marketing & Sales',
    support: 'Customer Support',
    customer: 'Customer Support',
    data: 'Data Analysis',
    analysis: 'Data Analysis',
    content: 'Content Creation',
    project: 'Project Management',
    development: 'Development & DevOps',
    devops: 'Development & DevOps',
    research: 'Research & Analysis',
    communication: 'Communication',
    general: 'General Business'
  };

  const key = Object.keys(mapping).find((k) => lower.includes(k));
  return key ? mapping[key] : 'General Business';
};

const toDate = (value?: string | number | null) => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value);
};

const computeAutomationPotential = (
  nodeCount?: number,
  integrations: string[] = [],
  complexity?: string
) => {
  const base = (nodeCount || 5) * 4 + integrations.length * 5;
  const complexityBoost = complexity === 'High' ? 20 : complexity === 'Medium' ? 10 : 5;
  return Math.max(50, Math.min(95, base + complexityBoost));
};

const workflowToSolutionData = (workflow: WorkflowIndex): SolutionData => ({
  id: workflow.id,
  name: humanizeTitle(workflow.title || workflow.filename || workflow.id),
  filename: workflow.filename,
  description: workflow.summary || 'No description available.',
  category: workflow.category || 'General',
  priority: workflow.complexity === 'High' ? 'High' : workflow.complexity === 'Medium' ? 'Medium' : 'Low',
  type: 'workflow',
  triggerType: workflow.triggerType,
  complexity: workflow.complexity,
  integrations: workflow.integrations,
  tags: workflow.tags,
  active: workflow.active,
  lastUpdated: workflow.analyzedAt,
  authorName: workflow.authorName || workflow.authorUsername || 'Community',
  authorAvatarUrl: workflow.authorAvatar,
  authorEmail: workflow.authorEmail,
  authorVerified: workflow.authorVerified,
  pricing: 'Free'
});

const agentToSolutionData = (agent: AgentIndex): SolutionData => ({
  id: agent.id,
  name: agent.title,
  description: agent.summary || 'No description available.',
  category: agent.category || 'General Business',
  priority: agent.difficulty === 'Advanced' ? 'High' : agent.difficulty === 'Intermediate' ? 'Medium' : 'Low',
  type: 'ai-agent',
  capabilities: agent.capabilities,
  model: agent.model,
  provider: agent.provider,
  tags: agent.tags,
  pricing: agent.pricing,
  authorName: agent.authorName || agent.authorUsername || 'Community',
  authorAvatarUrl: agent.authorAvatar,
  authorVerified: agent.authorVerified,
  lastUpdated: agent.lastModified,
  active: agent.status === 'active'
});

const workflowToSolution = (workflow: WorkflowIndex): Solution => {
  const created = toDate(workflow.analyzedAt);
  const automationPotential = computeAutomationPotential(
    workflow.nodeCount,
    workflow.integrations,
    workflow.complexity
  );
  const title = humanizeTitle(workflow.title || workflow.filename || workflow.id);

  return {
    id: workflow.id,
    name: title,
    description: workflow.summary || 'No description available.',
    type: 'workflow',
    category: normalizeCategory(workflow.category),
    subcategories: [workflow.category || 'general'],
    difficulty:
      workflow.complexity === 'High'
        ? 'Advanced'
        : workflow.complexity === 'Medium'
          ? 'Intermediate'
          : 'Beginner',
    setupTime:
      workflow.complexity === 'High'
        ? 'Long'
        : workflow.complexity === 'Medium'
          ? 'Medium'
          : 'Quick',
    deployment: 'Cloud',
    status: workflow.active ? 'Active' : 'Inactive',
    tags: workflow.tags || [],
    automationPotential,
    estimatedROI: `${120 + (workflow.integrations?.length || 0) * 10}%`,
    timeToValue:
      workflow.complexity === 'High'
        ? '2-4 weeks'
        : workflow.complexity === 'Medium'
          ? '1-2 weeks'
          : '3-7 days',
    implementationPriority:
      workflow.complexity === 'High'
        ? 'High'
        : workflow.complexity === 'Medium'
          ? 'Medium'
          : 'Low',
    createdAt: created,
    updatedAt: created,
    version: '1.0.0',
    author: workflow.authorName || workflow.authorUsername || 'Community',
    authorUsername: workflow.authorUsername,
    authorAvatarUrl: workflow.authorAvatar,
    authorEmail: workflow.authorEmail,
    documentationUrl: workflow.link,
    demoUrl: workflow.link,
    githubUrl: workflow.link && workflow.link.includes('github') ? workflow.link : undefined,
    pricing: 'Free',
    requirements: [
      {
        category: 'Environment',
        items: ['n8n Cloud or Self-Hosted instance'],
        importance: 'Required'
      }
    ],
    useCases: [
      {
        scenario: 'Primary workflow scenario',
        description: workflow.summary || 'Automated workflow generated from source catalog.',
        automationPotential,
        implementationEffort:
          workflow.complexity === 'High'
            ? 'High'
            : workflow.complexity === 'Medium'
              ? 'Medium'
              : 'Low',
        expectedOutcome: 'Improved automation efficiency',
        prerequisites: ['Configured integrations'],
        estimatedTimeSavings: workflow.complexity === 'High' ? '10+ hours/week' : '5+ hours/week',
        businessImpact: workflow.complexity === 'High' ? 'High' : 'Medium'
      }
    ],
    integrations: (workflow.integrations || []).map((integration) => ({
      platform: integration,
      type: 'API',
      description: `Integration with ${integration}`,
      setupComplexity: 'Medium',
      apiKeyRequired: true
    })),
    metrics: {
      usageCount: Math.floor(Math.random() * 500) + 50,
      successRate: 98,
      averageExecutionTime: workflow.nodeCount ? workflow.nodeCount * 10 : 60,
      errorRate: 2,
      userRating: 4.5,
      reviewCount: 12,
      lastUsed: new Date(),
      performanceScore: 85
    },
    workflow: {
      id: workflow.id,
      name: title,
      active: workflow.active ?? true,
      nodes: [],
      connections: {},
      settings: {},
      staticData: {},
      meta: {},
      pinData: {},
      versionId: '1',
      triggerCount: 1,
      tags: workflow.tags
    },
    workflowMetadata: {
      nodeCount: workflow.nodeCount || 0,
      triggerType: workflow.triggerType || 'Manual',
      executionTime: '—',
      complexity:
        workflow.complexity === 'High'
          ? 'Complex'
          : workflow.complexity === 'Low'
            ? 'Simple'
            : 'Moderate',
      dependencies: workflow.integrations || [],
      estimatedExecutionTime: '—'
    }
  };
};

const agentToSolution = (agent: AgentIndex): Solution => {
  const created = toDate(agent.lastModified);
  const automationPotential = agent.automationPotential || 75;

  return {
    id: agent.id,
    name: agent.title,
    description: agent.summary || 'AI agent from catalog.',
    type: 'agent',
    category: normalizeCategory(agent.category),
    subcategories: agent.tags || [],
    difficulty: agent.difficulty || 'Intermediate',
    setupTime: agent.setupTime || 'Medium',
    deployment: agent.deployment || 'Cloud',
    status: agent.status === 'inactive' ? 'Inactive' : 'Active',
    tags: agent.tags || [],
    automationPotential,
    estimatedROI: '150-250%',
    timeToValue:
      agent.setupTime === 'Long'
        ? '4-6 weeks'
        : agent.setupTime === 'Medium'
          ? '2-4 weeks'
          : '1-2 weeks',
    implementationPriority: 'Medium',
    createdAt: created,
    updatedAt: created,
    version: '1.0.0',
    author: agent.authorName || agent.authorUsername || 'Community',
    authorUsername: agent.authorUsername,
    authorAvatarUrl: agent.authorAvatar,
    documentationUrl: agent.documentationUrl,
    demoUrl: agent.demoUrl,
    githubUrl: agent.githubUrl,
    pricing: agent.pricing,
    requirements: [
      {
        category: 'Access',
        items: agent.requirements || ['API credentials'],
        importance: 'Required'
      }
    ],
    useCases: (agent.useCases || []).map((useCase) => ({
      scenario: useCase,
      description: useCase,
      automationPotential,
      implementationEffort: 'Medium',
      expectedOutcome: 'Improved agent-driven automation',
      prerequisites: agent.requirements || ['API credentials'],
      estimatedTimeSavings: '4+ hours/week',
      businessImpact: 'Medium'
    })),
    integrations: (agent.capabilities || []).map((capability) => ({
      platform: capability,
      type: 'API',
      description: `Capability: ${capability}`,
      setupComplexity: 'Medium',
      apiKeyRequired: true
    })),
    metrics: {
      usageCount: Math.floor(Math.random() * 200) + 30,
      successRate: 92,
      averageExecutionTime: 45,
      errorRate: 5,
      userRating: 4.2,
      reviewCount: 8,
      lastUsed: new Date(),
      performanceScore: 80
    },
    agent: {
      id: agent.id,
      name: agent.title,
      description: agent.summary || 'AI agent from catalog.',
      category: normalizeCategory(agent.category) as SolutionCategory,
      subcategories: agent.tags || [],
      difficulty: agent.difficulty || 'Intermediate',
      setupTime: agent.setupTime || 'Medium',
      requirements: agent.requirements || ['API access'],
      deployment: agent.deployment || 'Cloud',
      githubUrl: agent.githubUrl,
      demoUrl: agent.demoUrl,
      documentationUrl: agent.documentationUrl,
      tags: agent.tags || [],
      automationPotential,
      useCases: agent.useCases || []
    },
    agentMetadata: {
      model: agent.model || 'Unknown',
      apiProvider: agent.provider || 'Unknown',
      rateLimits: 'Standard',
      responseTime: 'Fast',
      accuracy: 90,
      trainingData: 'Vendor provided dataset',
      lastTraining: created
    }
  };
};

export function EnhancedSourcesManagement({ lang = 'de' }: EnhancedSourcesManagementProps) {
  const { toast } = useToast();
  const [workflowSources, setWorkflowSources] = useState<WorkflowSource[]>([]);
  const [agentSources, setAgentSources] = useState<AgentSource[]>([]);
  const [sourceMetrics, setSourceMetrics] = useState<Record<string, SourceMetrics>>({});
  const [totalWorkflows, setTotalWorkflows] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [managedSource, setManagedSource] = useState<ManagedSource | null>(null);
  const [entriesState, setEntriesState] = useState<SourceEntriesState>({
    items: [],
    raw: [],
    page: 0,
    pageSize: 12,
    total: 0,
    isLoading: false,
    error: null
  });
  const [isRefreshingSelected, setIsRefreshingSelected] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [isSolutionModalOpen, setIsSolutionModalOpen] = useState(false);
  const [agentSolutions, setAgentSolutions] = useState<AgentIndex[]>([]);
  const [sourceFormState, setSourceFormState] = useState<{
    mode: 'create' | 'edit';
    kind: 'workflow' | 'agent';
    data?: WorkflowSource | AgentSource;
  } | null>(null);
  const [sourceFormSelects, setSourceFormSelects] = useState<{ status: 'active' | 'inactive' | 'error'; type: string }>({
    status: 'active',
    type: 'manual'
  });

  const isDetailsView = managedSource !== null;

  useEffect(() => {
    initializeSources();
  }, []);

  useEffect(() => {
    if (managedSource) {
      loadSourceEntries(managedSource, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managedSource]);

  const loadOverrides = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, any>;
    } catch {
      return {};
    }
  };

  const saveOverrides = (key: string, overrides: Record<string, any>) => {
    try {
      localStorage.setItem(key, JSON.stringify(overrides));
    } catch (error) {
      console.warn('Failed to persist source overrides:', error);
    }
  };

  const initializeSources = async () => {
    setIsLoading(true);
    try {
      const workflowOverrides = loadOverrides(WORKFLOW_OVERRIDES_KEY);
      const agentOverrides = loadOverrides(AGENT_OVERRIDES_KEY);

      const initialWorkflowSources = DEFAULT_WORKFLOW_SOURCES.map((source) => ({
        ...source,
        ...(workflowOverrides[source.id] || {})
      }));

      const initialAgentSources = DEFAULT_AGENT_SOURCES.map((source) => ({
        ...source,
        ...(agentOverrides[source.id] || {})
      }));

      setWorkflowSources(initialWorkflowSources);
      setAgentSources(initialAgentSources);

      await loadSourceStats(initialWorkflowSources, initialAgentSources);
    } catch (error) {
      console.error('Failed to initialize sources:', error);
      setErrors([
        lang === 'de'
          ? 'Quellen konnten nicht geladen werden.'
          : 'Failed to load sources.'
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSourceStats = async (
    workflowList: WorkflowSource[] = workflowSources,
    agentList: AgentSource[] = agentSources
  ) => {
    try {
      const workflowMetrics: Record<string, SourceMetrics> = {};
      let workflowTotal = 0;

      const updatedWorkflowSources = await Promise.all(
        workflowList.map(async (source) => {
          try {
            const stats = await workflowIndexer.getStats(source.id);
            workflowTotal += stats.total;
            workflowMetrics[source.id] = {
              id: source.id,
              kind: 'workflow',
              successRate: stats.total > 0 ? (stats.active / stats.total) * 100 : 0,
              errorCount: stats.inactive || 0,
              entryCount: stats.total,
              lastUpdated: new Date().toISOString()
            };
            return {
              ...source,
              workflowCount: stats.total,
              status: stats.total === 0 ? 'inactive' : 'active'
            };
          } catch (error) {
            console.warn(`Failed to load stats for ${source.id}:`, error);
            workflowMetrics[source.id] = {
              id: source.id,
              kind: 'workflow',
              successRate: 0,
              errorCount: 1,
              entryCount: source.workflowCount || 0,
              lastUpdated: new Date().toISOString()
            };
            return {
              ...source,
              status: 'error'
            };
          }
        })
      );

      const allSolutions = workflowIndexer.getAllSolutions();
      const agents = allSolutions.filter((solution): solution is AgentIndex =>
        isAgentIndex(solution)
      );
      setAgentSolutions(agents);

      const countBySource = agents.reduce<Record<string, number>>((acc, agent) => {
        const key = (agent.source || 'custom-agents').toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const updatedAgentSources = agentList.map((source) => {
        const count = countBySource[source.id] || 0;
        const metrics: SourceMetrics = {
          id: source.id,
          kind: 'agent',
          successRate: count > 0 ? 95 : 0,
          errorCount: 0,
          entryCount: count,
          lastUpdated: new Date().toISOString()
        };
        workflowMetrics[source.id] = metrics;
        return {
          ...source,
          agentCount: count,
          status: count > 0 ? 'active' : source.status
        };
      });

      setWorkflowSources(updatedWorkflowSources);
      setAgentSources(updatedAgentSources);
      setSourceMetrics(workflowMetrics);
      setTotalWorkflows(workflowTotal);
      setTotalAgents(agents.length);

      const cacheData = await workflowIndexer.getCacheStats();
      setCacheStats(cacheData);
    } catch (error) {
      console.error('Failed to load source statistics:', error);
      setErrors([
        lang === 'de'
          ? 'Quellenstatistiken konnten nicht geladen werden.'
          : 'Failed to load source statistics.'
      ]);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    try {
      const sourcesToRefresh = workflowSources.map((s) => s.id);
      for (const sourceId of sourcesToRefresh) {
        try {
          await workflowIndexer.forceRefreshWorkflows(sourceId);
        } catch (error) {
          console.warn(`Failed to refresh ${sourceId}:`, error);
        }
      }
      await loadSourceStats();
      if (managedSource && managedSource.kind === 'workflow') {
        await loadSourceEntries(managedSource, entriesState.page);
      }
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const getSourceMetrics = (source: ManagedSource | WorkflowSource | AgentSource) => {
    const id = 'kind' in (source as ManagedSource)
      ? (source as ManagedSource).source.id
      : (source as WorkflowSource | AgentSource).id;
    return sourceMetrics[id];
  };

  const handleSelectSource = (kind: 'workflow' | 'agent', id: string) => {
    setEntriesState((prev) => ({ ...prev, page: 0 }));
    if (kind === 'workflow') {
      const source = workflowSources.find((s) => s.id === id);
      if (source) {
        setManagedSource({ kind: 'workflow', source });
      }
    } else {
      const source = agentSources.find((s) => s.id === id);
      if (source) {
        setManagedSource({ kind: 'agent', source });
      }
    }
  };

  const handleBackToOverview = () => {
    setManagedSource(null);
    setEntriesState((prev) => ({ ...prev, items: [], raw: [], total: 0, page: 0 }));
  };

  const loadSourceEntries = async (managed: ManagedSource, page: number) => {
    setEntriesState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      if (managed.kind === 'workflow') {
        const limit = entriesState.pageSize;
        const offset = page * limit;
        let result = await workflowIndexer.searchWorkflows({
          source: managed.source.id,
          limit,
          offset
        });

        if ((result.total ?? result.workflows.length) === 0 && page === 0) {
          await workflowIndexer.forceRefreshWorkflows(managed.source.id);
          result = await workflowIndexer.searchWorkflows({
            source: managed.source.id,
            limit,
            offset
          });
        }

        const workflows = result.workflows as WorkflowIndex[];
        setEntriesState({
          items: workflows.map(workflowToSolutionData),
          raw: workflows,
          page,
          pageSize: limit,
          total: result.total ?? workflows.length,
          isLoading: false,
          error: null
        });

        const total = result.total ?? workflows.length;
        setWorkflowSources((prev) => {
          const updated = prev.map((source) =>
            source.id === managed.source.id ? { ...source, workflowCount: total } : source
          );
          setTotalWorkflows(updated.reduce((sum, src) => sum + (src.workflowCount || 0), 0));
          return updated;
        });
        setSourceMetrics((prev) => ({
          ...prev,
          [managed.source.id]: {
            ...(prev[managed.source.id] || {
              id: managed.source.id,
              kind: 'workflow',
              successRate: 0,
              errorCount: 0,
              lastUpdated: new Date().toISOString()
            }),
            entryCount: total
          }
        }));
      } else {
        const matchingAgents = agentSolutions.filter((agent) => {
          const sourceId = (agent.source || 'custom-agents').toLowerCase();
          return (
            sourceId === managed.source.id.toLowerCase() ||
            agent.id.toLowerCase() === managed.source.id.toLowerCase() ||
            sourceId.includes(managed.source.id.toLowerCase())
          );
        });

        const limit = entriesState.pageSize;
        const paginated = matchingAgents.slice(page * limit, page * limit + limit);

        setEntriesState({
          items: paginated.map(agentToSolutionData),
          raw: paginated,
          page,
          pageSize: limit,
          total: matchingAgents.length,
          isLoading: false,
          error: null
        });

        setAgentSources((prev) => {
          const updated = prev.map((source) =>
            source.id === managed.source.id ? { ...source, agentCount: matchingAgents.length } : source
          );
          setTotalAgents(updated.reduce((sum, src) => sum + (src.agentCount || 0), 0));
          return updated;
        });
        setSourceMetrics((prev) => ({
          ...prev,
          [managed.source.id]: {
            ...(prev[managed.source.id] || {
              id: managed.source.id,
              kind: 'agent',
              successRate: matchingAgents.length > 0 ? 95 : 0,
              errorCount: 0,
              lastUpdated: new Date().toISOString()
            }),
            entryCount: matchingAgents.length
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load source entries:', error);
      setEntriesState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          lang === 'de'
            ? 'Die Quelle konnte nicht geladen werden.'
            : 'Failed to load source entries.'
      }));
    }
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (!managedSource) return;
    const { page, pageSize, total } = entriesState;
    if (direction === 'prev' && page === 0) return;
    if (direction === 'next' && (page + 1) * pageSize >= total) return;
    const nextPage = direction === 'prev' ? page - 1 : page + 1;
    loadSourceEntries(managedSource, nextPage);
  };

  const handleOpenSolution = (solutionData: SolutionData) => {
    if (!managedSource) return;
    const rawEntry = entriesState.raw.find((entry) => entry.id === solutionData.id);
    if (!rawEntry) return;

    const solution = isAgentIndex(rawEntry)
      ? agentToSolution(rawEntry)
      : workflowToSolution(rawEntry as WorkflowIndex);

    setSelectedSolution(solution);
    setIsSolutionModalOpen(true);
  };

  const handleCloseSolutionModal = () => {
    setIsSolutionModalOpen(false);
    setSelectedSolution(null);
  };

  const handleRefreshSelected = async () => {
    if (!managedSource) return;
    if (managedSource.kind !== 'workflow') return;
    setIsRefreshingSelected(true);
    try {
      await workflowIndexer.forceRefreshWorkflows(managedSource.source.id);
      await loadSourceStats();
      await loadSourceEntries(managedSource, entriesState.page);
    } finally {
      setIsRefreshingSelected(false);
    }
  };

  const handleDeleteSource = (kind: 'workflow' | 'agent', id: string) => {
    if (!confirm(lang === 'de' ? 'Quelle wirklich löschen?' : 'Delete this source?')) {
      return;
    }

    if (kind === 'workflow') {
      const updated = workflowSources.filter((s) => s.id !== id);
      setWorkflowSources(updated);
      const overrides = loadOverrides(WORKFLOW_OVERRIDES_KEY);
      delete overrides[id];
      saveOverrides(WORKFLOW_OVERRIDES_KEY, overrides);
    } else {
      const updated = agentSources.filter((s) => s.id !== id);
      setAgentSources(updated);
      const overrides = loadOverrides(AGENT_OVERRIDES_KEY);
      delete overrides[id];
      saveOverrides(AGENT_OVERRIDES_KEY, overrides);
    }

    if (managedSource && managedSource.source.id === id) {
      handleBackToOverview();
    }

    loadSourceStats();
  };

  const handleToggleSourceStatus = (kind: 'workflow' | 'agent', id: string, checked: boolean) => {
    const nextStatus: 'active' | 'inactive' = checked ? 'active' : 'inactive';

    if (kind === 'workflow') {
      setWorkflowSources((prev) => prev.map((source) =>
        source.id === id ? { ...source, status: nextStatus } : source
      ));
      const overrides = loadOverrides(WORKFLOW_OVERRIDES_KEY);
      overrides[id] = {
        ...(overrides[id] || {}),
        status: nextStatus
      };
      saveOverrides(WORKFLOW_OVERRIDES_KEY, overrides);
      if (managedSource && managedSource.kind === 'workflow' && managedSource.source.id === id) {
        setManagedSource({ kind: 'workflow', source: { ...managedSource.source, status: nextStatus } });
      }
    } else {
      setAgentSources((prev) => prev.map((source) =>
        source.id === id ? { ...source, status: nextStatus } : source
      ));
      const overrides = loadOverrides(AGENT_OVERRIDES_KEY);
      overrides[id] = {
        ...(overrides[id] || {}),
        status: nextStatus
      };
      saveOverrides(AGENT_OVERRIDES_KEY, overrides);
      if (managedSource && managedSource.kind === 'agent' && managedSource.source.id === id) {
        setManagedSource({ kind: 'agent', source: { ...managedSource.source, status: nextStatus } });
      }
    }

    toast({
      title: checked
        ? (lang === 'de' ? 'Quelle aktiviert' : 'Source activated')
        : (lang === 'de' ? 'Quelle deaktiviert' : 'Source deactivated'),
      description: lang === 'de'
        ? 'Die Änderung wurde gespeichert.'
        : 'Your change has been saved.'
    });
  };

  const openCreateSourceForm = (kind: 'workflow' | 'agent') => {
    setSourceFormState({ mode: 'create', kind });
    setSourceFormSelects({
      status: 'active',
      type: kind === 'workflow' ? 'manual' : 'manual'
    });
  };

  const openEditSourceForm = (kind: 'workflow' | 'agent', id: string) => {
    const source = kind === 'workflow'
      ? workflowSources.find((s) => s.id === id)
      : agentSources.find((s) => s.id === id);
    if (!source) return;
    setSourceFormState({ mode: 'edit', kind, data: source });
    setSourceFormSelects({
      status: source.status,
      type: kind === 'workflow'
        ? (source as WorkflowSource).type
        : (source as AgentSource).type
    });
  };

  const handleSourceFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sourceFormState) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const url = String(formData.get('url') || '').trim();
    const category = String(formData.get('category') || '').trim();
    const status = sourceFormSelects.status;

    if (!name) {
      alert(lang === 'de' ? 'Bitte Name angeben.' : 'Please enter a name.');
      return;
    }

    if (sourceFormState.kind === 'workflow') {
      const type = sourceFormSelects.type as WorkflowSourceType;
      let id = sourceFormState.mode === 'edit' && sourceFormState.data
        ? sourceFormState.data.id
        : name.toLowerCase().replace(/\s+/g, '-');

      const updatedSource: WorkflowSource = {
        id,
        name,
        type,
        url: url || undefined,
        description,
        category: category || 'Custom',
        workflowCount: sourceFormState.mode === 'edit' && sourceFormState.data
          ? sourceFormState.data.workflowCount
          : 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        status
      };

      const overrides = loadOverrides(WORKFLOW_OVERRIDES_KEY);
      overrides[id] = {
        name,
        type,
        url,
        description,
        category,
        status
      };
      saveOverrides(WORKFLOW_OVERRIDES_KEY, overrides);

      setWorkflowSources((prev) => {
        if (sourceFormState.mode === 'edit') {
          return prev.map((item) => (item.id === id ? { ...item, ...updatedSource } : item));
        }
        return [...prev, updatedSource];
      });

      if (managedSource && managedSource.kind === 'workflow' && managedSource.source.id === id) {
        setManagedSource({ kind: 'workflow', source: updatedSource });
      }
    } else {
      const type = sourceFormSelects.type as 'catalog' | 'api' | 'manual';
      let id = sourceFormState.mode === 'edit' && sourceFormState.data
        ? (sourceFormState.data as AgentSource).id
        : name.toLowerCase().replace(/\s+/g, '-');

      const updatedSource: AgentSource = {
        id,
        name,
        type,
        url: url || undefined,
        description,
        category: category || 'General',
        agentCount: sourceFormState.mode === 'edit' && sourceFormState.data
          ? (sourceFormState.data as AgentSource).agentCount
          : 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        status
      };

      const overrides = loadOverrides(AGENT_OVERRIDES_KEY);
      overrides[id] = {
        name,
        type,
        url,
        description,
        category,
        status
      };
      saveOverrides(AGENT_OVERRIDES_KEY, overrides);

      setAgentSources((prev) => {
        if (sourceFormState.mode === 'edit') {
          return prev.map((item) => (item.id === id ? { ...item, ...updatedSource } : item));
        }
        return [...prev, updatedSource];
      });

      if (managedSource && managedSource.kind === 'agent' && managedSource.source.id === id) {
        setManagedSource({ kind: 'agent', source: updatedSource });
      }
    }

    setSourceFormState(null);
    loadSourceStats();
  };

  const workflowSourceRows = useMemo(
    () =>
      workflowSources.map((source) => ({
        id: source.id,
        name: source.name,
        count: source.workflowCount,
        status: source.status,
        category: source.category,
        url: source.url
      })),
    [workflowSources]
  );

  const agentSourceRows = useMemo(
    () =>
      agentSources.map((source) => ({
        id: source.id,
        name: source.name,
        count: source.agentCount,
        status: source.status,
        category: source.category,
        url: source.url
      })),
    [agentSources]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>{lang === 'de' ? 'Lade Quellen...' : 'Loading sources...'}</span>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {lang === 'de' ? 'Quellenverwaltung' : 'Sources Management'}
          </h2>
          <p className="text-muted-foreground">
            {lang === 'de'
              ? 'Verwalte Workflow- und Agentenquellen, aktualisiere und analysiere Inhalte.'
              : 'Manage workflow and agent sources, refresh data, and review analytics.'}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{totalWorkflows} {lang === 'de' ? 'Workflows' : 'Workflows'}</Badge>
            <Badge variant="secondary">{totalAgents} {lang === 'de' ? 'KI-Agenten' : 'AI Agents'}</Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={() => openCreateSourceForm('agent')}>
            <Plus className="h-4 w-4 mr-2" />
            {lang === 'de' ? 'Agentenquelle' : 'Agent Source'}
          </Button>
          <Button variant="outline" onClick={() => openCreateSourceForm('workflow')}>
            <Plus className="h-4 w-4 mr-2" />
            {lang === 'de' ? 'Workflow-Quelle' : 'Workflow Source'}
          </Button>
          <Button onClick={handleRefreshAll} disabled={isRefreshingAll}>
            {isRefreshingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {lang === 'de' ? 'Alle aktualisieren' : 'Refresh All'}
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <ul className="list-disc list-inside">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {lang === 'de' ? 'Cache-Analysen' : 'Cache Analytics'}
            </CardTitle>
            <CardDescription>
              {lang === 'de'
                ? 'Cache-Performance und Speicher-Statistiken'
                : 'Cache performance and storage statistics'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(cacheStats.totalEntries ?? cacheStats.entryCount ?? cacheStats.size ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang === 'de' ? 'Cache-Einträge' : 'Cache Entries'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(cacheStats.hitRate ?? 0).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang === 'de' ? 'Hit-Rate' : 'Hit Rate'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(((cacheStats.totalSize ?? 0) / 1024 / 1024)).toFixed(1)} MB
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang === 'de' ? 'Cache-Größe' : 'Cache Size'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-blue-500" />
              {lang === 'de' ? 'Workflow-Quellen' : 'Workflow Sources'}
            </CardTitle>
            <CardDescription>
              {lang === 'de'
                ? 'Verwalte alle Workflow-Datenquellen.'
                : 'Manage all workflow data sources.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowSourceRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {lang === 'de'
                  ? 'Keine Workflow-Quellen definiert.'
                  : 'No workflow sources defined.'}
              </div>
            ) : (
              workflowSourceRows.map((row) => (
                <div key={row.id} className="border rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{row.name}</h3>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
                        <span>{row.category}</span>
                        {row.url && (
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {row.url.includes('github') ? <Github className="inline h-4 w-4 mr-1" /> : <Globe className="inline h-4 w-4 mr-1" />}
                            {lang === 'de' ? 'Quelle öffnen' : 'Open source'}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={row.status === 'active'}
                        onCheckedChange={(checked) => handleToggleSourceStatus('workflow', row.id, checked)}
                        aria-label={lang === 'de' ? 'Quelle aktivieren' : 'Toggle source active'}
                      />
                      <span className="text-xs text-muted-foreground">
                        {row.status === 'active'
                          ? (lang === 'de' ? 'Aktiv' : 'Active')
                          : row.status === 'inactive'
                            ? (lang === 'de' ? 'Inaktiv' : 'Inactive')
                            : (lang === 'de' ? 'Fehler' : 'Error')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {lang === 'de' ? 'Workflows' : 'Workflows'}: {row.count}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleSelectSource('workflow', row.id)}>
                        {lang === 'de' ? 'Ansehen' : 'View'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditSourceForm('workflow', row.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteSource('workflow', row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              {lang === 'de' ? 'Agenten-Quellen' : 'Agent Sources'}
            </CardTitle>
            <CardDescription>
              {lang === 'de'
                ? 'Verwalte KI-Agentenquellen.'
                : 'Manage AI agent sources.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agentSourceRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {lang === 'de'
                  ? 'Keine Agenten-Quellen definiert.'
                  : 'No agent sources defined.'}
              </div>
            ) : (
              agentSourceRows.map((row) => (
                <div key={row.id} className="border rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{row.name}</h3>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
                        <span>{row.category}</span>
                        {row.url && (
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            <Globe className="inline h-4 w-4 mr-1" />
                            {lang === 'de' ? 'Quelle öffnen' : 'Open source'}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={row.status === 'active'}
                        onCheckedChange={(checked) => handleToggleSourceStatus('agent', row.id, checked)}
                        aria-label={lang === 'de' ? 'Quelle aktivieren' : 'Toggle source active'}
                      />
                      <span className="text-xs text-muted-foreground">
                        {row.status === 'active'
                          ? (lang === 'de' ? 'Aktiv' : 'Active')
                          : row.status === 'inactive'
                            ? (lang === 'de' ? 'Inaktiv' : 'Inactive')
                            : (lang === 'de' ? 'Fehler' : 'Error')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {lang === 'de' ? 'Agenten' : 'Agents'}: {row.count}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleSelectSource('agent', row.id)}>
                        {lang === 'de' ? 'Ansehen' : 'View'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditSourceForm('agent', row.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteSource('agent', row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDetails = () => {
    if (!managedSource) return null;
    const metrics = getSourceMetrics(managedSource);
    const { source } = managedSource;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleBackToOverview}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {lang === 'de' ? 'Zurück' : 'Back'}
            </Button>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {managedSource.kind === 'workflow' ? (
                  <Workflow className="h-5 w-5 text-blue-500" />
                ) : (
                  <Bot className="h-5 w-5 text-purple-500" />
                )}
                {source.name}
              </h2>
              <p className="text-muted-foreground">
                {lang === 'de'
                  ? `Quelltyp: ${managedSource.kind === 'workflow' ? 'Workflow' : 'Agent'}`
                  : `Source type: ${managedSource.kind === 'workflow' ? 'Workflow' : 'Agent'}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end items-center">
            {managedSource.kind === 'workflow' && (
              <Button variant="outline" onClick={handleRefreshSelected} disabled={isRefreshingSelected}>
                {isRefreshingSelected ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {lang === 'de' ? 'Quelle aktualisieren' : 'Refresh Source'}
              </Button>
            )}
            <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-muted/30">
              <Switch
                checked={source.status === 'active'}
                onCheckedChange={(checked) => handleToggleSourceStatus(managedSource.kind, source.id, checked)}
                aria-label={lang === 'de' ? 'Quelle aktivieren' : 'Toggle source active'}
              />
              <span className="text-xs text-muted-foreground">
                {source.status === 'active'
                  ? (lang === 'de' ? 'Aktiv' : 'Active')
                  : source.status === 'inactive'
                    ? (lang === 'de' ? 'Inaktiv' : 'Inactive')
                    : (lang === 'de' ? 'Fehler' : 'Error')}
              </span>
            </div>
            <Button variant="outline" onClick={() => openEditSourceForm(managedSource.kind, source.id)}>
              <Pencil className="h-4 w-4 mr-2" />
              {lang === 'de' ? 'Bearbeiten' : 'Edit'}
            </Button>
            <Button variant="outline" onClick={() => handleDeleteSource(managedSource.kind, source.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {lang === 'de' ? 'Löschen' : 'Delete'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{lang === 'de' ? 'Quelle' : 'Source'}</CardTitle>
            <CardDescription>
              {managedSource.kind === 'workflow'
                ? lang === 'de'
                  ? 'Details der Workflow-Quelle'
                  : 'Workflow source details'
                : lang === 'de'
                  ? 'Details der Agentenquelle'
                  : 'Agent source details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">{lang === 'de' ? 'Kategorie' : 'Category'}</Label>
                <div className="font-medium">{source.category}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{lang === 'de' ? 'Status' : 'Status'}</Label>
                <div className="font-medium">
                  {lang === 'de'
                    ? source.status === 'active'
                      ? 'Aktiv'
                      : source.status === 'inactive'
                        ? 'Inaktiv'
                        : 'Fehler'
                    : source.status === 'active'
                      ? 'Active'
                      : source.status === 'inactive'
                        ? 'Inactive'
                        : 'Error'}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{lang === 'de' ? 'Zuletzt aktualisiert' : 'Last updated'}</Label>
                <div className="font-medium">{source.lastUpdated}</div>
              </div>
              {source.url && (
                <div>
                  <Label className="text-xs text-muted-foreground">URL</Label>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline break-all"
                  >
                    {source.url}
                  </a>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">{lang === 'de' ? 'Beschreibung' : 'Description'}</Label>
              <p className="text-sm text-muted-foreground mt-1">{source.description || '—'}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {metrics ? metrics.entryCount : managedSource.kind === 'workflow' ? source.workflowCount : source.agentCount}
                </div>
                <div className="text-xs text-muted-foreground">
                  {managedSource.kind === 'workflow'
                    ? lang === 'de' ? 'Workflows' : 'Workflows'
                    : lang === 'de' ? 'Agenten' : 'Agents'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {metrics ? `${metrics.successRate.toFixed(1)}%` : managedSource.kind === 'workflow' ? '—' : '95%'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lang === 'de' ? 'Erfolgsrate' : 'Success rate'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {metrics ? metrics.errorCount : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lang === 'de' ? 'Fehler' : 'Errors'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {metrics ? new Date(metrics.lastUpdated).toLocaleTimeString() : '—'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lang === 'de' ? 'Letzte Aktualisierung' : 'Last refresh'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {managedSource.kind === 'workflow'
                ? lang === 'de'
                  ? 'Workflows'
                  : 'Workflows'
                : lang === 'de'
                  ? 'Agenten'
                  : 'Agents'}
            </CardTitle>
            <CardDescription>
              {managedSource.kind === 'workflow'
                ? lang === 'de'
                  ? 'Liste der zugehörigen Workflows mit Pagination.'
                  : 'List of related workflows with pagination.'
                : lang === 'de'
                  ? 'Liste der zugehörigen KI-Agenten.'
                  : 'List of related AI agents.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entriesState.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>{lang === 'de' ? 'Lade Einträge...' : 'Loading entries...'}</span>
              </div>
            ) : entriesState.error ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {entriesState.error}
                </AlertDescription>
              </Alert>
            ) : entriesState.items.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {lang === 'de'
                  ? 'Keine Einträge vorhanden.'
                  : 'No entries available.'}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {entriesState.items.map((solution) => (
                    <SolutionCard
                      key={solution.id}
                      solution={solution}
                      onView={() => handleOpenSolution(solution)}
                      isAdmin
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    {lang === 'de'
                      ? `Einträge ${(entriesState.page * entriesState.pageSize) + 1} – ${Math.min((entriesState.page + 1) * entriesState.pageSize, entriesState.total)} von ${entriesState.total}`
                      : `Entries ${(entriesState.page * entriesState.pageSize) + 1} – ${Math.min((entriesState.page + 1) * entriesState.pageSize, entriesState.total)} of ${entriesState.total}`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange('prev')}
                      disabled={entriesState.page === 0 || entriesState.isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange('next')}
                      disabled={(entriesState.page + 1) * entriesState.pageSize >= entriesState.total || entriesState.isLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isDetailsView ? renderDetails() : renderOverview()}

      <SolutionDetailModal
        solution={selectedSolution}
        isOpen={isSolutionModalOpen}
        onClose={handleCloseSolutionModal}
        isAdmin
      />

      <Dialog
        open={!!sourceFormState}
        onOpenChange={(open) => {
          if (!open) {
            setSourceFormState(null);
            setSourceFormSelects({ status: 'active', type: 'manual' });
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSourceFormSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {sourceFormState?.mode === 'edit'
                  ? lang === 'de'
                    ? 'Quelle bearbeiten'
                    : 'Edit Source'
                  : lang === 'de'
                    ? 'Neue Quelle'
                    : 'New Source'}
              </DialogTitle>
              <DialogDescription>
                {sourceFormState?.kind === 'workflow'
                  ? lang === 'de'
                    ? 'Details für eine Workflow-Quelle festlegen.'
                    : 'Configure a workflow source.'
                  : lang === 'de'
                    ? 'Details für eine Agentenquelle festlegen.'
                    : 'Configure an agent source.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="name">{lang === 'de' ? 'Name' : 'Name'}</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={sourceFormState?.data?.name ?? ''}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{lang === 'de' ? 'Beschreibung' : 'Description'}</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={sourceFormState?.data?.description ?? ''}
                />
              </div>

              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  defaultValue={'url' in (sourceFormState?.data || {}) ? sourceFormState?.data?.url ?? '' : ''}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="category">{lang === 'de' ? 'Kategorie' : 'Category'}</Label>
                  <Input
                    id="category"
                    name="category"
                    defaultValue={sourceFormState?.data?.category ?? ''}
                  />
                </div>
                <div>
                  <Label>{lang === 'de' ? 'Status' : 'Status'}</Label>
                  <Select value={sourceFormSelects.status} onValueChange={(value: 'active' | 'inactive' | 'error') => setSourceFormSelects((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{lang === 'de' ? 'Aktiv' : 'Active'}</SelectItem>
                      <SelectItem value="inactive">{lang === 'de' ? 'Inaktiv' : 'Inactive'}</SelectItem>
                      <SelectItem value="error">{lang === 'de' ? 'Fehler' : 'Error'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{lang === 'de' ? 'Typ' : 'Type'}</Label>
      {sourceFormState?.kind === 'workflow' ? (
                  <Select value={sourceFormSelects.type} onValueChange={(value) => setSourceFormSelects((prev) => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="manual">{lang === 'de' ? 'Manuell' : 'Manual'}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={sourceFormSelects.type} onValueChange={(value) => setSourceFormSelects((prev) => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="catalog">Catalog</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="manual">{lang === 'de' ? 'Manuell' : 'Manual'}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setSourceFormState(null)}>
                {lang === 'de' ? 'Abbrechen' : 'Cancel'}
              </Button>
              <Button type="submit">
                {lang === 'de' ? 'Speichern' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EnhancedSourcesManagement;
