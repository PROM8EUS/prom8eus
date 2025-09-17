import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, AlertCircle, Mail, User, Building, Clock, Euro, Wrench, FileText, Target } from 'lucide-react';

// Types
interface ImplementationRequestFormData {
  user_name: string;
  user_email: string;
  company: string;
  preferred_tools: string[];
  timeline: string;
  budget_range: string;
  additional_requirements: string;
}

interface TaskContext {
  task_description: string;
  subtasks: string[];
  automation_score: number;
  selected_workflow_ids: string[];
  selected_agent_ids: string[];
}

interface ImplementationRequestFormProps {
  taskContext?: TaskContext;
  onSuccess?: (requestId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Form options
const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'ASAP (Within 1 week)', description: 'Urgent implementation needed' },
  { value: '1-2-weeks', label: '1-2 weeks', description: 'Quick turnaround preferred' },
  { value: '1-month', label: '1 month', description: 'Standard timeline' },
  { value: '2-3-months', label: '2-3 months', description: 'Flexible timeline' },
  { value: '3+months', label: '3+ months', description: 'Long-term project' }
];

const BUDGET_OPTIONS = [
  { value: 'under-1k', label: 'Under €1,000', description: 'Simple automation' },
  { value: '1k-5k', label: '€1,000 - €5,000', description: 'Standard automation project' },
  { value: '5k-10k', label: '€5,000 - €10,000', description: 'Complex automation' },
  { value: '10k-25k', label: '€10,000 - €25,000', description: 'Enterprise automation' },
  { value: '25k+', label: '€25,000+', description: 'Large-scale implementation' },
  { value: 'discuss', label: 'Let\'s discuss', description: 'Budget to be determined' }
];

const TOOL_OPTIONS = [
  { value: 'n8n', label: 'n8n', description: 'Open-source workflow automation' },
  { value: 'zapier', label: 'Zapier', description: 'Popular workflow automation' },
  { value: 'make', label: 'Make (Integromat)', description: 'Visual automation platform' },
  { value: 'airtable', label: 'Airtable', description: 'Database and automation' },
  { value: 'notion', label: 'Notion', description: 'All-in-one workspace' },
  { value: 'slack', label: 'Slack', description: 'Team communication' },
  { value: 'microsoft-power-automate', label: 'Microsoft Power Automate', description: 'Microsoft ecosystem' },
  { value: 'google-apps-script', label: 'Google Apps Script', description: 'Google Workspace automation' },
  { value: 'python', label: 'Python', description: 'Custom scripting' },
  { value: 'javascript', label: 'JavaScript/Node.js', description: 'Web automation' },
  { value: 'other', label: 'Other', description: 'Specify in requirements' }
];

