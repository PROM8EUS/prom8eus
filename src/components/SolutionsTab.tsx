import React, { useState, useEffect, useMemo } from 'react';
import { Solution, SolutionType, SolutionFilter, SolutionSort } from '../types/solutions';
import { createSolutionFilters } from '../lib/solutions/solutionFilters';
import { createSolutionScoring } from '../lib/solutions/solutionScoring';
import { createSolutionMatcher } from '../lib/solutions/solutionMatcher';
import { createSolutionCombinations } from '../lib/solutions/solutionCombinations';
import { AIAgent } from '../lib/solutions/aiAgentsCatalog';
import { N8nWorkflow } from '../lib/n8nApi';
import SolutionCard from './SolutionCard';
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
                  solution={solution}
                  viewMode="grid"
                  onSelect={() => handleSolutionSelect(solution)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solution Details Modal */}
      <Dialog open={showSolutionModal} onOpenChange={setShowSolutionModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <SolutionIcon type={selectedSolution?.type || 'workflow'} className="h-6 w-6" />
              {selectedSolution?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSolution && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">
                  {lang === 'de' ? 'Übersicht' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="implementation">
                  {lang === 'de' ? 'Implementierung' : 'Implementation'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Key Metrics Row */}
                <div className="flex items-center space-x-6 border-b pb-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {lang === 'de' ? 'Kategorie' : 'Category'}
                    </div>
                    <div className="font-bold text-gray-900">{selectedSolution.category}</div>
                  </div>

                  <div className="w-px h-12 bg-gray-200"></div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {lang === 'de' ? 'Zeitersparnis' : 'Time Savings'}
                    </div>
                    <div className="font-bold text-gray-900">
                      {selectedSolution.useCases?.[0]?.estimatedTimeSavings || '2h'}
                    </div>
                  </div>

                  <div className="w-px h-12 bg-gray-200"></div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {lang === 'de' ? 'Monatliche Einsparung' : 'Monthly Savings'}
                    </div>
                    <div className="font-bold text-gray-900">
                      {selectedSolution.estimatedROI || '€380'}
                    </div>
                  </div>

                  <div className="w-px h-12 bg-gray-200"></div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {lang === 'de' ? 'Komplexität' : 'Complexity'}
                    </div>
                    <div className="font-bold text-gray-900">
                      {selectedSolution.difficulty === 'Beginner' ? '25' : selectedSolution.difficulty === 'Intermediate' ? '46' : '78'}
                    </div>
                  </div>

                  <div className="w-px h-12 bg-gray-200"></div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {lang === 'de' ? 'Verwendungen' : 'Usage Count'}
                    </div>
                    <div className="font-bold text-gray-900">
                      {selectedSolution.metrics?.usageCount || '23'}
                    </div>
                  </div>

                  <div className="w-px h-12 bg-gray-200"></div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">
                      {lang === 'de' ? 'Bewertung' : 'Rating'}
                    </div>
                    <div className="font-bold text-gray-900">
                      {selectedSolution.metrics?.userRating || '4.5'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <p className="text-muted-foreground">{selectedSolution.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {selectedSolution.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Use Cases */}
                {selectedSolution.useCases && selectedSolution.useCases.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">
                      {lang === 'de' ? 'Anwendungsfälle' : 'Use Cases'}
                    </h4>
                    {selectedSolution.useCases.map((useCase, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h5 className="font-medium mb-2">{useCase.scenario}</h5>
                        <p className="text-sm text-muted-foreground mb-2">{useCase.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{lang === 'de' ? 'Potenzial' : 'Potential'}: {useCase.automationPotential}%</span>
                          <span>{lang === 'de' ? 'Aufwand' : 'Effort'}: {useCase.implementationEffort}</span>
                          <span>{lang === 'de' ? 'Zeitersparnis' : 'Time Savings'}: {useCase.estimatedTimeSavings}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}


              </TabsContent>

              <TabsContent value="implementation" className="space-y-6 mt-6">
                <div className="space-y-6">


                  {/* Implementation Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">
                      {lang === 'de' ? 'Implementierungsdetails' : 'Implementation Details'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lang === 'de' ? 'Schwierigkeit' : 'Difficulty'}
                          </span>
                          <Badge variant="outline">{selectedSolution.difficulty}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lang === 'de' ? 'Setup-Zeit' : 'Setup Time'}
                          </span>
                          <Badge variant="outline">{selectedSolution.setupTime}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lang === 'de' ? 'Deployment' : 'Deployment'}
                          </span>
                          <Badge variant="outline">{selectedSolution.deployment}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lang === 'de' ? 'Priorität' : 'Priority'}
                          </span>
                          <Badge variant="outline">{selectedSolution.implementationPriority}</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lang === 'de' ? 'ROI' : 'ROI'}
                          </span>
                          <span className="text-sm text-green-600">{selectedSolution.estimatedROI}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lang === 'de' ? 'Zeit bis zum Wert' : 'Time to Value'}
                          </span>
                          <span className="text-sm">{selectedSolution.timeToValue}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lang === 'de' ? 'Status' : 'Status'}
                          </span>
                          <Badge variant={selectedSolution.status === 'Active' ? 'default' : 'secondary'}>
                            {selectedSolution.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lang === 'de' ? 'Version' : 'Version'}
                          </span>
                          <span className="text-sm">{selectedSolution.version}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  {selectedSolution.requirements && selectedSolution.requirements.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">
                        {lang === 'de' ? 'Anforderungen' : 'Requirements'}
                      </h4>
                      {selectedSolution.requirements.map((req, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h5 className="font-medium mb-2">{req.category}</h5>
                          <div className="space-y-1">
                            {req.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${
                                  req.importance === 'Required' ? 'bg-red-500' : 'bg-yellow-500'
                                }`} />
                                <span>{item}</span>
                                <Badge variant="outline" className="text-xs">
                                  {req.importance}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}



                  {/* Professional Setup Section */}
                  <ProfessionalSetup lang={lang} />


                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Filters Modal */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {lang === 'de' ? 'Filter & Suche' : 'Filters & Search'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <SolutionFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              onClearFilters={clearFilters}
              availableOptions={{
                type: ['workflow', 'agent'],
                category: ['HR & Recruitment', 'Finance & Accounting', 'Marketing & Sales', 'Customer Support', 'Data Analysis', 'Content Creation', 'Project Management', 'Development & DevOps', 'Research & Analysis', 'Communication', 'General Business'],
                difficulty: ['Beginner', 'Intermediate', 'Advanced'],
                setupTime: ['Quick', 'Medium', 'Long'],
                deployment: ['Local', 'Cloud', 'Hybrid'],
                status: ['Active', 'Inactive', 'Deprecated', 'Beta'],
                implementationPriority: ['High', 'Medium', 'Low'],
                tags: ['hr', 'finance', 'marketing', 'automation', 'ai', 'workflow'],
                priceRange: ['Free', 'Freemium', 'Paid', 'Enterprise']
              }}
            />
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={clearFilters}>
                {lang === 'de' ? 'Alle Filter löschen' : 'Clear all filters'}
              </Button>
              <Button onClick={() => setShowFiltersModal(false)}>
                {lang === 'de' ? 'Schließen' : 'Close'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock data generation - replace with actual API calls
function generateMockSolutions(): Solution[] {
  const mockWorkflows: Solution[] = [
    {
      id: 'workflow-1',
      name: 'HR Onboarding Automation',
      description: 'Automated workflow for new employee onboarding process',
      type: 'workflow',
      category: 'HR & Recruitment',
      subcategories: ['onboarding', 'hr-processes'],
      difficulty: 'Intermediate',
      setupTime: 'Medium',
      deployment: 'Cloud',
      status: 'Active',
      tags: ['hr', 'onboarding', 'automation'],
      automationPotential: 85,
      estimatedROI: '200-300%',
      timeToValue: '2-4 weeks',
      implementationPriority: 'High',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      version: '1.0.0',
      author: 'Automation Team',
      requirements: [
        {
          category: 'System Access',
          items: ['HR system access', 'Email system access'],
          importance: 'Required'
        }
      ],
      useCases: [
        {
          scenario: 'New Employee Onboarding',
          description: 'Automate the complete onboarding process',
          automationPotential: 85,
          implementationEffort: 'Medium',
          expectedOutcome: 'Reduce onboarding time by 60%',
          prerequisites: ['HR system integration'],
          estimatedTimeSavings: '4-6 hours per employee',
          businessImpact: 'High'
        }
      ],
      integrations: [
        {
          platform: 'HR System',
          type: 'API',
          description: 'Integration with HR management system',
          setupComplexity: 'Medium',
          apiKeyRequired: true
        }
      ],
      metrics: {
        usageCount: 150,
        successRate: 95.5,
        averageExecutionTime: 120,
        errorRate: 2.1,
        userRating: 4.5,
        reviewCount: 23,
        lastUsed: new Date(),
        performanceScore: 88
      },
      workflow: {} as N8nWorkflow,
      workflowMetadata: {
        nodeCount: 12,
        triggerType: 'webhook',
        executionTime: '2-5 minutes',
        complexity: 'Moderate',
        dependencies: ['HR API', 'Email service'],
        estimatedExecutionTime: '3 minutes'
      }
    }
  ];

  const mockAgents: Solution[] = [
    {
      id: 'agent-1',
      name: 'Financial Advisor Agent',
      description: 'AI-powered financial analysis and reporting agent',
      type: 'agent',
      category: 'Finance & Accounting',
      subcategories: ['financial-analysis', 'reporting'],
      difficulty: 'Beginner',
      setupTime: 'Quick',
      deployment: 'Cloud',
      status: 'Active',
      tags: ['finance', 'ai', 'analysis'],
      automationPotential: 80,
      estimatedROI: '250-400%',
      timeToValue: '1-2 weeks',
      implementationPriority: 'High',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      version: '1.0.0',
      author: 'AI Solutions Team',
      requirements: [
        {
          category: 'API Access',
          items: ['OpenAI API key', 'Financial data access'],
          importance: 'Required'
        }
      ],
      useCases: [
        {
          scenario: 'Financial Report Generation',
          description: 'Automated financial report creation and analysis',
          automationPotential: 80,
          implementationEffort: 'Low',
          expectedOutcome: 'Generate reports 5x faster',
          prerequisites: ['Financial data sources'],
          estimatedTimeSavings: '8-12 hours per month',
          businessImpact: 'Medium'
        }
      ],
      integrations: [
        {
          platform: 'OpenAI',
          type: 'API',
          description: 'AI model integration for analysis',
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
