import React, { useState, useEffect, useMemo } from 'react';
import { Solution, SolutionType, SolutionFilter, SolutionSort } from '../types/solutions';
import { createSolutionFilters } from '../lib/solutions/solutionFilters';
import { createSolutionScoring } from '../lib/solutions/solutionScoring';
import { createSolutionMatcher } from '../lib/solutions/solutionMatcher';
import { createSolutionCombinations } from '../lib/solutions/solutionCombinations';
import { AIAgent } from '../lib/solutions/aiAgentsCatalog';
import { N8nWorkflow } from '../lib/n8nApi';
import SolutionCard from './SolutionCard';
import SolutionDetailModal from './SolutionDetailModal';
import SolutionFilters from './SolutionFilters';
import SolutionIcon from './ui/SolutionIcon';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Filter, Calendar, Clock, User, Tag, Star, TrendingUp, Download, MessageSquare } from 'lucide-react';
import ProfessionalSetup from './ProfessionalSetup';

interface SolutionsTabProps {
  taskText?: string;
  lang?: 'de' | 'en';
  selectedApplications?: string[];
  onSolutionsLoaded?: (count: number) => void;
  subtasks?: Array<{
    id: string;
    name: string;
    businessDomain: string;
    automationPotential: number;
    keywords: string[];
    category: string;
  }>;
  onSolutionSelect?: (solution: Solution) => void;
}

