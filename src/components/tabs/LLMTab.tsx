/**
 * LLMTab Component
 * Displays LLM prompt solutions with code-like display and copy functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Copy, 
  ExternalLink, 
  Clock, 
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Code,
  Zap,
  Brain
} from 'lucide-react';
import { DynamicSubtask } from '@/lib/types';
import { GeneratedPrompt } from '@/lib/services/promptGenerator';
import { generatePromptVariations } from '@/lib/services/promptGenerator';
import { cacheManager } from '@/lib/services/cacheManager';

type LLMTabProps = {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
  onPromptSelect?: (prompt: GeneratedPrompt) => void;
  onCopyPrompt?: (prompt: GeneratedPrompt) => void;
  onOpenInService?: (prompt: GeneratedPrompt, service: string) => void;
};

export default function LLMTab({ 
  subtask, 
  lang = 'en', 
  onPromptSelect,
  onCopyPrompt,
  onOpenInService 
}: LLMTabProps) {
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<'all' | 'formal' | 'creative' | 'technical'>('all');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Load prompts when subtask changes
  useEffect(() => {
    if (subtask) {
      loadPrompts();
    } else {
      setPrompts([]);
    }
  }, [subtask]);

  const loadPrompts = async () => {
    if (!subtask) return;

    setIsLoading(true);
    try {
      // Check cache first
      const cacheKey = `prompts_${subtask.id}`;
      const cached = cacheManager.get<GeneratedPrompt[]>(cacheKey);
      
      if (cached && cached.length > 0) {
        console.log('✅ [LLMTab] Using cached prompts:', cached.length);
        setPrompts(cached);
        setIsLoading(false);
        return;
      }

      // Generate prompt variations
      const promptMap = await generatePromptVariations(subtask, ['ChatGPT', 'Claude'], ['formal', 'technical'], lang);
      const promptList = Array.from(promptMap.values());
      
      console.log('✅ [LLMTab] Generated prompts:', promptList.length);
      setPrompts(promptList);

      // Cache the results
      cacheManager.set(cacheKey, promptList, 60 * 60 * 1000); // 1 hour cache

    } catch (error) {
      console.error('❌ [LLMTab] Error loading prompts:', error);
      setPrompts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (subtask) {
      // Clear cache and reload
      const cacheKey = `prompts_${subtask.id}`;
      cacheManager.delete(cacheKey);
      loadPrompts();
    }
  };

  const handleCopyPrompt = async (prompt: GeneratedPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopiedPromptId(prompt.id);
      onCopyPrompt?.(prompt);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedPromptId(null), 2000);
    } catch (error) {
      console.error('❌ [LLMTab] Error copying prompt:', error);
    }
  };

  const handleOpenInService = (prompt: GeneratedPrompt) => {
    onOpenInService?.(prompt, prompt.service);
  };

  // Filter prompts based on search and filters
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchQuery || 
      prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesService = filterService === 'all' || prompt.service === filterService;
    
    const matchesStyle = filterStyle === 'all' || prompt.style === filterStyle;
    
    return matchesSearch && matchesService && matchesStyle;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generated':
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'fallback':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return lang === 'de' ? 'Verifiziert' : 'Verified';
      case 'generated':
        return lang === 'de' ? 'KI-generiert' : 'AI Generated';
      case 'fallback':
        return lang === 'de' ? 'Fallback' : 'Fallback';
      default:
        return lang === 'de' ? 'Unbekannt' : 'Unknown';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'chatgpt':
        return <Brain className="h-4 w-4 text-green-500" />;
      case 'claude':
        return <Brain className="h-4 w-4 text-orange-500" />;
      case 'gemini':
        return <Brain className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getServiceUrl = (service: string) => {
    switch (service.toLowerCase()) {
      case 'chatgpt':
        return 'https://chat.openai.com/';
      case 'claude':
        return 'https://claude.ai/';
      case 'gemini':
        return 'https://gemini.google.com/';
      default:
        return '#';
    }
  };

  if (!subtask) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">
            {lang === 'de' ? 'Wählen Sie eine Teilaufgabe aus' : 'Select a subtask'}
          </p>
          <p className="text-sm">
            {lang === 'de' 
              ? 'Wählen Sie eine Teilaufgabe aus der Seitenleiste aus, um LLM-Prompts anzuzeigen'
              : 'Select a subtask from the sidebar to view LLM prompts'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {lang === 'de' ? 'LLM-Prompt Lösungen' : 'LLM Prompt Solutions'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {lang === 'de' 
              ? `Für: ${subtask.title}`
              : `For: ${subtask.title}`
            }
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {lang === 'de' ? 'Aktualisieren' : 'Refresh'}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={lang === 'de' ? 'Prompts durchsuchen...' : 'Search prompts...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{lang === 'de' ? 'Alle Services' : 'All Services'}</option>
            <option value="ChatGPT">ChatGPT</option>
            <option value="Claude">Claude</option>
            <option value="Gemini">Gemini</option>
            <option value="Custom">Custom</option>
          </select>
          
          <select
            value={filterStyle}
            onChange={(e) => setFilterStyle(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{lang === 'de' ? 'Alle Stile' : 'All Styles'}</option>
            <option value="formal">{lang === 'de' ? 'Formell' : 'Formal'}</option>
            <option value="creative">{lang === 'de' ? 'Kreativ' : 'Creative'}</option>
            <option value="technical">{lang === 'de' ? 'Technisch' : 'Technical'}</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">
              {lang === 'de' ? 'Generiere Prompts...' : 'Generating prompts...'}
            </p>
          </div>
        </div>
      )}

      {/* Prompts Grid */}
      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredPrompts.map((prompt, index) => (
            <Card key={prompt.id || index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          {getServiceIcon(prompt.service)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {prompt.service}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(prompt.status)}
                            <span className="text-xs text-gray-600">
                              {getStatusText(prompt.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {prompt.style}
                      </Badge>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {lang === 'de' ? 'Vorschau:' : 'Preview:'}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {prompt.preview}
                    </p>
                  </div>

                  {/* Prompt Content */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {lang === 'de' ? 'Prompt:' : 'Prompt:'}
                    </h4>
                    <div className="relative">
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap break-words">
                          {prompt.prompt}
                        </pre>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyPrompt(prompt)}
                          className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700 text-gray-100"
                        >
                          {copiedPromptId === prompt.id ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Configuration */}
                  {prompt.config && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {lang === 'de' ? 'Konfiguration:' : 'Configuration:'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Temperature:</span>
                          <span className="font-mono">{prompt.config.temperature}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Tokens:</span>
                          <span className="font-mono">{prompt.config.maxTokens}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Top P:</span>
                          <span className="font-mono">{prompt.config.topP}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frequency Penalty:</span>
                          <span className="font-mono">{prompt.config.frequencyPenalty}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPrompt(prompt)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedPromptId === prompt.id 
                        ? (lang === 'de' ? 'Kopiert!' : 'Copied!')
                        : (lang === 'de' ? 'Kopieren' : 'Copy')
                      }
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenInService(prompt)}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {lang === 'de' ? 'Öffnen' : 'Open'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {lang === 'de' ? 'Keine Prompts gefunden' : 'No prompts found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {lang === 'de' 
              ? 'Versuchen Sie, Ihre Suchkriterien zu ändern oder die Seite zu aktualisieren'
              : 'Try changing your search criteria or refreshing the page'
            }
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {lang === 'de' ? 'Erneut versuchen' : 'Try Again'}
          </Button>
        </div>
      )}
    </div>
  );
}
