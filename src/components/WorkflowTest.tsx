import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { testWorkflowChain, printTestResults, testScenarios, TestResult } from '@/lib/workflow-test';
import { Loader2, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function WorkflowTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [customTask, setCustomTask] = useState('');
  const [error, setError] = useState<string | null>(null);

  const runTest = async (task: string, lang: 'de' | 'en' = 'de') => {
    setIsRunning(true);
    setError(null);
    
    try {
      const result = await testWorkflowChain(task, lang);
      setResults(prev => [...prev, result]);
      
      // Log to console for detailed analysis
      printTestResults(result, task);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setError(null);
    setResults([]);
    
    try {
      for (const scenario of testScenarios) {
        const result = await testWorkflowChain(scenario.task, scenario.lang);
        setResults(prev => [...prev, result]);
        
        // Warte zwischen Tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Workflow Chain Test</h1>
        <p className="text-muted-foreground">
          Teste den kompletten Workflow von Teilaufgaben-Generierung bis zu Workflow-Empfehlungen
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Führe Tests für den Workflow-Chain durch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Custom Task (optional)
              </label>
              <Textarea
                placeholder="Gib eine eigene Aufgabe ein..."
                value={customTask}
                onChange={(e) => setCustomTask(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => runAllTests()}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run All Tests
              </Button>
              
              {customTask && (
                <Button
                  onClick={() => runTest(customTask, 'de')}
                  disabled={isRunning}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Test Custom Task
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Test Scenarios</CardTitle>
            <CardDescription>
              Vordefinierte Test-Szenarien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testScenarios.map((scenario, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-sm text-muted-foreground">{scenario.task}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runTest(scenario.task, scenario.lang)}
                    disabled={isRunning}
                  >
                    Test
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Test Results</h2>
          
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Test {index + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getQualityIcon(result.qualityScore)}
                    <span className={`font-bold ${getQualityColor(result.qualityScore)}`}>
                      {result.qualityScore}/100
                    </span>
                  </div>
                </div>
                <CardDescription>
                  Execution time: {result.executionTime}ms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quality Score */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Quality Score</span>
                    <span>{result.qualityScore}/100</span>
                  </div>
                  <Progress value={result.qualityScore} className="h-2" />
                </div>

                {/* Subtasks */}
                <div>
                  <h4 className="font-medium mb-2">Subtasks ({result.subtasks.length})</h4>
                  <div className="space-y-2">
                    {result.subtasks.map((subtask, i) => (
                      <div key={i} className="p-2 border rounded text-sm">
                        <div className="font-medium">{subtask.title}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">
                            {subtask.automationPotential}% auto
                          </Badge>
                          <Badge variant="outline">
                            {subtask.estimatedTime}min
                          </Badge>
                          <Badge variant="outline">
                            {subtask.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workflows */}
                <div>
                  <h4 className="font-medium mb-2">Workflows ({result.solutions.workflows.length})</h4>
                  <div className="space-y-2">
                    {result.solutions.workflows.map((workflow: any, i: number) => (
                      <div key={i} className="p-2 border rounded text-sm">
                        <div className="font-medium">{workflow.name}</div>
                        <div className="text-muted-foreground">{workflow.technology}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">
                            {workflow.matchScore}% match
                          </Badge>
                          <Badge variant="outline">
                            {workflow.setupTime}
                          </Badge>
                          <Badge variant="outline">
                            {workflow.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Agents */}
                <div>
                  <h4 className="font-medium mb-2">AI Agents ({result.solutions.agents.length})</h4>
                  <div className="space-y-2">
                    {result.solutions.agents.map((agent: any, i: number) => (
                      <div key={i} className="p-2 border rounded text-sm">
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-muted-foreground">{agent.technology}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">
                            {agent.matchScore}% match
                          </Badge>
                          <Badge variant="outline">
                            {agent.setupTime}
                          </Badge>
                          <Badge variant="outline">
                            {agent.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                {result.improvements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Improvements</h4>
                    <ul className="space-y-1">
                      {result.improvements.map((improvement, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
