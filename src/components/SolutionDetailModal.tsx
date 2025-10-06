import React, { useState, useEffect } from 'react';
import { Solution } from '../types/solutions';
import SolutionIcon from './ui/SolutionIcon';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { StepExtractionDatabaseService, StoredImplementationStep } from '../lib/solutions/stepExtractionService';
import { 
  Star, 
  Clock, 
  TrendingUp, 
  Users, 
  Activity, 
  ExternalLink, 
  Play, 
  BookOpen, 
  Github,
  Download,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Tag,
  Building,
  User,
  Code,
  Database,
  Globe,
  Server,
  Timer,
  ThumbsUp,
  DollarSign,
  Send
} from 'lucide-react';
import { cn } from '../lib/utils';
import CreatorBadge from './CreatorBadge';

interface SolutionDetailModalProps {
  solution: Solution | null;
  isOpen: boolean;
  onClose: () => void;
  onImplement?: (solution: Solution) => void;
  onDeploy?: (solution: Solution) => void;
  isAdmin?: boolean; // New prop to determine if we're in admin area
}

export default function SolutionDetailModal({
  solution,
  isOpen,
  onClose,
  onImplement,
  onDeploy,
  isAdmin = false
}: SolutionDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [setupForm, setSetupForm] = useState({
    name: '',
    email: '',
    company: '',
    requirements: ''
  });
  const [implementationSteps, setImplementationSteps] = useState<StoredImplementationStep[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [fallbackStatus, setFallbackStatus] = useState<{
    isFallback: boolean;
    hasSteps: boolean;
    stepCount: number;
    lastUpdated?: string;
  } | null>(null);

  // Load implementation steps when solution changes
  useEffect(() => {
    if (solution && isOpen) {
      loadImplementationSteps();
    }
  }, [solution, isOpen]);

  const loadImplementationSteps = async () => {
    if (!solution) return;
    
    try {
      setLoadingSteps(true);
      let steps = await StepExtractionDatabaseService.getImplementationSteps(solution.id);
      // If no steps exist yet, trigger extraction and store as pending (admin_validated=false)
      if (!steps || steps.length === 0) {
        try {
          await StepExtractionDatabaseService.extractAndStoreSteps(
            solution.id,
            solution.type,
            solution.name,
            solution.description || ''
          );
          steps = await StepExtractionDatabaseService.getImplementationSteps(solution.id);
        } catch (e) {
          // Extraction is best-effort; fall back to empty and show fallback blocks
          console.warn('Step extraction failed, showing fallback info.', e);
        }
      }
      const status = await StepExtractionDatabaseService.getFallbackStatus(solution.id);
      
      setImplementationSteps(steps);
      setFallbackStatus(status);
    } catch (error) {
      console.error('Error loading implementation steps:', error);
      setImplementationSteps([]);
      setFallbackStatus({
        isFallback: true,
        hasSteps: false,
        stepCount: 0
      });
    } finally {
      setLoadingSteps(false);
    }
  };

  if (!solution) return null;

  const handleSetupRequest = () => {
    const subject = encodeURIComponent(`Einrichtungsanfrage: ${solution.name}`);
    const body = encodeURIComponent(`Hallo,\n\nich interessiere mich für die professionelle Einrichtung der Lösung "${solution.name}".\n\nMeine Details:\n- Name: ${setupForm.name}\n- E-Mail: ${setupForm.email}\n- Firma: ${setupForm.company || 'Nicht angegeben'}\n\nLösungs-Details:\n- Name: ${solution.name}\n- Beschreibung: ${solution.description}\n- Kategorie: ${solution.category}\n- Automatisierungspotenzial: ${solution.automationPotential}%\n- Geschätzter ROI: ${solution.estimatedROI}\n- Zeit bis zur Wertschöpfung: ${solution.timeToValue}\n\nMeine Anforderungen:\n${setupForm.requirements}\n\nBitte kontaktieren Sie mich für weitere Details.\n\nMit freundlichen Grüßen\n${setupForm.name}`);
    window.open(`mailto:setup@prom8eus.com?subject=${subject}&body=${body}`, '_blank');
    setShowSetupForm(false);
    setSetupForm({name: '', email: '', company: '', requirements: ''});
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}</span>
        <span className="text-sm text-muted-foreground">({solution.metrics?.reviewCount || 0} reviews)</span>
      </div>
    );
  };

  const renderAutomationPotential = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Automation Potential</span>
          <span className="text-lg font-bold text-primary">{solution.automationPotential}%</span>
        </div>
        <Progress value={solution.automationPotential} className="h-3" />
        <div className="text-xs text-muted-foreground">
          This solution can automate {solution.automationPotential}% of the related business process
        </div>
      </div>
    );
  };

  const renderKeyMetrics = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{solution.estimatedROI}</div>
          <div className="text-sm text-muted-foreground">Expected ROI</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{solution.timeToValue}</div>
          <div className="text-sm text-muted-foreground">Time to Value</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{solution.metrics?.successRate?.toFixed(1) || '0.0'}%</div>
          <div className="text-sm text-muted-foreground">Success Rate</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{solution.metrics?.usageCount || 0}</div>
          <div className="text-sm text-muted-foreground">Active Users</div>
        </div>
      </div>
    );
  };

  const renderRequirements = () => {
    return (
      <div className="space-y-3">
        {(solution.requirements || []).map((req, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={req.importance === 'Required' ? 'destructive' : 'secondary'}>
                {req.importance}
              </Badge>
              <span className="font-medium">{req.category}</span>
            </div>
            <ul className="space-y-1">
              {(req.items || []).map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
            {req.alternatives && req.alternatives.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">Alternatives: </span>
                <span className="text-xs">{req.alternatives.join(', ')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUseCases = () => {
    return (
      <div className="space-y-4">
        {(solution.useCases || []).map((useCase, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold">{useCase.scenario}</h4>
              <Badge variant="outline">{useCase.implementationEffort}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{useCase.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Expected Outcome:</span>
                <p className="text-muted-foreground">{useCase.expectedOutcome}</p>
              </div>
              <div>
                <span className="font-medium">Time Savings:</span>
                <p className="text-muted-foreground">{useCase.estimatedTimeSavings}</p>
              </div>
            </div>
            
            {(useCase.prerequisites || []).length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-sm font-medium">Prerequisites:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(useCase.prerequisites || []).map((prereq, prereqIndex) => (
                    <Badge key={prereqIndex} variant="secondary" className="text-xs">
                      {prereq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderIntegrations = () => {
    return (
      <div className="space-y-3">
        {(solution.integrations || []).map((integration, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded">
                {integration.type === 'API' && <Code className="h-4 w-4" />}
                {integration.type === 'Webhook' && <Zap className="h-4 w-4" />}
                {integration.type === 'Database' && <Database className="h-4 w-4" />}
                {integration.type === 'File' && <File className="h-4 w-4" />}
                {integration.type === 'Custom' && <Settings className="h-4 w-4" />}
              </div>
              <div>
                <div className="font-medium">{integration.platform}</div>
                <div className="text-sm text-muted-foreground">{integration.description}</div>
              </div>
            </div>
            
            <div className="text-right">
              <Badge variant={integration.setupComplexity === 'Low' ? 'default' : 'secondary'}>
                {integration.setupComplexity}
              </Badge>
              {integration.apiKeyRequired && (
                <div className="text-xs text-muted-foreground mt-1">API Key Required</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderImplementationSteps = () => {
    if (loadingSteps) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading implementation steps...</span>
          </div>
        </div>
      );
    }

    if (implementationSteps.length === 0) {
      return (
        <div className="space-y-6">
          {/* Fallback Message */}
          <div className="text-center py-6 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-amber-800 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Implementation Steps Not Available</p>
              <p className="text-sm text-amber-700 mt-1">
                {fallbackStatus?.isFallback 
                  ? 'LLM step extraction failed or returned generic steps. Showing essential information below.'
                  : 'LLM step extraction is in progress. Showing essential information below.'
                }
              </p>
              {fallbackStatus?.lastUpdated && (
                <p className="text-xs text-amber-600 mt-2">
                  Last updated: {new Date(fallbackStatus.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Fallback: Show Mandatory Fields */}
          <div className="space-y-6">
            {/* Prerequisites Section */}
            <div>
              <h4 className="font-medium mb-3">Prerequisites</h4>
              {renderPrerequisites()}
            </div>

            <Separator />

            {/* Source Information Section */}
            <div>
              <h4 className="font-medium mb-3">Source & Documentation</h4>
              {renderSourceInfo()}
            </div>

            <Separator />

            {/* Trigger Information Section */}
            <div>
              <h4 className="font-medium mb-3">Trigger Information</h4>
              {renderTriggerInfo()}
            </div>

            <Separator />

            {/* Setup Effort Section */}
            <div>
              <h4 className="font-medium mb-3">Setup Effort</h4>
              {renderSetupEffort()}
            </div>
          </div>

          {/* Fallback Implementation Guide */}
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-800">General Implementation Guide</h4>
            </div>
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mt-0.5">
                  1
                </div>
                <div>
                  <strong>Review Requirements:</strong> Ensure all prerequisites are met and you have access to required tools and platforms.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mt-0.5">
                  2
                </div>
                <div>
                  <strong>Set Up Environment:</strong> Configure your environment according to the setup effort requirements shown above.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mt-0.5">
                  3
                </div>
                <div>
                  <strong>Test Implementation:</strong> Test the solution with sample data to ensure it works correctly.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mt-0.5">
                  4
                </div>
                <div>
                  <strong>Deploy and Monitor:</strong> Deploy to production and monitor performance according to the trigger information.
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-600 bg-blue-100 p-2 rounded">
              <strong>Note:</strong> Detailed implementation steps will be available once LLM extraction is complete. 
              Contact support if you need immediate assistance with implementation.
            </div>
          </div>
        </div>
      );
    }

    const getCategoryIcon = (category: string) => {
      switch (category) {
        case 'setup': return <Settings className="h-4 w-4" />;
        case 'configuration': return <Settings className="h-4 w-4" />;
        case 'testing': return <Activity className="h-4 w-4" />;
        case 'deployment': return <Server className="h-4 w-4" />;
        case 'monitoring': return <Activity className="h-4 w-4" />;
        case 'maintenance': return <Settings className="h-4 w-4" />;
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
      <div className="space-y-6">
        <div className="space-y-4">
          {implementationSteps.map((step) => (
            <div key={step.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step_number}
                </div>
                <div className="flex-1">
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
                            {(step.prerequisites || []).map((prereq, index) => (
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
                            {(step.tools_required || []).map((tool, index) => (
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
              </div>
            </div>
          ))}
        </div>

        {/* Professional Setup Section - Only show in frontend, not admin */}
        {!isAdmin && (
          <div className="p-6 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold flex items-center gap-3 text-purple-900">
                <Zap className="w-5 h-5 text-purple-600" />
                Professionelle Einrichtung
              </h4>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-700 hover:bg-purple-100 px-4"
                onClick={() => setShowSetupForm(!showSetupForm)}
              >
                {showSetupForm ? 'Abbrechen' : 'Anfragen'}
              </Button>
            </div>
            
            {!showSetupForm && (
              <div className="space-y-4">
                <p className="text-sm text-purple-700 leading-relaxed">
                  Lassen Sie uns diese Automatisierung für Sie einrichten.
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
                    <span className="text-xs font-medium text-gray-700">Funktionsgarantie</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Geld zurück</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Zahlung bei Erfolg</span>
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
                    <span className="text-xs font-medium text-gray-700">Sofort startklar</span>
                  </div>
                </div>
              </div>
            )}

            {showSetupForm && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Name"
                    value={setupForm.name}
                    onChange={(e) => setSetupForm({...setupForm, name: e.target.value})}
                  />
                  <Input
                    placeholder="E-Mail"
                    type="email"
                    value={setupForm.email}
                    onChange={(e) => setSetupForm({...setupForm, email: e.target.value})}
                  />
                </div>
                <Input
                  placeholder="Firma (optional)"
                  value={setupForm.company}
                  onChange={(e) => setSetupForm({...setupForm, company: e.target.value})}
                />
                <Textarea
                  placeholder="Ihre Anforderungen und Kontext..."
                  value={setupForm.requirements}
                  onChange={(e) => setSetupForm({...setupForm, requirements: e.target.value})}
                  rows={3}
                />
                <Button 
                  className="w-full"
                  onClick={handleSetupRequest}
                  disabled={!setupForm.name || !setupForm.email}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Anfrage senden
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPrerequisites = () => {
    // Fixed: Added null checking for requirements array
    const prerequisites = (solution.requirements || [])
      .filter(req => req.importance === 'Required')
      .flatMap(req => req.items);
    
    if (prerequisites.length === 0) {
      return (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">No Prerequisites Required</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            This solution can be implemented without any special requirements.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <h4 className="font-medium text-amber-800">Prerequisites Required</h4>
        </div>
        <div className="space-y-2">
          {prerequisites.map((prereq, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex-shrink-0 w-5 h-5 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center text-xs font-bold text-amber-800">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-800">{prereq}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-amber-700 bg-amber-100 p-2 rounded">
          <strong>Note:</strong> All prerequisites must be met before implementing this solution.
        </div>
      </div>
    );
  };

  const renderSourceInfo = () => {
    const sourceLinks = [];
    
    if (solution.documentationUrl) {
      sourceLinks.push({
        label: 'Documentation',
        url: solution.documentationUrl,
        icon: <BookOpen className="h-4 w-4" />
      });
    }
    
    if (solution.githubUrl) {
      sourceLinks.push({
        label: 'Source Code',
        url: solution.githubUrl,
        icon: <Github className="h-4 w-4" />
      });
    }
    
    if (solution.demoUrl) {
      sourceLinks.push({
        label: 'Live Demo',
        url: solution.demoUrl,
        icon: <Play className="h-4 w-4" />
      });
    }

    if (sourceLinks.length === 0) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600">
            <Info className="h-5 w-5" />
            <span className="font-medium">No Source Links Available</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Source information is not available for this solution.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Source & Documentation</h4>
        </div>
        <div className="grid gap-2">
          {sourceLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {link.icon}
              <span className="font-medium text-blue-800">{link.label}</span>
              <ExternalLink className="h-3 w-3 text-blue-600 ml-auto" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  const renderTriggerInfo = () => {
    if (solution.type !== 'workflow') {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600">
            <Info className="h-5 w-5" />
            <span className="font-medium">Not Applicable</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Trigger information is only available for workflow solutions.
          </p>
        </div>
      );
    }

    const workflow = (solution as any).workflow;
    const triggerType = workflow?.workflowMetadata?.triggerType || 'Manual';
    const executionTime = workflow?.workflowMetadata?.estimatedExecutionTime || 'Unknown';

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <h4 className="font-medium text-purple-800">Workflow Trigger</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm font-medium text-purple-800">Trigger Type</div>
            <div className="text-lg font-bold text-purple-900 mt-1">{triggerType}</div>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm font-medium text-purple-800">Execution Time</div>
            <div className="text-lg font-bold text-purple-900 mt-1">{executionTime}</div>
          </div>
        </div>
        <div className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
          <strong>Note:</strong> This workflow will be triggered {triggerType.toLowerCase()} and typically takes {executionTime} to complete.
        </div>
      </div>
    );
  };

  const renderSetupEffort = () => {
    const setupTime = solution.setupTime;
    const difficulty = solution.difficulty;
    const complexity = solution.type === 'workflow' 
      ? (solution as any).workflow?.workflowMetadata?.complexity || 'Moderate'
      : 'Moderate';

    const getSetupTimeColor = (time: string) => {
      switch (time) {
        case 'Quick': return 'text-green-700 bg-green-50 border-green-200';
        case 'Medium': return 'text-amber-700 bg-amber-50 border-amber-200';
        case 'Long': return 'text-red-700 bg-red-50 border-red-200';
        default: return 'text-gray-700 bg-gray-50 border-gray-200';
      }
    };

    const getDifficultyColor = (diff: string) => {
      switch (diff) {
        case 'Beginner': return 'text-green-700 bg-green-50 border-green-200';
        case 'Intermediate': return 'text-amber-700 bg-amber-50 border-amber-200';
        case 'Advanced': return 'text-red-700 bg-red-50 border-red-200';
        default: return 'text-gray-700 bg-gray-50 border-gray-200';
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-600" />
          <h4 className="font-medium text-indigo-800">Setup Effort</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-3 border rounded-lg ${getSetupTimeColor(setupTime)}`}>
            <div className="text-sm font-medium">Setup Time</div>
            <div className="text-lg font-bold mt-1">{setupTime}</div>
          </div>
          <div className={`p-3 border rounded-lg ${getDifficultyColor(difficulty)}`}>
            <div className="text-sm font-medium">Difficulty</div>
            <div className="text-lg font-bold mt-1">{difficulty}</div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="text-sm font-medium text-indigo-800">Complexity</div>
            <div className="text-lg font-bold text-indigo-900 mt-1">{complexity}</div>
          </div>
        </div>
        <div className="text-xs text-indigo-700 bg-indigo-100 p-2 rounded">
          <strong>Implementation Guide:</strong> This solution requires {setupTime.toLowerCase()} setup time with {difficulty.toLowerCase()} difficulty level.
        </div>
      </div>
    );
  };

  const renderMetadata = () => {
    return (
      <div className="space-y-6">
        {/* Prerequisites Section */}
        <div>
          <h4 className="font-medium mb-3">Prerequisites</h4>
          {renderPrerequisites()}
        </div>

        <Separator />

        {/* Source Information Section */}
        <div>
          <h4 className="font-medium mb-3">Source & Documentation</h4>
          {renderSourceInfo()}
        </div>

        <Separator />

        {/* Trigger Information Section */}
        <div>
          <h4 className="font-medium mb-3">Trigger Information</h4>
          {renderTriggerInfo()}
        </div>

        <Separator />

        {/* Setup Effort Section */}
        <div>
          <h4 className="font-medium mb-3">Setup Effort</h4>
          {renderSetupEffort()}
        </div>

        <Separator />

        {/* Additional Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Author:</span>
              <span>{solution.author}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Created:</span>
              <span>{solution.createdAt?.toLocaleDateString() || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Version:</span>
              <span>{solution.version}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Category:</span>
              <span>{solution.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Deployment:</span>
              <span>{solution.deployment}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Status:</span>
              <span>{solution.status}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-2">Subcategories</h4>
          <div className="flex flex-wrap gap-2">
            {(solution.subcategories || []).map((subcategory, index) => (
              <Badge key={index} variant="outline">
                {subcategory}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {(solution.tags || []).map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderActions = () => {
    return (
      <div className="flex items-center gap-3">
        {solution.documentationUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={solution.documentationUrl} target="_blank" rel="noopener noreferrer">
              <BookOpen className="h-4 w-4 mr-2" />
              Documentation
            </a>
          </Button>
        )}
        
        {solution.demoUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={solution.demoUrl} target="_blank" rel="noopener noreferrer">
              <Play className="h-4 w-4 mr-2" />
              Demo
            </a>
          </Button>
        )}
        
        {solution.githubUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={solution.githubUrl} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </a>
          </Button>
        )}

        <div className="flex-1" />

        {onDeploy && (
          <Button variant="outline" size="sm" onClick={() => onDeploy(solution)}>
            <Server className="h-4 w-4 mr-2" />
            Deploy
          </Button>
        )}

        {onImplement && (
          <Button onClick={() => onImplement(solution)}>
            <Zap className="h-4 w-4 mr-2" />
            Implement Solution
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <SolutionIcon type={solution.type} size="lg" variant="filled" />
            <div className="flex-1">
              <DialogTitle className="text-xl">{solution.name}</DialogTitle>
              <div className="mt-2 flex items-center gap-3">
                <CreatorBadge
                  name={solution.author || (solution as any).authorName || 'Community'}
                  avatarUrl={(solution as any).authorAvatarUrl}
                  verified={(solution as any).authorVerified}
                />
              </div>
              <DialogDescription className="text-base mt-2">
                {solution.description}
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{solution.category}</Badge>
                <Badge variant={solution.implementationPriority === 'High' ? 'default' : 'secondary'}>
                  {solution.implementationPriority}
                </Badge>
              </div>
              {/* Fixed: Added null checking for metrics */}
              {solution.metrics?.userRating && renderStars(solution.metrics.userRating)}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="metadata">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderAutomationPotential()}
            {renderKeyMetrics()}
            
            <div>
              <h4 className="font-medium mb-3">Quick Stats</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-lg font-bold">{solution.metrics?.performanceScore || 'N/A'}</div>
                  <div className="text-muted-foreground">Performance Score</div>
                </div>
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-lg font-bold">{solution.metrics?.errorRate?.toFixed(1) || '0.0'}%</div>
                  <div className="text-muted-foreground">Error Rate</div>
                </div>
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-lg font-bold">{solution.metrics?.lastUsed?.toLocaleDateString() || 'N/A'}</div>
                  <div className="text-muted-foreground">Last Used</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prerequisites" className="space-y-6">
            {/* Prerequisites Section */}
            <div>
              <h4 className="font-medium mb-3">Prerequisites</h4>
              {renderPrerequisites()}
            </div>

            <Separator />

            {/* Source Information Section */}
            <div>
              <h4 className="font-medium mb-3">Source & Documentation</h4>
              {renderSourceInfo()}
            </div>

            <Separator />

            {/* Trigger Information Section */}
            <div>
              <h4 className="font-medium mb-3">Trigger Information</h4>
              {renderTriggerInfo()}
            </div>

            <Separator />

            {/* Setup Effort Section */}
            <div>
              <h4 className="font-medium mb-3">Setup Effort</h4>
              {renderSetupEffort()}
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Implementation Requirements</h4>
              {renderRequirements()}
            </div>
          </TabsContent>

          <TabsContent value="use-cases" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Business Use Cases</h4>
              {renderUseCases()}
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Required Integrations</h4>
              {renderIntegrations()}
            </div>
          </TabsContent>

          <TabsContent value="implementation" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Implementation Steps</h4>
              {renderImplementationSteps()}
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            {renderMetadata()}
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Solution ID: {solution.id}
          </div>
          {renderActions()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for File icon
function File({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}
