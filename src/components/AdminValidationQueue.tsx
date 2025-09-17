import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Plus, 
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  X,
  Zap,
  Settings,
  TestTube,
  Rocket,
  Monitor,
  Wrench,
  Tag,
  ListTodo,
  Database,
  Bot,
  Workflow,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  CheckSquare,
  Square,
  List,
  Grid,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import { 
  StepExtractionDatabaseService, 
  StoredImplementationStep, 
  StepExtractionStats 
} from '../lib/solutions/stepExtractionService';
import { ImplementationStep } from '../lib/solutions/stepExtraction';
import { WorkflowIndexer } from '../lib/workflowIndexer';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';

interface ValidationQueueItem {
  id: string;
  type: 'step' | 'domain';
  solution_id: string;
  solution_title: string;
  solution_type: 'workflow' | 'agent';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  admin_notes?: string;
  data: any; // Step data or domain override data
}

interface ValidationStats {
  total_pending: number;
  total_in_progress: number;
  total_completed: number;
  total_rejected: number;
  avg_processing_time: number;
  completion_rate: number;
  step_validations: number;
  domain_validations: number;
}

interface AdminValidationQueueProps {
  className?: string;
}

export function AdminValidationQueue({ className }: AdminValidationQueueProps) {
  const [validationItems, setValidationItems] = useState<ValidationQueueItem[]>([]);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<ValidationQueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'step' | 'domain'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'solution_title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedSteps, setSelectedSteps] = useState<StoredImplementationStep[]>([]);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [stepEditData, setStepEditData] = useState<Partial<ImplementationStep>>({});
  const [domainOverrideData, setDomainOverrideData] = useState<{
    domains: string[];
    domain_confidences: number[];
    admin_notes: string;
  }>({
    domains: [],
    domain_confidences: [],
    admin_notes: ''
  });
  const { toast } = useToast();

  // Load validation queue items
  const loadValidationQueue = async () => {
    try {
      setIsLoading(true);

      // Load pending step validations
      const pendingSteps = await StepExtractionDatabaseService.getPendingStepValidations();
      
      // Load domain overrides that need validation
      const { data: domainOverrides, error: domainError } = await supabase
        .from('domain_classification_cache')
        .select('*')
        .eq('admin_validated', false)
        .order('created_at', { ascending: false });

      if (domainError) {
        console.error('Error loading domain overrides:', domainError);
      }

      // Combine and format validation items
      const stepItems: ValidationQueueItem[] = pendingSteps.map(step => ({
        id: `step-${step.solution_id}`,
        type: 'step' as const,
        solution_id: step.solution_id,
        solution_title: step.solution_title || 'Unknown Solution',
        solution_type: step.solution_type as 'workflow' | 'agent',
        priority: step.step_count > 5 ? 'high' as const : step.step_count > 3 ? 'medium' as const : 'low' as const,
        status: 'pending' as const,
        created_at: step.created_at,
        updated_at: step.created_at,
        data: step
      }));

      const domainItems: ValidationQueueItem[] = (domainOverrides || []).map(override => ({
        id: `domain-${override.id}`,
        type: 'domain' as const,
        solution_id: override.solution_id || 'unknown',
        solution_title: override.title || 'Unknown Solution',
        solution_type: 'workflow' as const, // Default, could be enhanced
        priority: 'medium' as const,
        status: 'pending' as const,
        created_at: override.created_at,
        updated_at: override.updated_at,
        data: override
      }));

      const allItems = [...stepItems, ...domainItems];
      setValidationItems(allItems);

      // Calculate stats
      const validationStats: ValidationStats = {
        total_pending: allItems.filter(item => item.status === 'pending').length,
        total_in_progress: allItems.filter(item => item.status === 'in_progress').length,
        total_completed: allItems.filter(item => item.status === 'completed').length,
        total_rejected: allItems.filter(item => item.status === 'rejected').length,
        avg_processing_time: 0, // Could be calculated from historical data
        completion_rate: 0, // Could be calculated from historical data
        step_validations: stepItems.length,
        domain_validations: domainItems.length
      };

      setStats(validationStats);

    } catch (error) {
      console.error('Error loading validation queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load detailed data for selected item
  const loadItemDetails = async (item: ValidationQueueItem) => {
    try {
      setSelectedItem(item);

      if (item.type === 'step') {
        const steps = await StepExtractionDatabaseService.getImplementationSteps(item.solution_id);
        setSelectedSteps(steps);
      } else if (item.type === 'domain') {
        const domainData = item.data;
        setDomainOverrideData({
          domains: domainData.domains || [],
          domain_confidences: domainData.domain_confidences || [],
          admin_notes: domainData.admin_notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading item details:', error);
    }
  };

  // Validate step
  const validateStep = async (stepId: string, isValid: boolean, notes?: string) => {
    try {
      setIsProcessing(true);
      
      await StepExtractionDatabaseService.updateImplementationStep(stepId, {
        admin_validated: isValid,
        admin_notes: notes || '',
        admin_validated_at: new Date().toISOString()
      });

      // Reload validation queue
      await loadValidationQueue();
      setSelectedItem(null);
      setSelectedSteps([]);
    } catch (error) {
      console.error('Error validating step:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Validate domain override
  const validateDomainOverride = async (overrideId: number, isValid: boolean, notes?: string) => {
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('domain_classification_cache')
        .update({
          admin_validated: isValid,
          admin_notes: notes || '',
          admin_validated_at: new Date().toISOString()
        })
        .eq('id', overrideId);

      if (error) {
        console.error('Error validating domain override:', error);
        return;
      }

      // Reload validation queue
      await loadValidationQueue();
      setSelectedItem(null);
      setDomainOverrideData({
        domains: [],
        domain_confidences: [],
        admin_notes: ''
      });
    } catch (error) {
      console.error('Error validating domain override:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Force-generate steps for selected item
  const forceGenerateSelected = async () => {
    if (!selectedItem || selectedItem.type !== 'step') return;
    try {
      setIsProcessing(true);
      toast({ title: 'Generating steps…', description: `Solution ${selectedItem.solution_id}` });
      await StepExtractionDatabaseService.extractAndStoreSteps(
        selectedItem.solution_id,
        selectedItem.solution_type,
        selectedItem.solution_title || selectedItem.solution_id,
        ''
      );
      await loadValidationQueue();
      toast({ title: 'Steps generated', description: `Solution ${selectedItem.solution_id}` });
    } catch (error) {
      console.error('Force-generate failed:', error);
      toast({ title: 'Generation failed', description: 'See console for details' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Force-generate steps for all pending step items
  const forceGenerateAllPending = async () => {
    try {
      setIsProcessing(true);
      const stepItems = validationItems.filter(i => i.type === 'step');
      if (stepItems.length === 0) return;
      toast({ title: 'Generating steps for all pending…', description: `${stepItems.length} solutions` });
      for (const item of stepItems) {
        try {
          await StepExtractionDatabaseService.extractAndStoreSteps(
            item.solution_id,
            item.solution_type,
            item.solution_title || item.solution_id,
            ''
          );
        } catch (e) {
          console.warn('Generation failed for', item.solution_id, e);
        }
      }
      await loadValidationQueue();
      toast({ title: 'Generation complete', description: `${stepItems.length} solutions processed` });
    } catch (error) {
      console.error('Force-generate all failed:', error);
      toast({ title: 'Generation failed', description: 'See console for details' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Edit step
  const editStep = (step: StoredImplementationStep) => {
    setEditingStep(step.id);
    setStepEditData({
      title: step.step_title,
      description: step.step_description,
      category: step.step_category,
      estimatedTime: step.estimated_time,
      difficulty: step.difficulty_level,
      prerequisites: step.prerequisites,
      tools: step.tools_required
    });
  };

  // Save step edit
  const saveStepEdit = async (stepId: string) => {
    try {
      await StepExtractionDatabaseService.updateImplementationStep(stepId, stepEditData);
      setEditingStep(null);
      setStepEditData({});
      await loadItemDetails(selectedItem!);
    } catch (error) {
      console.error('Error saving step edit:', error);
    }
  };

  // Filter and sort items
  const filteredItems = validationItems
    .filter(item => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      if (searchQuery && !item.solution_title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'solution_title':
          comparison = a.solution_title.localeCompare(b.solution_title);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      low: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Settings },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: X }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Load data on component mount
  useEffect(() => {
    loadValidationQueue();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading validation queue...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Validation Queue</h2>
          <p className="text-muted-foreground">
            Validate LLM-extracted setup steps and domain classifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadValidationQueue}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={forceGenerateSelected}
            disabled={isProcessing || !selectedItem || selectedItem.type !== 'step'}
            variant="outline"
          >
            <Zap className="h-4 w-4 mr-2" />
            Force generate (selected)
          </Button>
          <Button
            onClick={forceGenerateAllPending}
            disabled={isProcessing || validationItems.filter(i => i.type === 'step').length === 0}
            variant="outline"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Force generate all pending
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.total_pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.total_in_progress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.total_completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.step_validations + stats.domain_validations}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search solutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="step">Steps</SelectItem>
                <SelectItem value="domain">Domains</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue List */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Queue ({filteredItems.length})</CardTitle>
            <CardDescription>
              Items awaiting admin validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedItem?.id === item.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => loadItemDetails(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'step' ? (
                        <ListTodo className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Tag className="h-4 w-4 text-purple-500" />
                      )}
                      <div>
                        <div className="font-medium">{item.solution_title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.type === 'step' ? 'Setup Steps' : 'Domain Classification'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(item.priority)}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No items found matching your filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Item Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedItem ? `Validate: ${selectedItem.solution_title}` : 'Select an item to validate'}
            </CardTitle>
            <CardDescription>
              {selectedItem ? `Review and validate ${selectedItem.type} data` : 'Choose an item from the queue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedItem ? (
              <Tabs defaultValue="details" className="w-full">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Solution ID</Label>
                    <Input value={selectedItem.solution_id} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="flex items-center gap-2">
                      {selectedItem.type === 'step' ? (
                        <ListTodo className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Tag className="h-4 w-4 text-purple-500" />
                      )}
                      <span>{selectedItem.type === 'step' ? 'Setup Steps' : 'Domain Classification'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    {getPriorityBadge(selectedItem.priority)}
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    {getStatusBadge(selectedItem.status)}
                  </div>
                </TabsContent>

                <TabsContent value="validation" className="space-y-4">
                  {selectedItem.type === 'step' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Implementation Steps ({selectedSteps.length})</Label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedSteps.map((step, index) => (
                            <div key={step.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">
                                  Step {index + 1}: {step.step_title}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => editStep(step)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => validateStep(step.id, true)}
                                    disabled={isProcessing}
                                  >
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => validateStep(step.id, false)}
                                    disabled={isProcessing}
                                  >
                                    <X className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {step.step_description}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary">{step.step_category}</Badge>
                                <Badge variant="secondary">{step.estimated_time}</Badge>
                                <Badge variant="secondary">{step.difficulty_level}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Domain Classification</Label>
                        <div className="space-y-2">
                          {domainOverrideData.domains.map((domain, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge variant="secondary">{domain}</Badge>
                              <span className="text-sm text-muted-foreground">
                                Confidence: {(domainOverrideData.domain_confidences[index] * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Admin Notes</Label>
                        <Textarea
                          value={domainOverrideData.admin_notes}
                          onChange={(e) => setDomainOverrideData(prev => ({
                            ...prev,
                            admin_notes: e.target.value
                          }))}
                          placeholder="Add validation notes..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => validateDomainOverride(selectedItem.data.id, true, domainOverrideData.admin_notes)}
                          disabled={isProcessing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => validateDomainOverride(selectedItem.data.id, false, domainOverrideData.admin_notes)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select an item from the queue to begin validation
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
