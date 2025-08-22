import React, { useState } from 'react';
import { performEnhancedAnalysis, getAnalysisProgress } from '../lib/enhancedAnalysisClient';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  Zap, 
  Workflow,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Star,
  Settings,
  Users,
  BarChart3
} from 'lucide-react';

const EnhancedDemo: React.FC = () => {
  const [taskInput, setTaskInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Example tasks for quick testing
  const exampleTasks = [
    {
      title: 'Datenanalyse & Reporting',
      description: 'Tägliche Auswertung von CRM-Daten und Erstellung von KPI-Dashboards für das Management-Team'
    },
    {
      title: 'Marketing Automation',
      description: 'Automatisierung von E-Mail-Kampagnen und Social Media Posts basierend auf Kundenverhalten'
    },
    {
      title: 'Prozessoptimierung',
      description: 'Analyse und Automatisierung von wiederkehrenden Buchhaltungsprozessen mit Excel und ERP-System'
    },
    {
      title: 'Kundenservice',
      description: 'Automatisierte Bearbeitung von Support-Tickets und Routing an die entsprechenden Teams'
    }
  ];

  const handleAnalyze = async () => {
    if (!taskInput.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentProgress(0);

    try {
      // Simulate progress updates
      const progressSteps = getAnalysisProgress();
      const progressInterval = setInterval(() => {
        setCurrentProgress(prev => {
          if (prev >= progressSteps.length - 1) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      const result = await performEnhancedAnalysis(taskInput);
      
      clearInterval(progressInterval);
      setCurrentProgress(progressSteps.length - 1);

      if (result.success && result.data) {
        setAnalysisResult(result.data);
      } else {
        setError(result.error || 'Analyse fehlgeschlagen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExampleTask = (example: { title: string; description: string }) => {
    setTaskInput(`${example.title}: ${example.description}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Enhanced Task Analysis
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Intelligente Aufgabenanalyse mit KI-gestützter Teilaufgaben-Generierung, 
            Workflow-Empfehlungen und Lernfähigkeiten
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Aufgabe eingeben
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreiben Sie Ihre Aufgabe:
                  </label>
                  <Textarea
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="z.B.: Tägliche Auswertung von CRM-Daten und Erstellung von KPI-Dashboards..."
                    className="min-h-[120px]"
                    disabled={isAnalyzing}
                  />
                </div>

                <Button 
                  onClick={handleAnalyze}
                  disabled={!taskInput.trim() || isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Analysiere...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      KI-Analyse starten
                    </div>
                  )}
                </Button>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Example Tasks */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Beispielaufgaben
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exampleTasks.map((example, index) => (
                    <div 
                      key={index}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleExampleTask(example)}
                    >
                      <h4 className="font-medium text-gray-900 text-sm">{example.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{example.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicator */}
            {isAnalyzing && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Analyse-Fortschritt
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getAnalysisProgress().map((step, index) => (
                      <div 
                        key={index}
                        className={`flex items-center gap-3 text-sm ${
                          index <= currentProgress ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          index <= currentProgress 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {index < currentProgress ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {analysisResult ? (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                    {analysisResult.summary?.totalAutomationPotentialFormatted || '85%'}
                  </div>
                      <div className="text-xs text-blue-700">Automatisierungspotenzial</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-green-600">
                    {analysisResult.summary?.estimatedTimeSavingsFormatted || '12h/Woche'}
                  </div>
                      <div className="text-xs text-green-700">Zeitersparnis</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                    {analysisResult.summary?.estimatedCostSavingsFormatted || '€720/Monat'}
                  </div>
                      <div className="text-xs text-purple-700">Kosteneinsparung</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                    {analysisResult.subtasks?.length || 5}
                  </div>
                      <div className="text-xs text-orange-700">Teilaufgaben</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Display Subtasks */}
                {analysisResult.subtasks && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Workflow className="w-5 h-5 text-blue-600" />
                        Dynamische Teilaufgaben ({analysisResult.subtasks?.length || 0})
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {analysisResult.subtasks?.map((subtask, index) => (
                          <Card key={subtask.id} className="border-l-4 border-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{subtask.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {subtask.automationPotential}% Automatisierung
                                  </Badge>
                                  <Badge 
                                    variant={subtask.priority === 'critical' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {subtask.priority}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">{subtask.description}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <span className="font-medium text-gray-500">Zeit:</span>
                                  <span className="ml-1">{subtask.estimatedTime}min</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Komplexität:</span>
                                  <span className="ml-1">{subtask.complexity}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Systeme:</span>
                                  <span className="ml-1">{subtask.systems?.join(', ') || 'Keine'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Abhängigkeiten:</span>
                                  <span className="ml-1">{subtask.dependencies?.length || 0}</span>
                                </div>
                              </div>
                              
                              {subtask.risks?.length > 0 && (
                                <div className="mt-3 p-2 bg-red-50 rounded">
                                  <h5 className="text-xs font-medium text-red-800 mb-1">Risiken:</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {subtask.risks.map((risk, riskIndex) => (
                                      <Badge key={riskIndex} variant="destructive" className="text-xs">
                                        {risk}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {subtask.opportunities?.length > 0 && (
                                <div className="mt-2 p-2 bg-green-50 rounded">
                                  <h5 className="text-xs font-medium text-green-800 mb-1">Chancen:</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {subtask.opportunities.map((opportunity, oppIndex) => (
                                      <Badge key={oppIndex} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                        {opportunity}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Technical Analysis Details */}
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      Technische Analyse
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Pattern:</span>
                        <span className="ml-2">{analysisResult.pattern}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Kategorie:</span>
                        <span className="ml-2">{analysisResult.category}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Systeme:</span>
                        <span className="ml-2">{analysisResult.systems?.join(', ') || 'Keine'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Analysezeit:</span>
                        <span className="ml-2">{analysisResult.analysisTime}ms</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <h4 className="font-medium text-gray-900 mb-2">Begründung:</h4>
                      <p className="text-sm text-gray-600">{analysisResult.reasoning}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                      <Brain className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Bereit für die KI-Analyse
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Geben Sie eine Aufgabe ein oder wählen Sie eine Beispielaufgabe aus, 
                      um die erweiterte KI-Analyse zu starten.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Erweiterte Funktionen
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-3">
                <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Intelligente Aufgabenanalyse</h3>
                <p className="text-sm text-gray-600">
                  KI-gestützte Erkennung von Aufgabenmustern und Automatisierungspotenzial
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <Workflow className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Automatische Teilaufgaben</h3>
                <p className="text-sm text-gray-600">
                  Generierung intelligenter Teilaufgaben mit Risiken, Annahmen und KPIs
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Workflow-Empfehlungen</h3>
                <p className="text-sm text-gray-600">
                  Passende Workflows und AI-Agents basierend auf Aufgabenkontext
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="p-3 bg-yellow-100 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Lernfähigkeiten</h3>
                <p className="text-sm text-gray-600">
                  Kontinuierliche Verbesserung durch Analyse historischer Daten
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedDemo;
