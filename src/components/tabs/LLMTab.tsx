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
import { EnhancedPromptCard, EnhancedPromptData } from '../ui/EnhancedPromptCard';
import { LLMTabSkeleton, EmptyStateSkeleton, ErrorStateSkeleton } from '../ui/LLMTabSkeleton';

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
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'effectiveness' | 'tokens' | 'service'>('relevance');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<'all' | 'formal' | 'creative' | 'technical'>('all');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Load prompts when subtask changes
  useEffect(() => {
    if (subtask) {
      loadPrompts();
    } else {
      setPrompts([]);
      onUpdateCount?.(0);
    }
  }, [subtask]);

  const loadPrompts = async () => {
    if (!subtask) return;

    setIsLoading(true);
    setShowSkeleton(true);
    setError(null);
    
    try {
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Check cache first
      const cacheKey = `prompts_${subtask.id}`;
      const cached = cacheManager.get<GeneratedPrompt[]>(cacheKey);
      
      if (cached && cached.length > 0) {
        console.log('✅ [LLMTab] Using cached prompts:', cached.length);
        setPrompts(cached);
        onUpdateCount?.(cached.length);
        setIsLoading(false);
        setShowSkeleton(false);
        return;
      }

      // Generate prompt variations
      const promptMap = await generatePromptVariations(subtask, ['ChatGPT', 'Claude'], ['formal', 'technical'], lang);
      const promptList = Array.from(promptMap.values());
      
      console.log('✅ [LLMTab] Generated prompts:', promptList.length);
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
      setShowSkeleton(false);
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

  // Enhanced helper functions
  const handleFavorite = (prompt: EnhancedPromptData) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(prompt.id)) {
      newFavorites.delete(prompt.id);
    } else {
      newFavorites.add(prompt.id);
    }
    setFavorites(newFavorites);
  };

  const handleShare = (prompt: EnhancedPromptData) => {
    if (navigator.share) {
      navigator.share({
        title: prompt.title || prompt.service,
        text: prompt.prompt,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${prompt.title || prompt.service} - ${prompt.prompt}`);
    }
  };

  // Convert GeneratedPrompt to EnhancedPromptData
  const convertToEnhancedPrompt = (prompt: GeneratedPrompt): EnhancedPromptData => {
    return {
      id: prompt.id,
      prompt: prompt.prompt,
      service: prompt.service,
      style: prompt.style,
      preview: prompt.preview,
      status: prompt.status || 'generated',
      generationMetadata: prompt.generationMetadata,
      isAIGenerated: prompt.isAIGenerated || true,
      title: `${prompt.service} ${prompt.style} Prompt`,
      description: `Optimized prompt for ${prompt.service}`,
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

      {/* Enhanced Prompts Grid */}
      {showSkeleton ? (
        <LLMTabSkeleton count={6} compact={true} />
      ) : error ? (
        <ErrorStateSkeleton />
      ) : !isLoading && filteredPrompts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt, index) => {
            const enhancedPrompt = convertToEnhancedPrompt(prompt);
            return (
              <EnhancedPromptCard
                key={prompt.id || index}
                prompt={enhancedPrompt}
                lang={lang}
                onSelect={(enhancedPrompt) => onPromptSelect?.(prompt)}
                onCopyClick={(enhancedPrompt) => handleCopyPrompt(prompt)}
                onOpenInServiceClick={(enhancedPrompt) => handleOpenInService(prompt)}
                onFavoriteClick={handleFavorite}
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
        <EmptyStateSkeleton />
      )}
    </div>
  );
}
