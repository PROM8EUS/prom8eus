import React, { useState } from 'react';
import { Solution } from '../types/solutions';
import SolutionIcon from './ui/SolutionIcon';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
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
  Server
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SolutionDetailModalProps {
  solution: Solution | null;
  isOpen: boolean;
  onClose: () => void;
  onImplement?: (solution: Solution) => void;
  onDeploy?: (solution: Solution) => void;
}

export default function SolutionDetailModal({
  solution,
  isOpen,
  onClose,
  onImplement,
  onDeploy
}: SolutionDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!solution) return null;

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
        <span className="text-sm text-muted-foreground">({solution.metrics.reviewCount} reviews)</span>
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
          <div className="text-2xl font-bold text-primary">{solution.metrics.successRate.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Success Rate</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{solution.metrics.usageCount}</div>
          <div className="text-sm text-muted-foreground">Active Users</div>
        </div>
      </div>
    );
  };

  const renderRequirements = () => {
    return (
      <div className="space-y-3">
        {solution.requirements.map((req, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={req.importance === 'Required' ? 'destructive' : 'secondary'}>
                {req.importance}
              </Badge>
              <span className="font-medium">{req.category}</span>
            </div>
            <ul className="space-y-1">
              {req.items.map((item, itemIndex) => (
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
        {solution.useCases.map((useCase, index) => (
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
            
            {useCase.prerequisites.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-sm font-medium">Prerequisites:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {useCase.prerequisites.map((prereq, prereqIndex) => (
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
        {solution.integrations.map((integration, index) => (
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
    const steps = [
      'Review solution requirements and prerequisites',
      'Set up necessary integrations and API keys',
      'Configure solution parameters and settings',
      'Test with sample data or scenarios',
      'Deploy to production environment',
      'Monitor performance and gather feedback'
    ];

    return (
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm">{step}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMetadata = () => {
    return (
      <div className="space-y-4">
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
              <span>{solution.createdAt.toLocaleDateString()}</span>
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
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Difficulty:</span>
              <span>{solution.difficulty}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Setup Time:</span>
              <span>{solution.setupTime}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-2">Subcategories</h4>
          <div className="flex flex-wrap gap-2">
            {solution.subcategories.map((subcategory, index) => (
              <Badge key={index} variant="outline">
                {subcategory}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {solution.tags.map((tag, index) => (
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
              {renderStars(solution.metrics.userRating)}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
            <TabsTrigger value="metadata">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderAutomationPotential()}
            {renderKeyMetrics()}
            
            <div>
              <h4 className="font-medium mb-3">Quick Stats</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-lg font-bold">{solution.metrics.performanceScore}</div>
                  <div className="text-muted-foreground">Performance Score</div>
                </div>
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-lg font-bold">{solution.metrics.errorRate.toFixed(1)}%</div>
                  <div className="text-muted-foreground">Error Rate</div>
                </div>
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-lg font-bold">{solution.metrics.lastUsed.toLocaleDateString()}</div>
                  <div className="text-muted-foreground">Last Used</div>
                </div>
              </div>
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