export function ImplementationRequestForm({ 
  taskContext, 
  onSuccess, 
  onError, 
  className = '' 
}: ImplementationRequestFormProps) {
  const [formData, setFormData] = useState<ImplementationRequestFormData>({
    user_name: '',
    user_email: '',
    company: '',
    preferred_tools: [],
    timeline: '',
    budget_range: '',
    additional_requirements: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Handle form field changes
  const handleInputChange = (field: keyof ImplementationRequestFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle tool selection
  const handleToolToggle = (toolValue: string) => {
    setSelectedTools(prev => {
      const newTools = prev.includes(toolValue) 
        ? prev.filter(t => t !== toolValue)
        : [...prev, toolValue];
      
      setFormData(prev => ({
        ...prev,
        preferred_tools: newTools
      }));
      
      return newTools;
    });
  };

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.user_name.trim()) {
      errors.push('Name is required');
    }
    
    if (!formData.user_email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user_email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!formData.timeline) {
      errors.push('Timeline is required');
    }
    
    if (!formData.budget_range) {
      errors.push('Budget range is required');
    }
    
    return errors;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setErrorMessage(errors.join(', '));
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const requestData = {
        ...formData,
        task_context: taskContext,
        user_agent: navigator.userAgent,
        referrer_url: document.referrer,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      };

      const response = await fetch('/api/implementation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setSubmitStatus('success');
      onSuccess?.(result.request_id);
      
      // Reset form
      setFormData({
        user_name: '',
        user_email: '',
        company: '',
        preferred_tools: [],
        timeline: '',
        budget_range: '',
        additional_requirements: ''
      });
      setSelectedTools([]);
      
    } catch (error) {
      console.error('Error submitting implementation request:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setSubmitStatus('error');
      onError?.(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render task context summary
  const renderTaskContext = () => {
    if (!taskContext) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Task Context
          </CardTitle>
          <CardDescription>
            This information will be automatically included with your request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Task Description</Label>
            <p className="text-sm text-muted-foreground mt-1">{taskContext.task_description}</p>
          </div>
          
          {taskContext.subtasks && taskContext.subtasks.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Subtasks</Label>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                {taskContext.subtasks.map((subtask, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{subtask}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div>
              <Label className="text-sm font-medium">Automation Score</Label>
              <Badge variant="secondary" className="ml-2">
                {taskContext.automation_score}/100
              </Badge>
            </div>
            
            {taskContext.selected_workflow_ids && taskContext.selected_workflow_ids.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Selected Workflows</Label>
                <Badge variant="outline" className="ml-2">
                  {taskContext.selected_workflow_ids.length}
                </Badge>
              </div>
            )}
            
            {taskContext.selected_agent_ids && taskContext.selected_agent_ids.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Selected Agents</Label>
                <Badge variant="outline" className="ml-2">
                  {taskContext.selected_agent_ids.length}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render success message
  const renderSuccessMessage = () => {
    if (submitStatus !== 'success') return null;

    return (
      <Alert className="mb-6 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Request submitted successfully!</strong> We've sent you a confirmation email and will contact you within 24 hours to discuss your implementation needs.
        </AlertDescription>
      </Alert>
    );
  };

  // Render error message
  const renderErrorMessage = () => {
    if (submitStatus !== 'error') return null;

    return (
      <Alert className="mb-6 border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Error submitting request:</strong> {errorMessage}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Request Implementation
          </CardTitle>
          <CardDescription>
            Get a personalized quote for implementing your automation solution. 
            We'll contact you within 24 hours to discuss your needs.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderTaskContext()}
          {renderSuccessMessage()}
          {renderErrorMessage()}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user_name">Full Name *</Label>
                  <Input
                    id="user_name"
                    type="text"
                    value={formData.user_name}
                    onChange={(e) => handleInputChange('user_name', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user_email">Email Address *</Label>
                  <Input
                    id="user_email"
                    type="email"
                    value={formData.user_email}
                    onChange={(e) => handleInputChange('user_email', e.target.value)}
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company (Optional)
                </Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
            </div>

            <Separator />

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Project Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeline *</Label>
                  <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Budget Range *
                  </Label>
                  <Select value={formData.budget_range} onValueChange={(value) => handleInputChange('budget_range', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Preferred Tools */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Preferred Tools
              </h3>
              <p className="text-sm text-muted-foreground">
                Select the tools you'd prefer to use (optional - we can recommend alternatives)
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TOOL_OPTIONS.map((tool) => (
                  <div key={tool.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={tool.value}
                      checked={selectedTools.includes(tool.value)}
                      onCheckedChange={() => handleToolToggle(tool.value)}
                    />
                    <Label htmlFor={tool.value} className="text-sm">
                      <div className="font-medium">{tool.label}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Additional Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Additional Requirements
              </h3>
              <p className="text-sm text-muted-foreground">
                Any specific requirements, constraints, or questions you'd like us to know about?
              </p>
              
              <Textarea
                value={formData.additional_requirements}
                onChange={(e) => handleInputChange('additional_requirements', e.target.value)}
                placeholder="e.g., Must integrate with our existing CRM, need training for our team, compliance requirements..."
                rows={4}
              />
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
