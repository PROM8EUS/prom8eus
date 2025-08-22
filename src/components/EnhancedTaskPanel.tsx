import React, { useState, useEffect, useMemo } from 'react';
import { performEnhancedAnalysis } from '../lib/enhancedAnalysisClient';
import { AnalysisResult, EnhancedTask, EnhancedSubtask, WorkflowRecommendation, AgentRecommendation } from '../lib/enhancedTaskAnalysis';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { 
  Zap, 
  Workflow, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Play,
  DollarSign,
  Clock,
  BarChart3,
  Target,
  Settings,
  Users,
  Star,
  User,
  ExternalLink,
  Info,
  ChevronUp,
  ChevronDown,
  Globe,
  Mail,
  FileText,
  Brain,
  Share2,
  Folder,
  Database,
  MessageSquare,
  Calendar,
  CreditCard,
  TrendingUp,
  Lightbulb,
  BookOpen,
  Award,
  Shield,
  Activity,
  PieChart,
  Gauge,
  Target as TargetIcon,
  Brain as BrainIcon
} from 'lucide-react';

interface EnhancedTaskPanelProps {
  taskInput: string;
  lang: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

const EnhancedTaskPanel: React.FC<EnhancedTaskPanelProps> = ({ 
  taskInput, 
  lang, 
  onAnalysisComplete 
}) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subtasks' | 'workflows' | 'agents' | 'insights'>('overview');
  const [hourlyRate, setHourlyRate] = useState(60);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRecommendation | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecommendation | null>(null);

