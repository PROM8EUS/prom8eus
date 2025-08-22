import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Settings, 
  CheckCircle,
  ArrowRight,
  Search,
  Filter,
  Zap,
  Target,
  BarChart3,
  Download
} from 'lucide-react';
import { MARKETING_WORKFLOWS } from '../lib/workflows/marketingWorkflows';
import { FINANCE_WORKFLOWS } from '../lib/workflows/financeWorkflows';
import { HEALTHCARE_WORKFLOWS } from '../lib/workflows/healthcareWorkflows';
import type { WorkflowTemplate } from '../lib/workflows/marketingWorkflows';

interface WorkflowTemplatesProps {
  className?: string;
  lang?: 'de' | 'en';
}

const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({
  className = '',
  lang = 'de'
}) => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);

  // Combine all workflows
  const allWorkflows = useMemo(() => {
    return [
      ...MARKETING_WORKFLOWS.map(w => ({ ...w, source: 'marketing' })),
      ...FINANCE_WORKFLOWS.map(w => ({ ...w, source: 'finance' })),
      ...HEALTHCARE_WORKFLOWS.map(w => ({ ...w, source: 'healthcare' }))
    ];
  }, []);

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return allWorkflows.filter(workflow => {
      const matchesIndustry = selectedIndustry === 'all' || workflow.industry.includes(selectedIndustry);
      const matchesCategory = selectedCategory === 'all' || workflow.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        workflow.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesIndustry && matchesCategory && matchesSearch;
    });
  }, [allWorkflows, selectedIndustry, selectedCategory, searchQuery]);

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'marketing': return <Target className="w-4 h-4" />;
      case 'finance': return <DollarSign className="w-4 h-4" />;
      case 'healthcare': return <Users className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalROI = (workflow: WorkflowTemplate) => {
    const monthlyTimeSavings = workflow.estimatedTimeSavings * 4;
    const hourlyRate = workflow.source === 'finance' ? 80 : workflow.source === 'healthcare' ? 70 : 60;
    const monthlyCostSavings = monthlyTimeSavings * hourlyRate;
    return monthlyCostSavings + workflow.estimatedCostSavings;
  };

  const handleDownloadWorkflow = (workflow: WorkflowTemplate) => {
    // Create workflow JSON for download
    const workflowData = {
      id: workflow.id,
      title: workflow.title,
      description: workflow.description,
      category: workflow.category,
      difficulty: workflow.difficulty,
      estimatedTimeSavings: workflow.estimatedTimeSavings,
      estimatedCostSavings: workflow.estimatedCostSavings,
      tools: workflow.tools,
      industry: workflow.industry,
      tags: workflow.tags,
      prerequisites: workflow.prerequisites,
      steps: workflow.steps,
      source: workflow.source
    };

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow.id}_workflow.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          {lang === 'de' ? 'AI Workflow Templates' : 'AI Workflow Templates'}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {lang === 'de' 
            ? 'Vorgefertigte Automatisierungsworkflows für verschiedene Branchen. Sparen Sie Zeit und Kosten mit bewährten AI-Tool-Kombinationen.'
            : 'Pre-built automation workflows for various industries. Save time and costs with proven AI tool combinations.'
          }
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={lang === 'de' ? 'Workflows durchsuchen...' : 'Search workflows...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={lang === 'de' ? 'Branche' : 'Industry'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'de' ? 'Alle Branchen' : 'All Industries'}</SelectItem>
            <SelectItem value="marketing">{lang === 'de' ? 'Marketing & Sales' : 'Marketing & Sales'}</SelectItem>
            <SelectItem value="finance">{lang === 'de' ? 'Finanzwesen' : 'Finance'}</SelectItem>
            <SelectItem value="healthcare">{lang === 'de' ? 'Gesundheitswesen' : 'Healthcare'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={lang === 'de' ? 'Kategorie' : 'Category'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'de' ? 'Alle Kategorien' : 'All Categories'}</SelectItem>
            <SelectItem value="basic">{lang === 'de' ? 'Basic' : 'Basic'}</SelectItem>
            <SelectItem value="intermediate">{lang === 'de' ? 'Intermediate' : 'Intermediate'}</SelectItem>
            <SelectItem value="advanced">{lang === 'de' ? 'Advanced' : 'Advanced'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {lang === 'de' 
          ? `${filteredWorkflows.length} Workflow${filteredWorkflows.length !== 1 ? 's' : ''} gefunden`
          : `${filteredWorkflows.length} workflow${filteredWorkflows.length !== 1 ? 's' : ''} found`
        }
      </div>

      {/* Workflow Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkflows.map((workflow) => (
          <Card 
            key={workflow.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedWorkflow(workflow)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getIndustryIcon(workflow.source)}
                  <Badge variant="outline" className="text-xs">
                    {workflow.source === 'marketing' ? (lang === 'de' ? 'Marketing' : 'Marketing') :
                     workflow.source === 'finance' ? (lang === 'de' ? 'Finance' : 'Finance') :
                     workflow.source === 'healthcare' ? (lang === 'de' ? 'Healthcare' : 'Healthcare') : workflow.source}
                  </Badge>
                </div>
                <Badge className={`text-xs ${getDifficultyColor(workflow.difficulty)}`}>
                  {workflow.difficulty === 'easy' ? (lang === 'de' ? 'Einfach' : 'Easy') :
                   workflow.difficulty === 'medium' ? (lang === 'de' ? 'Mittel' : 'Medium') :
                   workflow.difficulty === 'hard' ? (lang === 'de' ? 'Schwer' : 'Hard') : workflow.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-lg">{workflow.title}</CardTitle>
              <CardDescription className="text-sm">
                {workflow.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ROI Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {workflow.estimatedTimeSavings}h/{lang === 'de' ? 'Woche' : 'week'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {lang === 'de' ? 'Zeitersparnis' : 'Time saved'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      €{calculateTotalROI(workflow).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {lang === 'de' ? 'Monatlicher ROI' : 'Monthly ROI'}
                  </p>
                </div>
              </div>

              {/* Tools */}
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">
                  {lang === 'de' ? 'Verwendete Tools:' : 'Tools used:'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {workflow.tools.slice(0, 3).map((tool) => (
                    <Badge key={tool} variant="secondary" className="text-xs">
                      {tool.replace('-ai', ' AI')}
                    </Badge>
                  ))}
                  {workflow.tools.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{workflow.tools.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {workflow.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkflow(workflow);
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {lang === 'de' ? 'Details' : 'Details'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadWorkflow(workflow);
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Detail Modal */}
      <Dialog open={!!selectedWorkflow} onOpenChange={(open) => !open && setSelectedWorkflow(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedWorkflow && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getIndustryIcon(selectedWorkflow.source)}
                  <Badge variant="outline">
                    {selectedWorkflow.source === 'marketing' ? (lang === 'de' ? 'Marketing' : 'Marketing') :
                     selectedWorkflow.source === 'finance' ? (lang === 'de' ? 'Finance' : 'Finance') :
                     selectedWorkflow.source === 'healthcare' ? (lang === 'de' ? 'Healthcare' : 'Healthcare') : selectedWorkflow.source}
                  </Badge>
                  <Badge className={getCategoryColor(selectedWorkflow.category)}>
                    {selectedWorkflow.category === 'basic' ? (lang === 'de' ? 'Basic' : 'Basic') :
                     selectedWorkflow.category === 'intermediate' ? (lang === 'de' ? 'Intermediate' : 'Intermediate') :
                     selectedWorkflow.category === 'advanced' ? (lang === 'de' ? 'Advanced' : 'Advanced') : selectedWorkflow.category}
                  </Badge>
                  <Badge className={getDifficultyColor(selectedWorkflow.difficulty)}>
                    {selectedWorkflow.difficulty === 'easy' ? (lang === 'de' ? 'Einfach' : 'Easy') :
                     selectedWorkflow.difficulty === 'medium' ? (lang === 'de' ? 'Mittel' : 'Medium') :
                     selectedWorkflow.difficulty === 'hard' ? (lang === 'de' ? 'Schwer' : 'Hard') : selectedWorkflow.difficulty}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedWorkflow.title}</DialogTitle>
                <p className="text-gray-600">{selectedWorkflow.description}</p>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">{lang === 'de' ? 'Übersicht' : 'Overview'}</TabsTrigger>
                  <TabsTrigger value="steps">{lang === 'de' ? 'Schritte' : 'Steps'}</TabsTrigger>
                  <TabsTrigger value="tools">{lang === 'de' ? 'Tools' : 'Tools'}</TabsTrigger>
                  <TabsTrigger value="roi">{lang === 'de' ? 'ROI' : 'ROI'}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-green-600">
                          <Clock className="w-5 h-5" />
                          <span className="text-lg font-semibold">{selectedWorkflow.estimatedTimeSavings}h</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {lang === 'de' ? 'Zeitersparnis pro Woche' : 'Time saved per week'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-blue-600">
                          <DollarSign className="w-5 h-5" />
                          <span className="text-lg font-semibold">€{calculateTotalROI(selectedWorkflow).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {lang === 'de' ? 'Monatlicher ROI' : 'Monthly ROI'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-purple-600">
                          <Zap className="w-5 h-5" />
                          <span className="text-lg font-semibold">{selectedWorkflow.steps.length}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {lang === 'de' ? 'Workflow-Schritte' : 'Workflow steps'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      {lang === 'de' ? 'Voraussetzungen' : 'Prerequisites'}
                    </h4>
                    <ul className="space-y-1">
                      {selectedWorkflow.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {prereq}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      {lang === 'de' ? 'Tags' : 'Tags'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedWorkflow.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="steps" className="space-y-4">
                  <div className="space-y-4">
                    {selectedWorkflow.steps.map((step, index) => (
                      <Card key={step.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{step.title}</CardTitle>
                                <CardDescription>{step.description}</CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {step.automationLevel === 'manual' ? (lang === 'de' ? 'Manuell' : 'Manual') :
                               step.automationLevel === 'semi-automated' ? (lang === 'de' ? 'Semi-automatisiert' : 'Semi-automated') :
                               step.automationLevel === 'fully-automated' ? (lang === 'de' ? 'Vollautomatisiert' : 'Fully automated') : step.automationLevel}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {lang === 'de' ? 'Tool:' : 'Tool:'}
                              </p>
                              <p className="text-sm">{step.tool.replace('-ai', ' AI')}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {lang === 'de' ? 'Geschätzte Zeit:' : 'Estimated time:'}
                              </p>
                              <p className="text-sm">{step.estimatedTime} min</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              {lang === 'de' ? 'Anweisungen:' : 'Instructions:'}
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-sm">
                              {step.instructions.map((instruction, idx) => (
                                <li key={idx}>{instruction}</li>
                              ))}
                            </ol>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              {lang === 'de' ? 'Tipps:' : 'Tips:'}
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {step.tips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tools" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedWorkflow.tools.map((tool) => (
                      <Card key={tool}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Settings className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{tool.replace('-ai', ' AI')}</h4>
                              <p className="text-sm text-gray-600">
                                {lang === 'de' ? 'AI-Tool' : 'AI Tool'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="roi" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        {lang === 'de' ? 'ROI-Analyse' : 'ROI Analysis'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">
                            {lang === 'de' ? 'Zeitersparnis' : 'Time Savings'}
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">
                                {lang === 'de' ? 'Pro Woche:' : 'Per week:'}
                              </span>
                              <span className="font-medium">{selectedWorkflow.estimatedTimeSavings} Stunden</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">
                                {lang === 'de' ? 'Pro Monat:' : 'Per month:'}
                              </span>
                              <span className="font-medium">{selectedWorkflow.estimatedTimeSavings * 4} Stunden</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">
                                {lang === 'de' ? 'Pro Jahr:' : 'Per year:'}
                              </span>
                              <span className="font-medium">{selectedWorkflow.estimatedTimeSavings * 52} Stunden</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">
                            {lang === 'de' ? 'Kosteneinsparungen' : 'Cost Savings'}
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">
                                {lang === 'de' ? 'Zeit-basiert:' : 'Time-based:'}
                              </span>
                              <span className="font-medium">€{(selectedWorkflow.estimatedTimeSavings * 4 * 60).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">
                                {lang === 'de' ? 'Direkte Einsparungen:' : 'Direct savings:'}
                              </span>
                              <span className="font-medium">€{selectedWorkflow.estimatedCostSavings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-sm font-semibold">
                                {lang === 'de' ? 'Gesamt ROI:' : 'Total ROI:'}
                              </span>
                              <span className="font-bold text-green-600">
                                €{calculateTotalROI(selectedWorkflow).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">
                          {lang === 'de' ? 'ROI-Zusammenfassung' : 'ROI Summary'}
                        </h4>
                        <p className="text-sm text-green-700">
                          {lang === 'de' 
                            ? `Dieser Workflow spart ${selectedWorkflow.estimatedTimeSavings} Stunden pro Woche und generiert einen monatlichen ROI von €${calculateTotalROI(selectedWorkflow).toLocaleString()}. Die Investition amortisiert sich typischerweise innerhalb von 1-3 Monaten.`
                            : `This workflow saves ${selectedWorkflow.estimatedTimeSavings} hours per week and generates a monthly ROI of €${calculateTotalROI(selectedWorkflow).toLocaleString()}. The investment typically pays for itself within 1-3 months.`
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { WorkflowTemplates };