export default function SolutionsTab({ 
  taskText,
  lang = 'de',
  selectedApplications = [],
  onSolutionsLoaded,
  subtasks = [],
  onSolutionSelect 
}: SolutionsTabProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'workflows' | 'agents'>('all');
  const [filters, setFilters] = useState<SolutionFilter>({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - in real implementation, this would come from API
  const [solutions, setSolutions] = useState<Solution[]>([]);

  // Initialize solution services with the actual solutions data
  const solutionFilters = useMemo(() => createSolutionFilters(solutions), [solutions]);
  const solutionScoring = useMemo(() => createSolutionScoring(), []);
  const solutionMatcher = useMemo(() => createSolutionMatcher(), []);
  const solutionCombinations = useMemo(() => createSolutionCombinations(), []);

  useEffect(() => {
    loadSolutions();
  }, []);

  // Notify parent component when solutions are loaded
  useEffect(() => {
    if (solutions.length > 0 && onSolutionsLoaded) {
      onSolutionsLoaded(solutions.length);
    }
  }, [solutions, onSolutionsLoaded]);

  const loadSolutions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock data generation - replace with actual API calls
      const mockSolutions = generateMockSolutions();
      setSolutions(mockSolutions);
    } catch (err) {
      setError('Failed to load solutions');
      console.error('Error loading solutions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter solutions based on active tab
  const filteredSolutions = useMemo(() => {
    let filtered = solutions;
    
    // Apply tab filter
    if (activeTab === 'workflows') {
      filtered = filtered.filter(solution => solution.type === 'workflow');
    } else if (activeTab === 'agents') {
      filtered = filtered.filter(solution => solution.type === 'agent');
    }
    // 'all' shows everything
    
    // Apply other filters only if we have any active filters
    if (Object.keys(filters).length > 0) {
      // Convert SolutionFilter to FilterCriteria
      const filterCriteria = {
        type: filters.type ? [filters.type] : undefined,
        category: filters.category ? [filters.category] : undefined,
        difficulty: filters.difficulty ? [filters.difficulty] : undefined,
        setupTime: filters.setupTime ? [filters.setupTime] : undefined,
        deployment: filters.deployment ? [filters.deployment] : undefined,
        status: filters.status ? [filters.status] : undefined,
        minAutomationPotential: filters.minAutomationPotential,
        maxAutomationPotential: filters.maxAutomationPotential,
        implementationPriority: filters.implementationPriority ? [filters.implementationPriority] : undefined,
        tags: filters.tags,
        priceRange: filters.priceRange ? [filters.priceRange] : undefined,
        minRating: filters.minRating,
        maxSetupTime: filters.maxSetupTime
      };
      
      filtered = solutionFilters.applyFilters(filterCriteria);
    }
    
    return filtered;
  }, [solutions, activeTab, filters, solutionFilters]);

  const handleSolutionSelect = (solution: Solution) => {
    setSelectedSolution(solution);
    setShowSolutionModal(true);
    
    onSolutionSelect?.(solution);
  };

  const handleFilterChange = (newFilters: SolutionFilter) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const closeSolutionModal = () => {
    setShowSolutionModal(false);
    setSelectedSolution(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {lang === 'de' ? 'Lade Lösungen...' : 'Loading solutions...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadSolutions} variant="outline">
            {lang === 'de' ? 'Wiederholen' : 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Filter Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`text-sm font-medium transition-colors ${
              activeTab === 'all' 
                ? 'text-primary border-b-2 border-primary pb-1' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang === 'de' ? 'Alle' : 'All'} {solutions.length}
          </button>
          
          <button
            onClick={() => setActiveTab('workflows')}
            className={`text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'workflows' 
                ? 'text-primary border-b-2 border-primary pb-1' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SolutionIcon type="workflow" className="h-4 w-4" />
            {lang === 'de' ? 'Workflows' : 'Workflows'} {solutions.filter(s => s.type === 'workflow').length}
          </button>
          
          <button
            onClick={() => setActiveTab('agents')}
            className={`text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'agents' 
                ? 'text-primary border-b-2 border-primary pb-1' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SolutionIcon type="agent" className="h-4 w-4" />
            {lang === 'de' ? 'KI-Agenten' : 'AI Agents'} {solutions.filter(s => s.type === 'agent').length}
          </button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFiltersModal(true)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {lang === 'de' ? 'Filter' : 'Filters'}
        </Button>
      </div>

      {/* Content based on active tab */}
      <div className="space-y-4">
        {filteredSolutions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {lang === 'de' 
                ? 'Keine Lösungen gefunden. Versuchen Sie andere Filter.'
                : 'No solutions found. Try different filters.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSolutions.map((solution) => (
              <div 
                key={solution.id}
                className="cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => handleSolutionSelect(solution)}
              >
                <SolutionCard
                  solution={{
                    id: solution.id,
                    name: solution.name,
                    description: solution.description,
                    category: solution.category,
                    priority: solution.implementationPriority === 'High' ? 'High' : solution.implementationPriority === 'Medium' ? 'Medium' : 'Low',
                    type: solution.type === 'agent' ? 'ai-agent' : 'workflow',
                    automationScore: solution.automationPotential,
                    roi: solution.estimatedROI,
                    timeToValue: solution.timeToValue,
                    successRate: `${solution.metrics.successRate}%`,
                    userCount: `${solution.metrics.usageCount}`,
                    avgTime: `${solution.metrics.averageExecutionTime}s`,
                    rating: solution.metrics.userRating,
                    reviewCount: solution.metrics.reviewCount,
                    nodeCount: solution.type === 'workflow' ? solution.workflowMetadata?.nodeCount : undefined,
                    triggerType: solution.type === 'workflow' ? solution.workflowMetadata?.triggerType as any : undefined,
                    complexity: solution.difficulty === 'Beginner' ? 'Low' : solution.difficulty === 'Intermediate' ? 'Medium' : 'High',
                    integrations: solution.integrations.map(i => i.platform),
                    tags: solution.tags,
                    active: solution.status === 'Active',
                    lastUpdated: solution.updatedAt.toISOString()
                  }}
                  onView={() => handleSolutionSelect(solution)}
                  onDownload={() => console.log('Download solution:', solution)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solution Details Modal */}
      {selectedSolution && (
        <SolutionDetailModal
          solution={selectedSolution}
          isOpen={showSolutionModal}
          onClose={() => setShowSolutionModal(false)}
          onImplement={(solution) => {
            console.log('Implement solution:', solution);
            // TODO: Implement solution logic
          }}
          onDeploy={(solution) => {
            console.log('Deploy solution:', solution);
            // TODO: Deploy solution logic
          }}
          isAdmin={false} // Frontend, so show professional setup block
        />
      )}

      {/* Filters Modal */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {lang === 'de' ? 'Filter anwenden' : 'Apply Filters'}
            </DialogTitle>
          </DialogHeader>
          
          <SolutionFilters
            filters={filters}
            onFiltersChange={handleFilterChange}
            onClearFilters={clearFilters}
            availableOptions={{
              type: ['workflow', 'agent'],
              category: ['Content Creation', 'Finance & Accounting', 'Marketing & Sales'],
              difficulty: ['Beginner', 'Intermediate', 'Advanced'],
              setupTime: ['Quick', 'Medium', 'Long'],
              deployment: ['Local', 'Cloud', 'Hybrid'],
              status: ['Active', 'Inactive', 'Deprecated', 'Beta'],
              implementationPriority: ['High', 'Medium', 'Low'],
              tags: ['ai', 'automation', 'workflow', 'finance', 'marketing'],
              priceRange: ['Free', 'Freemium', 'Paid', 'Enterprise']
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock data generation - replace with actual API calls
function generateMockSolutions(): Solution[] {
  const mockWorkflows: Solution[] = [
    {
      id: '1',
      name: 'Scrape and summarize webpages with AI',
      description: 'Automatically scrape webpages and summarize content using AI',
      type: 'workflow',
      category: 'Content Creation',
      subcategories: ['Web Scraping', 'AI Processing'],
      difficulty: 'Intermediate',
      setupTime: 'Medium',
      deployment: 'Cloud',
      status: 'Active',
      tags: ['ai', 'web-scraping', 'summarization'],
      automationPotential: 74,
      estimatedROI: '200-275%',
      timeToValue: '1-2 weeks',
      implementationPriority: 'High',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      version: '1.2.0',
      author: 'Community',
      documentationUrl: 'https://docs.n8n.io/workflows/web-scraping-ai',
      demoUrl: 'https://demo.n8n.io/web-scraping-ai',
      githubUrl: 'https://github.com/n8n-io/workflows/tree/main/web-scraping-ai',
      pricing: 'Free',
      requirements: [
        {
          category: 'Integrations',
          items: ['OpenAI API', 'Web Scraper', 'HTTP Request'],
          importance: 'Required',
          alternatives: []
        }
      ],
      useCases: [
        {
          scenario: 'Content Research',
          description: 'Automatically research and summarize competitor content',
          automationPotential: 74,
          implementationEffort: 'Medium',
          expectedOutcome: 'Reduced research time by 70%',
          prerequisites: ['OpenAI API Key'],
          estimatedTimeSavings: '5-8 hours per week',
          businessImpact: 'High'
        }
      ],
      integrations: [
        {
          platform: 'OpenAI',
          type: 'API',
          description: 'AI text processing and summarization',
          setupComplexity: 'Low',
          apiKeyRequired: true
        }
      ],
      metrics: {
        usageCount: 105,
        successRate: 95.0,
        averageExecutionTime: 45,
        errorRate: 2.0,
        userRating: 4.3,
        reviewCount: 29,
        lastUsed: new Date('2024-01-20'),
        performanceScore: 74
      },
      workflow: {} as N8nWorkflow,
      workflowMetadata: {
        nodeCount: 8,
        triggerType: 'Webhook',
        executionTime: '45s',
        complexity: 'Moderate',
        dependencies: ['OpenAI API'],
        estimatedExecutionTime: '45s'
      }
    }
  ];

  const mockAgents: Solution[] = [
    {
      id: '2',
      name: 'Financial Data Analysis Agent',
      description: 'AI agent that analyzes financial data and generates insights',
      type: 'agent',
      category: 'Finance & Accounting',
      subcategories: ['Data Analysis', 'Financial Reporting'],
      difficulty: 'Advanced',
      setupTime: 'Long',
      deployment: 'Cloud',
      status: 'Active',
      tags: ['finance', 'ai', 'data-analysis'],
      automationPotential: 89,
      estimatedROI: '300-450%',
      timeToValue: '2-3 weeks',
      implementationPriority: 'High',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      version: '2.1.0',
      author: 'Finance Team',
      documentationUrl: 'https://docs.prom8eus.com/agents/financial-analysis',
      demoUrl: 'https://demo.prom8eus.com/financial-agent',
      pricing: 'Freemium',
      requirements: [
        {
          category: 'Data Sources',
          items: ['Financial APIs', 'Database Access', 'Excel Files'],
          importance: 'Required',
          alternatives: []
        }
      ],
      useCases: [
        {
          scenario: 'Monthly Financial Reports',
          description: 'Automatically generate comprehensive financial reports',
          automationPotential: 89,
          implementationEffort: 'High',
          expectedOutcome: 'Automated monthly reporting with 95% accuracy',
          prerequisites: ['Financial data access', 'AI model training'],
          estimatedTimeSavings: '12-16 hours per month',
          businessImpact: 'High'
        }
      ],
      integrations: [
        {
          platform: 'OpenAI GPT-4',
          type: 'API',
          description: 'Advanced financial data analysis',
          setupComplexity: 'Low',
          apiKeyRequired: true
        }
      ],
      metrics: {
        usageCount: 89,
        successRate: 97.2,
        averageExecutionTime: 45,
        errorRate: 1.8,
        userRating: 4.7,
        reviewCount: 15,
        lastUsed: new Date(),
        performanceScore: 92
      },
      agent: {} as AIAgent,
      agentMetadata: {
        model: 'GPT-4',
        apiProvider: 'OpenAI',
        rateLimits: '100 requests/hour',
        responseTime: '2-5 seconds',
        accuracy: 94,
        trainingData: 'Financial datasets',
        lastTraining: new Date('2024-01-15')
      }
    }
  ];

  return [...mockWorkflows, ...mockAgents];
}