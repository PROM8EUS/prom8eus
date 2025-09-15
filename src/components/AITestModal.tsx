/**
 * AI Test Modal
 * Component to test OpenAI integration and configuration
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { StatusBadge } from './ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2, CheckCircle, XCircle, AlertCircle, Bot, Zap } from 'lucide-react';
import { testAIConnectivity, analyzeJobWithAI, generateSubtasksWithAI, recommendAgentsWithAI } from '../lib/aiAnalysis';
import { isOpenAIAvailable } from '../lib/openai';

interface AITestModalProps {
  lang?: 'de' | 'en';
  onClose?: () => void;
}

export default function AITestModal({ lang = 'de', onClose }: AITestModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    connectivity?: any;
    jobAnalysis?: any;
    subtaskGeneration?: any;
    agentRecommendations?: any;
  }>({});
  const [testJobText, setTestJobText] = useState(
    lang === 'de' 
      ? 'Softwareentwickler für React-Anwendungen. Verantwortlich für die Entwicklung von Frontend-Komponenten, Code-Reviews und die Zusammenarbeit mit dem Backend-Team.'
      : 'Software Developer for React applications. Responsible for developing frontend components, code reviews, and collaboration with the backend team.'
  );

  const runConnectivityTest = async () => {
    setIsLoading(true);
    try {
      const result = await testAIConnectivity();
      setTestResults(prev => ({ ...prev, connectivity: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        connectivity: { 
          isAvailable: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const runJobAnalysisTest = async () => {
    setIsLoading(true);
    try {
      const result = await analyzeJobWithAI(testJobText, lang);
      setTestResults(prev => ({ ...prev, jobAnalysis: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        jobAnalysis: { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const runSubtaskGenerationTest = async () => {
    setIsLoading(true);
    try {
      const result = await generateSubtasksWithAI(testJobText, lang);
      setTestResults(prev => ({ ...prev, subtaskGeneration: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        subtaskGeneration: { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const runAgentRecommendationsTest = async () => {
    setIsLoading(true);
    try {
      const result = await recommendAgentsWithAI(testJobText, lang);
      setTestResults(prev => ({ ...prev, agentRecommendations: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        agentRecommendations: { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    await runConnectivityTest();
    await runJobAnalysisTest();
    await runSubtaskGenerationTest();
    await runAgentRecommendationsTest();
  };

  const getStatusIcon = (status: boolean | undefined, error?: string) => {
    if (error) return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === undefined) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    if (status) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };


  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot className="w-4 h-4 mr-2" />
          {lang === 'de' ? 'AI Test' : 'AI Test'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {lang === 'de' ? 'OpenAI Integration Test' : 'OpenAI Integration Test'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {lang === 'de' ? 'Konfiguration' : 'Configuration'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {lang === 'de' ? 'OpenAI API Key konfiguriert' : 'OpenAI API Key configured'}
                </span>
                {getStatusIcon(isOpenAIAvailable())}
              </div>
              <div className="mt-2">
                <StatusBadge status={isOpenAIAvailable() ? 'active' : 'error'} />
              </div>
            </CardContent>
          </Card>

          {/* Test Job Text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {lang === 'de' ? 'Test-Stellenbeschreibung' : 'Test Job Description'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="test-job-text">
                {lang === 'de' ? 'Stellenbeschreibung für Tests' : 'Job description for testing'}
              </Label>
              <Textarea
                id="test-job-text"
                value={testJobText}
                onChange={(e) => setTestJobText(e.target.value)}
                className="mt-2"
                rows={4}
                placeholder={lang === 'de' 
                  ? 'Geben Sie eine Stellenbeschreibung ein...' 
                  : 'Enter a job description...'
                }
              />
            </CardContent>
          </Card>

          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {lang === 'de' ? 'Tests ausführen' : 'Run Tests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={runConnectivityTest} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {lang === 'de' ? 'Verbindung testen' : 'Test Connection'}
                </Button>
                <Button 
                  onClick={runJobAnalysisTest} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
                  {lang === 'de' ? 'Job-Analyse' : 'Job Analysis'}
                </Button>
                <Button 
                  onClick={runSubtaskGenerationTest} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
                  {lang === 'de' ? 'Unteraufgaben' : 'Subtasks'}
                </Button>
                <Button 
                  onClick={runAgentRecommendationsTest} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
                  {lang === 'de' ? 'Agent-Empfehlungen' : 'Agent Recommendations'}
                </Button>
                <Button 
                  onClick={runAllTests} 
                  disabled={isLoading}
                  className="ml-auto"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {lang === 'de' ? 'Alle Tests' : 'Run All Tests'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <div className="space-y-4">
            {/* Connectivity Test Results */}
            {testResults.connectivity && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(testResults.connectivity.isAvailable, testResults.connectivity.error)}
                    {lang === 'de' ? 'Verbindungstest' : 'Connectivity Test'}
                    <StatusBadge 
                      status={testResults.connectivity.error ? 'error' : 
                             testResults.connectivity.isAvailable ? 'active' : 'inactive'} 
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>{lang === 'de' ? 'Verfügbar:' : 'Available:'}</strong> {testResults.connectivity.isAvailable ? 'Ja' : 'Nein'}
                    </div>
                    <div>
                      <strong>{lang === 'de' ? 'Konfiguriert:' : 'Configured:'}</strong> {testResults.connectivity.isConfigured ? 'Ja' : 'Nein'}
                    </div>
                    {testResults.connectivity.testResult !== undefined && (
                      <div>
                        <strong>{lang === 'de' ? 'Test erfolgreich:' : 'Test successful:'}</strong> {testResults.connectivity.testResult ? 'Ja' : 'Nein'}
                      </div>
                    )}
                    {testResults.connectivity.error && (
                      <div className="text-red-600">
                        <strong>{lang === 'de' ? 'Fehler:' : 'Error:'}</strong> {testResults.connectivity.error}
                      </div>
                    )}
                    {testResults.connectivity.diagnostics && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h6 className="font-medium text-sm mb-2">{lang === 'de' ? 'Diagnose:' : 'Diagnostics:'}</h6>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${testResults.connectivity.diagnostics.modelsAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span>{lang === 'de' ? 'Models Endpoint:' : 'Models Endpoint:'} {testResults.connectivity.diagnostics.modelsAvailable ? 'OK' : 'Failed'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${testResults.connectivity.diagnostics.quotaIssue ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            <span>{lang === 'de' ? 'Quota Issue:' : 'Quota Issue:'} {testResults.connectivity.diagnostics.quotaIssue ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${testResults.connectivity.diagnostics.networkIssue ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            <span>{lang === 'de' ? 'Network Issue:' : 'Network Issue:'} {testResults.connectivity.diagnostics.networkIssue ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${testResults.connectivity.diagnostics.modelSpecificIssue ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            <span>{lang === 'de' ? 'Model Issue:' : 'Model Issue:'} {testResults.connectivity.diagnostics.modelSpecificIssue ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Analysis Results */}
            {testResults.jobAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(!testResults.jobAnalysis.error, testResults.jobAnalysis.error)}
                    {lang === 'de' ? 'Job-Analyse' : 'Job Analysis'}
                    <StatusBadge 
                      status={testResults.jobAnalysis.error ? 'error' : 'active'} 
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.jobAnalysis.error ? (
                    <div className="text-red-600 text-sm">
                      {testResults.jobAnalysis.error}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>{lang === 'de' ? 'AI aktiviert:' : 'AI enabled:'}</strong> {testResults.jobAnalysis.aiEnabled ? 'Ja' : 'Nein'}
                      </div>
                      <div>
                        <strong>{lang === 'de' ? 'Fallback verwendet:' : 'Fallback used:'}</strong> {testResults.jobAnalysis.fallbackUsed ? 'Ja' : 'Nein'}
                      </div>
                      <div>
                        <strong>{lang === 'de' ? 'Aufgaben gefunden:' : 'Tasks found:'}</strong> {testResults.jobAnalysis.tasks?.length || 0}
                      </div>
                      <div>
                        <strong>{lang === 'de' ? 'Zusammenfassung:' : 'Summary:'}</strong> {testResults.jobAnalysis.summary}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Subtask Generation Results */}
            {testResults.subtaskGeneration && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(!testResults.subtaskGeneration.error, testResults.subtaskGeneration.error)}
                    {lang === 'de' ? 'Unteraufgaben-Generierung' : 'Subtask Generation'}
                    <StatusBadge 
                      status={testResults.subtaskGeneration.error ? 'error' : 'active'} 
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.subtaskGeneration.error ? (
                    <div className="text-red-600 text-sm">
                      {testResults.subtaskGeneration.error}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>{lang === 'de' ? 'AI aktiviert:' : 'AI enabled:'}</strong> {testResults.subtaskGeneration.aiEnabled ? 'Ja' : 'Nein'}
                      </div>
                      <div>
                        <strong>{lang === 'de' ? 'Fallback verwendet:' : 'Fallback used:'}</strong> {testResults.subtaskGeneration.fallbackUsed ? 'Ja' : 'Nein'}
                      </div>
                      <div>
                        <strong>{lang === 'de' ? 'Unteraufgaben generiert:' : 'Subtasks generated:'}</strong> {testResults.subtaskGeneration.subtasks?.length || 0}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Agent Recommendations Results */}
            {testResults.agentRecommendations && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(!testResults.agentRecommendations.error, testResults.agentRecommendations.error)}
                    {lang === 'de' ? 'Agent-Empfehlungen' : 'Agent Recommendations'}
                    <StatusBadge 
                      status={testResults.agentRecommendations.error ? 'error' : 'active'} 
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.agentRecommendations.error ? (
                    <div className="text-red-600 text-sm">
                      {testResults.agentRecommendations.error}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>{lang === 'de' ? 'AI aktiviert:' : 'AI enabled:'}</strong> {testResults.agentRecommendations.aiEnabled ? 'Ja' : 'Nein'}
                      </div>
                      <div>
                        <strong>{lang === 'de' ? 'Fallback verwendet:' : 'Fallback used:'}</strong> {testResults.agentRecommendations.fallbackUsed ? 'Ja' : 'Nein'}
                      </div>
                      <div>
                        <strong>{lang === 'de' ? 'Agents empfohlen:' : 'Agents recommended:'}</strong> {testResults.agentRecommendations.agents?.length || 0}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