  // Run analysis when task input changes
  useEffect(() => {
    if (!taskInput || taskInput.trim().length < 10) return;

    const runAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        console.log('🚀 Starting Enhanced Task Analysis for:', taskInput);
        
        const result = await performEnhancedAnalysis(taskInput);
        
        if (result.success && result.data) {
          setAnalysisResult(result.data);
          
          if (onAnalysisComplete) {
            onAnalysisComplete(result.data);
          }
          
          console.log('✅ Enhanced Task Analysis completed:', result.data);
        } else {
          console.error('❌ Enhanced Task Analysis failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Enhanced Task Analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    runAnalysis();
  }, [taskInput, onAnalysisComplete]);

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-lg font-medium">KI analysiert Aufgabe...</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>🔍 Analysiere Aufgabenkomplexität und Automatisierungspotenzial</p>
                <p>📋 Generiere intelligente Teilaufgaben</p>
                <p>🤖 Finde passende Workflows und AI-Agents</p>
                <p>📚 Lerne aus historischen Daten</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No result state
  if (!analysisResult) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <BrainIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Geben Sie eine Aufgabe ein, um die KI-Analyse zu starten</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { task, subtasks, workflowRecommendations, agentRecommendations, summary, learningInsights } = analysisResult;

  return (
    <div className="space-y-6">
      {/* Task Overview Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TargetIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    {task.category}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    {task.complexity}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    {Math.round(task.automationPotential * 100)}% Automatisierung
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{summary.confidence}%</div>
              <div className="text-sm text-gray-600">Konfidenz</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white/80 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{task.estimatedHours}h</div>
              <div className="text-xs text-gray-600">Geschätzte Zeit</div>
            </div>
            <div className="text-center p-3 bg-white/80 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.estimatedTimeSavings}h</div>
              <div className="text-xs text-gray-600">Zeitersparnis</div>
            </div>
            <div className="text-center p-3 bg-white/80 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">€{summary.estimatedCostSavings}</div>
              <div className="text-xs text-gray-600">Kosteneinsparung</div>
            </div>
            <div className="text-center p-3 bg-white/80 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{subtasks.length}</div>
              <div className="text-xs text-gray-600">Teilaufgaben</div>
            </div>
          </div>
          
          {/* Systems and Tags */}
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Identifizierte Systeme
              </h4>
              <div className="flex flex-wrap gap-2">
                {task.systems.map((system) => (
                  <Badge key={system} variant="secondary" className="bg-blue-100 text-blue-700">
                    {system}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="subtasks" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Teilaufgaben
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Agents
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Case */}
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  Business Case
                </h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Stundensatz:</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                        className="w-24"
                        min="0"
                        step="5"
                      />
                      <span className="text-sm text-gray-600">€/h</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="text-xl font-bold text-gray-800">{task.estimatedHours}h</div>
                      <div className="text-xs text-gray-600">Vorher</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="text-xl font-bold text-gray-800">{(task.estimatedHours - summary.estimatedTimeSavings).toFixed(1)}h</div>
                      <div className="text-xs text-gray-600">Nachher</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      ROI: {(summary.estimatedCostSavings / (summary.estimatedCostSavings * 0.1)).toFixed(1)}x
                    </div>
                    <div className="text-sm text-gray-600">bei 10% Implementierungskosten</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk & Confidence */}
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  Risiko & Konfidenz
                </h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risiko-Level:</span>
                    <Badge 
                      variant={summary.riskLevel === 'high' ? 'destructive' : summary.riskLevel === 'medium' ? 'secondary' : 'default'}
                    >
                      {summary.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Konfidenz:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${summary.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{summary.confidence}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Komplexität:</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {summary.complexityBreakdown.low} Low
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {summary.complexityBreakdown.medium} Medium
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {summary.complexityBreakdown.high} High
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subtasks Tab */}
        <TabsContent value="subtasks" className="space-y-4">
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Folder className="w-5 h-5 text-blue-600" />
                Intelligente Teilaufgaben ({subtasks.length})
              </h4>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-3">
                {subtasks.map((subtask) => (
                  <AccordionItem key={subtask.id} value={subtask.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{subtask.title}</div>
                          <div className="text-sm text-gray-600">
                            {subtask.estimatedTime} Min • {Math.round(subtask.automationPotential * 100)}% Automatisierung
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {subtask.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {subtask.complexity}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        <p className="text-sm text-gray-700">{subtask.description}</p>
                        
                        {/* Systems */}
                        <div>
                          <h6 className="text-sm font-medium text-gray-900 mb-2">Systeme:</h6>
                          <div className="flex flex-wrap gap-2">
                            {subtask.systems.map((system) => (
                              <Badge key={system} variant="secondary" className="text-xs">
                                {system}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* KPIs and Quality Gates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              KPIs
                            </h6>
                            <div className="space-y-1">
                              {subtask.kpis.map((kpi) => (
                                <div key={kpi} className="text-xs text-gray-600">• {kpi}</div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Quality Gates
                            </h6>
                            <div className="space-y-1">
                              {subtask.qualityGates.map((gate) => (
                                <div key={gate} className="text-xs text-gray-600">• {gate}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Risks and Assumptions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Risiken
                            </h6>
                            <div className="space-y-1">
                              {subtask.risks.map((risk) => (
                                <div key={risk} className="text-xs text-gray-600">• {risk}</div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Annahmen
                            </h6>
                            <div className="space-y-1">
                              {subtask.assumptions.map((assumption) => (
                                <div key={assumption} className="text-xs text-gray-600">• {assumption}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Learning Data */}
                        {subtask.learningData && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <h6 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1">
                              <BrainIcon className="w-3 h-3" />
                              KI-Insights
                            </h6>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="font-medium">Erfolgsrate:</span> {Math.round(subtask.learningData.successRate * 100)}%
                              </div>
                              <div>
                                <span className="font-medium">Ø Zeit:</span> {subtask.learningData.averageTime} Min
                              </div>
                            </div>
                            {subtask.learningData.optimizationSuggestions.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-blue-900">Optimierungen:</span>
                                <div className="text-xs text-blue-800 mt-1">
                                  {subtask.learningData.optimizationSuggestions.map((suggestion) => (
                                    <div key={suggestion}>• {suggestion}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-purple-600" />
                Empfohlene Workflows ({workflowRecommendations.length})
              </h4>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowRecommendations.map((workflow) => (
                  <div key={workflow.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium text-gray-900">{workflow.title}</h5>
                          <Badge variant="outline" className="text-xs">
                            {workflow.automationLevel}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {workflow.complexity}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{workflow.estimatedTimeSavings.toFixed(1)}h Ersparnis</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>€{workflow.estimatedCostSavings} Einsparung</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            <span>{workflow.learningScore}% Erfolgsrate</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {workflow.systems.map((system) => (
                            <Badge key={system} variant="secondary" className="text-xs">
                              {system}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          Details
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Anwenden
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-600" />
                Empfohlene AI Agents ({agentRecommendations.length})
              </h4>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentRecommendations.map((agent) => (
                  <div key={agent.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium text-gray-900">{agent.title}</h5>
                          <Badge variant="outline" className="text-xs">
                            {agent.deployment}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {agent.integrationComplexity}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            <span>{agent.learningScore}% Erfolgsrate</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>{agent.confidence}% Konfidenz</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            <span>{agent.pricing.type}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {agent.capabilities.map((capability) => (
                            <Badge key={capability} variant="secondary" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedAgent(agent)}
                        >
                          Details
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Abonnieren
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Learning Insights */}
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  KI-Insights
                </h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 mb-2">Ähnliche Aufgaben:</h6>
                    <div className="space-y-1">
                      {learningInsights.similarTasks.map((task) => (
                        <div key={task} className="text-sm text-gray-600">• {task}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 mb-2">Häufige Muster:</h6>
                    <div className="space-y-1">
                      {learningInsights.commonPatterns.map((pattern) => (
                        <div key={pattern} className="text-sm text-gray-600">• {pattern}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 mb-2">Optimierungsmöglichkeiten:</h6>
                    <div className="space-y-1">
                      {learningInsights.optimizationOpportunities.map((opportunity) => (
                        <div key={opportunity} className="text-sm text-gray-600">• {opportunity}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 mb-2">Erfolgsfaktoren:</h6>
                    <div className="space-y-1">
                      {learningInsights.successFactors.map((factor) => (
                        <div key={factor} className="text-sm text-gray-600">• {factor}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Performance Metriken
                </h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{summary.totalAutomationPotential}%</div>
                      <div className="text-xs text-gray-600">Automatisierungspotenzial</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{summary.estimatedTimeSavings}h</div>
                      <div className="text-xs text-gray-600">Zeitersparnis</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Komplexitätsverteilung:</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(summary.complexityBreakdown.low / subtasks.length) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(summary.complexityBreakdown.medium / subtasks.length) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(summary.complexityBreakdown.high / subtasks.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Workflow Details Modal */}
      <Dialog open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-purple-600" />
              Workflow Details
            </DialogTitle>
          </DialogHeader>
          {selectedWorkflow && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">{selectedWorkflow.title}</h3>
                <p className="text-gray-600">{selectedWorkflow.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{selectedWorkflow.estimatedTimeSavings.toFixed(1)}h</div>
                  <div className="text-sm text-gray-600">Zeitersparnis</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">€{selectedWorkflow.estimatedCostSavings}</div>
                  <div className="text-sm text-gray-600">Kosteneinsparung</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Voraussetzungen:</h4>
                <div className="space-y-1">
                  {selectedWorkflow.prerequisites.map((prereq) => (
                    <div key={prereq} className="text-sm text-gray-600">• {prereq}</div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Workflow anwenden
                </Button>
                <Button variant="outline" className="flex-1">
                  Als Template speichern
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Agent Details Modal */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-600" />
              AI Agent Details
            </DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">{selectedAgent.title}</h3>
                <p className="text-gray-600">{selectedAgent.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{selectedAgent.learningScore}%</div>
                  <div className="text-sm text-gray-600">Erfolgsrate</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{selectedAgent.confidence}%</div>
                  <div className="text-sm text-gray-600">Konfidenz</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Fähigkeiten:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((capability) => (
                    <Badge key={capability} variant="secondary">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Agent abonnieren
                </Button>
                <Button variant="outline" className="flex-1">
                  Testen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedTaskPanel;
