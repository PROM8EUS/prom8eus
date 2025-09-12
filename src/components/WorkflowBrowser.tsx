import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Eye, Filter, Zap, Clock, Play, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { workflowIndexer, WorkflowIndex, WorkflowStats, WorkflowSearchParams } from '@/lib/workflowIndexer';
import SolutionCard, { SolutionData } from './SolutionCard';
import SolutionDetailModal from './SolutionDetailModal';
import { Solution, WorkflowSolution } from '@/types/solutions';
import WorkflowRefreshControls from './WorkflowRefreshControls';

interface WorkflowBrowserProps {
  className?: string;
  sourceFilter?: string;
  isAdmin?: boolean; // New prop to determine if we're in admin area
}

export function WorkflowBrowser({ className, sourceFilter, isAdmin = false }: WorkflowBrowserProps) {
  const [workflows, setWorkflows] = useState<WorkflowIndex[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<WorkflowSearchParams>({
    limit: 20,
    offset: 0
  });
  const [total, setTotal] = useState(0);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowIndex | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadStats();
    loadWorkflows();
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [searchParams, sourceFilter]);

  const loadStats = async () => {
    try {
      const statsData = await workflowIndexer.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      // Add source filter to search params if provided
      const params = sourceFilter ? { ...searchParams, source: sourceFilter } : searchParams;
      const result = await workflowIndexer.searchWorkflows(params);
      
      setWorkflows(result.workflows);
      setTotal(result.total);
      
      // Reload stats after loading workflows to get updated statistics
      const updatedStats = await workflowIndexer.getStats();
      setStats(updatedStats);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({
      ...prev,
      q: query || undefined,
      offset: 0
    }));
  };

  const handleFilterChange = (key: keyof WorkflowSearchParams, value: string | boolean | undefined) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value,
      offset: 0
    }));
  };


  const handleWorkflowClick = (workflow: WorkflowIndex) => {
    setSelectedWorkflow(workflow);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkflow(null);
  };

  const handleRefresh = () => {
    // Reload workflows and stats after refresh
    loadWorkflows();
    loadStats();
  };

  // Pagination helpers
  const currentPage = Math.floor((searchParams.offset || 0) / (searchParams.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (searchParams.limit || 20));
  const limit = searchParams.limit || 20;

  const goToPage = (page: number) => {
    const newOffset = (page - 1) * limit;
    setSearchParams(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (newLimit: string) => {
    const limit = parseInt(newLimit);
    setSearchParams(prev => ({
      ...prev,
      limit,
      offset: 0 // Reset to first page when changing items per page
    }));
  };


  const convertWorkflowToSolution = (workflow: WorkflowIndex): SolutionData => {
    return {
      id: workflow.id.toString(),
      name: workflow.name,
      filename: workflow.filename,
      description: workflow.description,
      category: workflow.category,
      priority: workflow.complexity === 'High' ? 'High' : workflow.complexity === 'Medium' ? 'Medium' : 'Low',
      type: 'workflow',
      
      // Workflow specific shown on card
      triggerType: workflow.triggerType,
      complexity: workflow.complexity,
      integrations: workflow.integrations,
      tags: workflow.tags,
      
      // Common
      active: workflow.active,
      lastUpdated: workflow.analyzedAt,
      
      // Author for CreatorBadge
      authorName: workflow.authorName || workflow.authorUsername || 'Community',
      authorAvatarUrl: workflow.authorAvatar,
      authorVerified: workflow.authorVerified,
      pricing: 'Free'
    };
  };

  const convertWorkflowToSolutionForModal = (workflow: WorkflowIndex): Solution => {
    const mockN8nWorkflow = {
      id: workflow.id.toString(),
      name: workflow.name,
      active: workflow.active,
      nodes: [],
      connections: {},
      settings: {},
      staticData: {},
      meta: {},
      pinData: {},
      versionId: '1',
      triggerCount: 1,
      tags: workflow.tags
    };

    // Calculate automation potential based on real workflow data
    const automationPotential = Math.min(95, Math.max(60, 
      (workflow.nodeCount * 5) + 
      (workflow.integrations.length * 8) + 
      (workflow.complexity === 'High' ? 20 : workflow.complexity === 'Medium' ? 10 : 5)
    ));

    // Calculate ROI based on complexity and integrations
    const baseROI = workflow.complexity === 'High' ? 300 : workflow.complexity === 'Medium' ? 200 : 150;
    const integrationBonus = workflow.integrations.length * 25;
    const estimatedROI = `${baseROI}-${baseROI + integrationBonus}%`;

    // Calculate time to value based on complexity
    const timeToValue = workflow.complexity === 'High' ? '2-4 weeks' : 
                       workflow.complexity === 'Medium' ? '1-2 weeks' : '3-7 days';

    return {
      id: workflow.id.toString(),
      name: workflow.name,
      description: workflow.description,
      type: 'workflow' as const,
      category: workflow.category as any,
      subcategories: [workflow.category],
      difficulty: workflow.complexity === 'High' ? 'Advanced' : workflow.complexity === 'Medium' ? 'Intermediate' : 'Beginner',
      setupTime: workflow.complexity === 'High' ? 'Long' : workflow.complexity === 'Medium' ? 'Medium' : 'Quick',
      deployment: 'Cloud' as const,
      status: workflow.active ? 'Active' : 'Inactive',
      tags: workflow.tags,
      automationPotential: Math.round(automationPotential),
      estimatedROI,
      timeToValue,
      implementationPriority: workflow.complexity === 'High' ? 'High' : workflow.complexity === 'Medium' ? 'Medium' : 'Low',
      createdAt: new Date(workflow.analyzedAt),
      updatedAt: new Date(workflow.analyzedAt),
      version: '1.0.0',
      author: workflow.authorName || workflow.authorUsername || 'Community',
      authorUsername: workflow.authorUsername,
      authorAvatarUrl: workflow.authorAvatar,
      authorVerified: workflow.authorVerified,
      documentationUrl: `https://github.com/Zie619/n8n-workflows/blob/main/workflows/${workflow.filename}`,
      demoUrl: `https://n8n.io/workflows/${workflow.id}`,
      githubUrl: `https://github.com/Zie619/n8n-workflows/blob/main/workflows/${workflow.filename}`,
      pricing: 'Free',
      requirements: [
        {
          category: 'Integrations',
          items: workflow.integrations,
          importance: 'Required' as const,
          alternatives: []
        },
        {
          category: 'Technical Requirements',
          items: [
            'n8n instance (self-hosted or cloud)',
            'API access to integrated services',
            'Basic understanding of workflow automation'
          ],
          importance: 'Required' as const,
          alternatives: []
        }
      ],
      useCases: [
        {
          scenario: workflow.name,
          description: workflow.description,
          automationPotential: Math.round(automationPotential),
          implementationEffort: workflow.complexity === 'High' ? 'High' : workflow.complexity === 'Medium' ? 'Medium' : 'Low',
          expectedOutcome: 'Improved efficiency and automation of business processes',
          prerequisites: workflow.integrations,
          estimatedTimeSavings: `${Math.floor(workflow.nodeCount / 2) + 1}-${Math.floor(workflow.nodeCount / 2) + 4} hours per week`,
          businessImpact: 'High' as const
        }
      ],
      integrations: workflow.integrations.map(integration => ({
        platform: integration,
        type: 'API' as const,
        description: `Integration with ${integration} for data exchange and automation`,
        setupComplexity: workflow.complexity === 'High' ? 'High' : 'Medium' as const,
        apiKeyRequired: true
      })),
      metrics: {
        usageCount: Math.floor(workflow.nodeCount * 10) + 25,
        successRate: Math.min(99, Math.max(85, 100 - (workflow.complexity === 'High' ? 10 : workflow.complexity === 'Medium' ? 5 : 2))),
        averageExecutionTime: Math.floor(workflow.nodeCount * 2) + 30,
        errorRate: workflow.complexity === 'High' ? 3 : workflow.complexity === 'Medium' ? 2 : 1,
        userRating: Math.min(5, Math.max(3.5, 4.5 - (workflow.complexity === 'High' ? 0.5 : workflow.complexity === 'Medium' ? 0.2 : 0))),
        reviewCount: Math.floor(workflow.nodeCount * 3) + 5,
        lastUsed: new Date(workflow.analyzedAt),
        performanceScore: Math.round(automationPotential)
      },
      workflow: mockN8nWorkflow,
      workflowMetadata: {
        nodeCount: workflow.nodeCount,
        triggerType: workflow.triggerType,
        executionTime: `${Math.floor(workflow.nodeCount * 1.5) + 15}s`,
        complexity: workflow.complexity === 'High' ? 'Complex' : workflow.complexity === 'Medium' ? 'Moderate' : 'Simple',
        dependencies: workflow.integrations,
        estimatedExecutionTime: `${Math.floor(workflow.nodeCount * 1.5) + 15}s`
      }
    };
  };

  const handleViewSolution = (solution: SolutionData) => {
    console.log('View solution:', solution);
    // TODO: Implement view modal
  };

  const handleDownloadSolution = (solution: SolutionData) => {
    console.log('Download solution:', solution);
    // TODO: Implement download functionality
  };

  const categories = workflowIndexer.getCategories();
  const categoryDisplayNames = workflowIndexer.getCategoryDisplayNames();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Workflow Refresh Controls - only show in admin */}
      {isAdmin && <WorkflowRefreshControls onRefresh={handleRefresh} source={sourceFilter} />}

      {/* Inline Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          {/* Search Input - Left */}
          <div className="flex-1">
            <Input
              placeholder="Search workflows by name, description, or integration..."
              value={searchParams.q || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Filters - Right */}
          <div className="flex items-center gap-3">
            <Select
              value={searchParams.trigger || 'all'}
              onValueChange={(value) => handleFilterChange('trigger', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Trigger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Triggers</SelectItem>
                <SelectItem value="Webhook">Webhook</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Complex">Complex</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={searchParams.complexity || 'all'}
              onValueChange={(value) => handleFilterChange('complexity', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={searchParams.category || 'all'}
              onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {categoryDisplayNames[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={searchParams.active === undefined ? 'all' : searchParams.active.toString()}
              onValueChange={(value) => handleFilterChange('active', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger className="h-9 w-24">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            {loading ? 'Loading...' : `${total.toLocaleString()} workflows found`}
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <div 
                  key={workflow.id}
                  className="cursor-pointer"
                  onClick={() => handleWorkflowClick(workflow)}
                >
                  <SolutionCard
                    solution={convertWorkflowToSolution(workflow)}
                    onView={() => handleWorkflowClick(workflow)}
                    isAdmin={isAdmin}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {workflows.length > 0 && total > 0 && (
              <div className="flex items-center justify-between mt-6">
                {/* Left: Items per page */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <Select
                    value={limit.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className="h-8 w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>
                
                {/* Center: Showing info */}
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total.toLocaleString()} workflows
                </div>
                
                {/* Right: Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage <= 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const showEllipsis = totalPages > 7;
                        
                        // Always show first page
                        pages.push(
                          <Button
                            key={1}
                            variant={currentPage === 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(1)}
                            className="w-8 h-8 p-0"
                          >
                            1
                          </Button>
                        );
                        
                        if (showEllipsis && currentPage > 4) {
                          pages.push(<span key="ellipsis1" className="text-gray-400">...</span>);
                        }
                        
                        // Show pages around current page
                        const startPage = Math.max(2, currentPage - 1);
                        const endPage = Math.min(totalPages - 1, currentPage + 1);
                        
                        for (let page = startPage; page <= endPage; page++) {
                          if (page !== 1 && page !== totalPages) {
                            pages.push(
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            );
                          }
                        }
                        
                        if (showEllipsis && currentPage < totalPages - 3) {
                          pages.push(<span key="ellipsis2" className="text-gray-400">...</span>);
                        }
                        
                        // Always show last page (if more than 1 page)
                        if (totalPages > 1) {
                          pages.push(
                            <Button
                              key={totalPages}
                              variant={currentPage === totalPages ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(totalPages)}
                              className="w-8 h-8 p-0"
                            >
                              {totalPages}
                            </Button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage >= totalPages}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <SolutionDetailModal
          solution={convertWorkflowToSolutionForModal(selectedWorkflow)}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onImplement={(solution) => {
            console.log('Implement solution:', solution);
            // TODO: Implement solution logic
          }}
          onDeploy={(solution) => {
            console.log('Deploy solution:', solution);
            // TODO: Deploy solution logic
          }}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
