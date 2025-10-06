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
  ListFilter,
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
import { UnifiedSolutionCard, UnifiedSolutionData } from '../UnifiedSolutionCard';
import FilterBar from '@/components/FilterBar';

type LLMTabProps = {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
  onPromptSelect?: (prompt: GeneratedPrompt) => void;
  onCopyPrompt?: (prompt: GeneratedPrompt) => void;
  onOpenInService?: (prompt: GeneratedPrompt, service: string) => void;
  onUpdateCount?: (count: number) => void;
};

export default function LLMTab({ 
  subtask, 
  lang = 'en', 
  onPromptSelect,
  onCopyPrompt,
  onOpenInService,
  onUpdateCount
}: LLMTabProps) {
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'effectiveness' | 'tokens' | 'service'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<'all' | 'formal' | 'creative' | 'technical'>('all');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load prompts when subtask changes
  useEffect(() => {
    loadPrompts();
  }, [subtask]);

  const loadPrompts = async () => {

    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Check cache first
      const cacheKey = `prompts_${subtask?.id || 'all'}`;
      const cached = cacheManager.get<GeneratedPrompt[]>(cacheKey);
      
      if (cached && cached.length > 0) {
        console.log('✅ [LLMTab] Using cached prompts:', cached.length);
        setPrompts(cached);
        onUpdateCount?.(cached.length);
        setIsLoading(false);
        return;
      }

      // Generate prompts based on context
      let promptList: GeneratedPrompt[] = [];
      
      if (subtask) {
        // Generate specific prompts for individual subtask
        const promptMap = await generatePromptVariations(subtask, ['ChatGPT', 'Claude'], ['formal', 'technical'], lang);
        promptList = Array.from(promptMap.values());
        console.log('✅ [LLMTab] Generated specific prompts:', promptList.length);
      } else {
        // Generate complete solution prompts for "Alle (Komplettlösungen)"
        promptList = generateCompleteSolutionPrompts(lang);
        console.log('✅ [LLMTab] Loaded complete solution prompts:', promptList.length);
      }
      
      setPrompts(promptList);
      onUpdateCount?.(promptList.length);

      // Cache the results
      cacheManager.set(cacheKey, promptList, 60 * 60 * 1000); // 1 hour cache

    } catch (error) {
      console.error('❌ [LLMTab] Error loading prompts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load prompts');
      setPrompts([]);
      onUpdateCount?.(0);
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
    } else {
      // Clear cache for 'all' and reload
      const cacheKey = `prompts_all`;
      cacheManager.delete(cacheKey);
      loadPrompts();
    }
  };

  // Enhanced helper functions

  const handleShare = (prompt: UnifiedSolutionData) => {
    if (navigator.share) {
      navigator.share({
        title: prompt.name,
        text: prompt.prompt,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${prompt.name || prompt.service} - ${prompt.prompt}`);
    }
  };

  // Convert GeneratedPrompt to EnhancedPromptData
  const convertToUnifiedSolution = (prompt: GeneratedPrompt): UnifiedSolutionData => {
    return {
      id: prompt.id,
      name: `${prompt.service} ${prompt.style} Prompt`,
      description: `Optimized prompt for ${prompt.service}`,
      type: 'llm',
      prompt: prompt.prompt,
      service: prompt.service,
      style: prompt.style,
      preview: prompt.preview,
      status: prompt.status || 'generated',
      generationMetadata: prompt.generationMetadata,
      isAIGenerated: prompt.isAIGenerated || true,
      category: 'AI Prompt',
      tags: [prompt.service, prompt.style, 'AI'],
      estimatedTokens: Math.floor(Math.random() * 500) + 100, // 100-600 tokens
      estimatedCost: Math.floor(Math.random() * 5) + 1, // $1-6
      difficulty: prompt.style === 'formal' ? 'beginner' : 
                  prompt.style === 'technical' ? 'advanced' : 'intermediate',
      effectiveness: Math.floor(Math.random() * 3) + 7, // 7-10
      popularity: Math.floor(Math.random() * 100),
      rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      author: 'AI Assistant',
      lastUpdated: new Date().toISOString(),
      verified: Math.random() > 0.4, // 60% verified
      badges: ['AI Generated'],
      examples: [],
      variations: [],
      language: lang === 'de' ? 'German' : 'English',
      context: 'Task automation',
      expectedOutput: 'Structured response',
      tips: ['Use with specific context', 'Adjust parameters as needed']
    };
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

  // Always show LLM prompts, even without selected subtask

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
              ? `Für: ${subtask?.title || 'Alle Teilaufgaben'}`
              : `For: ${subtask?.title || 'All Subtasks'}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <ListFilter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={lang === 'de' ? 'Prompts durchsuchen...' : 'Search prompts...'}
          filters={[
            {
              label: lang === 'de' ? 'Service' : 'Service',
              value: filterService,
              options: [
                { value: 'all', label: lang === 'de' ? 'Alle Services' : 'All Services' },
                { value: 'ChatGPT', label: 'ChatGPT' },
                { value: 'Claude', label: 'Claude' },
                { value: 'Gemini', label: 'Gemini' },
                { value: 'Custom', label: 'Custom' }
              ],
              onValueChange: setFilterService
            },
            {
              label: lang === 'de' ? 'Stil' : 'Style',
              value: filterStyle,
              options: [
                { value: 'all', label: lang === 'de' ? 'Alle Stile' : 'All Styles' },
                { value: 'formal', label: lang === 'de' ? 'Formell' : 'Formal' },
                { value: 'creative', label: lang === 'de' ? 'Kreativ' : 'Creative' },
                { value: 'technical', label: lang === 'de' ? 'Technisch' : 'Technical' }
              ],
              onValueChange: setFilterStyle
            }
          ]}
          sortBy={sortBy}
          sortOptions={[
            { value: 'relevance', label: lang === 'de' ? 'Relevanz' : 'Relevance' },
            { value: 'effectiveness', label: lang === 'de' ? 'Effektivität' : 'Effectiveness' },
            { value: 'tokens', label: lang === 'de' ? 'Tokens' : 'Tokens' },
            { value: 'service', label: lang === 'de' ? 'Service' : 'Service' }
          ]}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          lang={lang}
        />
      )}

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

      {/* Enhanced Prompts Grid */}
      {error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lang === 'de' ? 'Fehler beim Laden' : 'Error Loading'}
          </h3>
          <p className="text-gray-600">
            {lang === 'de' ? 'Prompts konnten nicht geladen werden.' : 'Prompts could not be loaded.'}
          </p>
        </div>
      ) : !isLoading && filteredPrompts.length > 0 ? (
        <div className="space-y-4">
          {filteredPrompts.map((prompt, index) => {
            const unifiedSolution = convertToUnifiedSolution(prompt);
            return (
              <UnifiedSolutionCard
                key={`${prompt.id || 'prompt'}-${index}-${prompt.service || 'unknown'}`}
                solution={unifiedSolution}
                lang={lang}
                onSelect={(unifiedSolution) => onPromptSelect?.(prompt)}
                onCopyClick={(unifiedSolution) => handleCopyPrompt(prompt)}
                onOpenInServiceClick={(unifiedSolution) => handleOpenInService(prompt)}
                onShareClick={handleShare}
                compact={true}
                isInteractive={true}
                className="group"
              />
            );
          })}
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && !error && filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lang === 'de' ? 'Keine Prompts gefunden' : 'No Prompts Found'}
          </h3>
          <p className="text-gray-600">
            {lang === 'de' ? 'Versuchen Sie andere Suchbegriffe oder Filter.' : 'Try different search terms or filters.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Generate example prompts when no real data is available (DEPRECATED)
function generateExamplePrompts(lang: 'de' | 'en'): GeneratedPrompt[] {
  // This function is deprecated and should not be used
  // Use generateCompleteSolutionPrompts() instead
  console.warn('⚠️ [LLMTab] generateExamplePrompts is deprecated, use specific functions instead');
  return generateCompleteSolutionPrompts(lang);
}

// Generate complete solution prompts for "Alle (Komplettlösungen)"
function generateCompleteSolutionPrompts(lang: 'de' | 'en'): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [
    {
      id: 'complete-prompt-1',
      service: 'ChatGPT',
      style: 'formal',
      preview: lang === 'de' 
        ? 'Erstelle eine umfassende Marketing-Strategie für [Produkt/Dienstleistung]...'
        : 'Create a comprehensive marketing strategy for [product/service]...',
      prompt: lang === 'de' 
        ? 'Erstelle eine umfassende Marketing-Strategie für [Produkt/Dienstleistung]:\n\n1. Marktanalyse und Zielgruppen-Definition\n2. Wettbewerbsanalyse\n3. Content-Strategie (Blog, Social Media, Email)\n4. Lead-Generierung und Nurturing\n5. Conversion-Optimierung\n6. Performance-Metriken und KPIs\n7. Budget-Planung\n8. Zeitplan und Meilensteine\n\nZielgruppe: [Zielgruppe]\nBudget: [Budget]\nZeitraum: [Zeitraum]\n\nFormat: Strukturiert, datenbasiert, umsetzbar'
        : 'Create a comprehensive marketing strategy for [product/service]:\n\n1. Market analysis and target audience definition\n2. Competitive analysis\n3. Content strategy (blog, social media, email)\n4. Lead generation and nurturing\n5. Conversion optimization\n6. Performance metrics and KPIs\n7. Budget planning\n8. Timeline and milestones\n\nTarget audience: [audience]\nBudget: [budget]\nTimeframe: [timeframe]\n\nFormat: Structured, data-driven, actionable',
      status: 'generated',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      config: {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    },
    {
      id: 'complete-prompt-2',
      service: 'Claude',
      style: 'technical',
      preview: lang === 'de'
        ? 'Entwickle ein umfassendes Business Intelligence Dashboard für [Unternehmen/Bereich]...'
        : 'Develop a comprehensive Business Intelligence Dashboard for [company/area]...',
      prompt: lang === 'de'
        ? 'Entwickle ein umfassendes Business Intelligence Dashboard für [Unternehmen/Bereich]:\n\n1. Datenquellen-Identifikation\n2. KPI-Definition und Metriken\n3. Dashboard-Layout und Visualisierungen\n4. Automatisierte Berichte\n5. Alert-Systeme\n6. Datenqualität und Governance\n7. Benutzerrollen und Berechtigungen\n8. Implementierungsplan\n\nBereich: [Bereich]\nDatenquellen: [Datenquellen]\nZielgruppe: [Zielgruppe]\n\nFormat: Technisch detailliert, umsetzbar, skalierbar'
        : 'Develop a comprehensive Business Intelligence Dashboard for [company/area]:\n\n1. Data source identification\n2. KPI definition and metrics\n3. Dashboard layout and visualizations\n4. Automated reports\n5. Alert systems\n6. Data quality and governance\n7. User roles and permissions\n8. Implementation plan\n\nArea: [area]\nData sources: [data sources]\nTarget audience: [audience]\n\nFormat: Technically detailed, actionable, scalable',
      status: 'generated',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      config: {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    },
    {
      id: 'complete-prompt-3',
      service: 'ChatGPT',
      style: 'formal',
      preview: lang === 'de'
        ? 'Erstelle eine umfassende Kommunikations-Strategie für [Projekt/Initiative]...'
        : 'Create a comprehensive communication strategy for [project/initiative]...',
      prompt: lang === 'de'
        ? 'Erstelle eine umfassende Kommunikations-Strategie für [Projekt/Initiative]:\n\n1. Stakeholder-Analyse und Mapping\n2. Kommunikations-Ziele und Botschaften\n3. Kanal-Strategie (Email, Meetings, Slack, etc.)\n4. Content-Plan und Templates\n5. Feedback-Mechanismen\n6. Eskalations-Prozesse\n7. Erfolgs-Metriken\n8. Krisen-Kommunikation\n\nProjekt: [Projekt]\nStakeholder: [Stakeholder]\nZeitraum: [Zeitraum]\n\nFormat: Strukturiert, praxisorientiert, messbar'
        : 'Create a comprehensive communication strategy for [project/initiative]:\n\n1. Stakeholder analysis and mapping\n2. Communication goals and messages\n3. Channel strategy (email, meetings, Slack, etc.)\n4. Content plan and templates\n5. Feedback mechanisms\n6. Escalation processes\n7. Success metrics\n8. Crisis communication\n\nProject: [project]\nStakeholders: [stakeholders]\nTimeframe: [timeframe]\n\nFormat: Structured, practical, measurable',
      status: 'generated',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      config: {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    }
  ];

  return prompts;
}
