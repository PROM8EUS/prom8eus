import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
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
  Wrench
} from 'lucide-react';
import { 
  StepExtractionDatabaseService, 
  StoredImplementationStep, 
  StepExtractionStats 
} from '../lib/solutions/stepExtractionService';
import { ImplementationStep } from '../lib/solutions/stepExtraction';

interface ImplementationStepsManagementProps {
  className?: string;
}

export default function ImplementationStepsManagement({ className }: ImplementationStepsManagementProps) {
  const [stats, setStats] = useState<StepExtractionStats | null>(null);
  const [pendingSolutions, setPendingSolutions] = useState<Array<{
    solution_id: string;
    solution_type: string;
    step_count: number;
    created_at: string;
  }>>([]);
  const [selectedSolution, setSelectedSolution] = useState<string | null>(null);
  const [selectedSteps, setSelectedSteps] = useState<StoredImplementationStep[]>([]);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ImplementationStep>>({});
  const [validationNotes, setValidationNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStats();
    loadPendingSolutions();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await StepExtractionDatabaseService.getStepExtractionStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPendingSolutions = async () => {
    try {
      const pendingData = await StepExtractionDatabaseService.getSolutionsPendingValidation();
      setPendingSolutions(pendingData);
    } catch (error) {
      console.error('Error loading pending solutions:', error);
    }
  };

  const loadSolutionSteps = async (solutionId: string) => {
    try {
      setLoading(true);
      const steps = await StepExtractionDatabaseService.getImplementationSteps(solutionId);
      setSelectedSteps(steps);
      setSelectedSolution(solutionId);
    } catch (error) {
      console.error('Error loading solution steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateSteps = async (solutionId: string) => {
    try {
      setLoading(true);
      const adminUserId = 'admin-user-id'; // In real app, get from auth context
      await StepExtractionDatabaseService.validateSteps(solutionId, adminUserId, validationNotes);
      
      // Reload data
      await loadStats();
      await loadPendingSolutions();
      if (selectedSolution === solutionId) {
        await loadSolutionSteps(solutionId);
      }
      
      setValidationNotes('');
    } catch (error) {
      console.error('Error validating steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditingStep = (step: StoredImplementationStep) => {
    setEditingStep(step.id);
    setEditForm({
      step_title: step.step_title,
      step_description: step.step_description,
      step_category: step.step_category as any,
      estimated_time: step.estimated_time,
      difficulty_level: step.difficulty_level as any,
      prerequisites: step.prerequisites,
      tools_required: step.tools_required
    });
  };

  const saveStepEdit = async (stepId: string) => {
    try {
      setLoading(true);
      await StepExtractionDatabaseService.updateImplementationStep(stepId, editForm);
      
      // Reload steps
      if (selectedSolution) {
        await loadSolutionSteps(selectedSolution);
      }
      
      setEditingStep(null);
      setEditForm({});
    } catch (error) {
      console.error('Error saving step edit:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingStep(null);
    setEditForm({});
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'setup': return <Settings className="h-4 w-4" />;
      case 'configuration': return <Settings className="h-4 w-4" />;
      case 'testing': return <TestTube className="h-4 w-4" />;
      case 'deployment': return <Rocket className="h-4 w-4" />;
      case 'monitoring': return <Monitor className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'setup': return 'bg-blue-100 text-blue-800';
      case 'configuration': return 'bg-purple-100 text-purple-800';
      case 'testing': return 'bg-green-100 text-green-800';
      case 'deployment': return 'bg-orange-100 text-orange-800';
      case 'monitoring': return 'bg-cyan-100 text-cyan-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Implementation Steps Management</h2>
        <p className="text-muted-foreground">
          Manage and validate LLM-extracted implementation steps for solutions
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_solutions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">With Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.solutions_with_steps}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_steps}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Validated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.validated_steps}</div>
              <div className="text-xs text-muted-foreground">
                {stats.total_steps > 0 ? Math.round((stats.validated_steps / stats.total_steps) * 100) : 0}% of total
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Solutions Pending Validation
          </CardTitle>
          <CardDescription>
            {pendingSolutions.length} solutions have extracted steps that need admin validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingSolutions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>All implementation steps have been validated!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSolutions.map((solution) => (
                <div
                  key={solution.solution_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{solution.solution_type}</Badge>
                    <div>
                      <div className="font-medium">{solution.solution_id}</div>
                      <div className="text-sm text-muted-foreground">
                        {solution.step_count} steps • {new Date(solution.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSolutionSteps(solution.solution_id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Steps
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Solution Steps */}
      {selectedSolution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Implementation Steps: {selectedSolution}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSolution(null)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
                <Button
                  onClick={() => validateSteps(selectedSolution)}
                  disabled={loading || selectedSteps.every(step => step.admin_validated)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate All Steps
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading steps...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Validation Notes */}
                <div>
                  <Label htmlFor="validation-notes">Validation Notes (Optional)</Label>
                  <Textarea
                    id="validation-notes"
                    placeholder="Add any notes about the validation process..."
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Steps List */}
                <div className="space-y-3">
                  {selectedSteps.map((step) => (
                    <div
                      key={step.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {step.step_number}
                          </div>
                          <div className="flex-1">
                            {editingStep === step.id ? (
                              <div className="space-y-3">
                                <Input
                                  value={editForm.step_title || ''}
                                  onChange={(e) => setEditForm({...editForm, step_title: e.target.value})}
                                  placeholder="Step title"
                                />
                                <Textarea
                                  value={editForm.step_description || ''}
                                  onChange={(e) => setEditForm({...editForm, step_description: e.target.value})}
                                  placeholder="Step description"
                                  rows={3}
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveStepEdit(step.id)}
                                    disabled={loading}
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEdit}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{step.step_title}</h4>
                                  {step.admin_validated && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Validated
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {step.step_description}
                                </p>
                                
                                {/* Step Details */}
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className={getCategoryColor(step.step_category)}>
                                    {getCategoryIcon(step.step_category)}
                                    <span className="ml-1 capitalize">{step.step_category}</span>
                                  </Badge>
                                  {step.estimated_time && (
                                    <Badge variant="outline">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {step.estimated_time}
                                    </Badge>
                                  )}
                                  {step.difficulty_level && (
                                    <Badge className={getDifficultyColor(step.difficulty_level)}>
                                      {step.difficulty_level}
                                    </Badge>
                                  )}
                                </div>

                                {/* Prerequisites and Tools */}
                                {(step.prerequisites?.length || step.tools_required?.length) && (
                                  <div className="space-y-2">
                                    {step.prerequisites?.length && (
                                      <div>
                                        <span className="text-xs font-medium text-muted-foreground">Prerequisites:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {step.prerequisites.map((prereq, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                              {prereq}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {step.tools_required?.length && (
                                      <div>
                                        <span className="text-xs font-medium text-muted-foreground">Tools Required:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {step.tools_required.map((tool, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {tool}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!editingStep && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingStep(step)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
