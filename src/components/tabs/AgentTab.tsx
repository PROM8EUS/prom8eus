/**
 * AgentTab Component
 * Displays AI agent solutions with modern card design
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bot, 
  Settings, 
  Eye, 
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
  Users
} from 'lucide-react';
import { DynamicSubtask } from '@/lib/types';
import { GeneratedAgent } from '@/lib/services/agentGenerator';
import { generateAgentWithFallback } from '@/lib/services/agentGenerator';
import { cacheManager } from '@/lib/services/cacheManager';
import { EnhancedAgentCard, EnhancedAgentData } from '../ui/EnhancedAgentCard';
import { AgentTabSkeleton, EmptyStateSkeleton, ErrorStateSkeleton } from '../ui/AgentTabSkeleton';

type AgentTabProps = {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
  onAgentSelect?: (agent: GeneratedAgent) => void;
  onSetupRequest?: (agent: GeneratedAgent) => void;
  onConfigView?: (agent: GeneratedAgent) => void;
  onUpdateCount?: (count: number) => void;
};

export default function AgentTab({ 
  subtask, 
  lang = 'en', 
  onAgentSelect,
  onSetupRequest,
  onConfigView,
  onUpdateCount
}: AgentTabProps) {
  const [agents, setAgents] = useState<GeneratedAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'experience' | 'availability'>('relevance');
  const [filterTechnology, setFilterTechnology] = useState<string>('all');
  const [filterComplexity, setFilterComplexity] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');

  // Load agents when subtask changes
  useEffect(() => {
    if (subtask) {
      loadAgents();
    } else {
      setAgents([]);
      onUpdateCount?.(0);
    }
  }, [subtask]);

  const loadAgents = async () => {
    if (!subtask) return;

    setIsLoading(true);
    setShowSkeleton(true);
    setError(null);
    
    try {
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Check cache first
      const cacheKey = `agents_${subtask?.id || 'all'}`;
      const cached = cacheManager.get<GeneratedAgent[]>(cacheKey);
      
      if (cached && cached.length > 0) {
        console.log('✅ [AgentTab] Using cached agents:', cached.length);
        setAgents(cached);
        onUpdateCount?.(cached.length);
        setIsLoading(false);
        setShowSkeleton(false);
        return;
      }

      // Generate agents with fallback
      const agent = await generateAgentWithFallback(subtask, lang, 3000);
      
      console.log('✅ [AgentTab] Generated agent:', agent.name);
      setAgents([agent]);
      onUpdateCount?.(1);

      // Cache the results
      cacheManager.set(cacheKey, [agent], 60 * 60 * 1000); // 1 hour cache

    } catch (error) {
      console.error('❌ [AgentTab] Error loading agents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load agents');
      setAgents([]);
      onUpdateCount?.(0);
    } finally {
      setIsLoading(false);
      setShowSkeleton(false);
    }
  };

  const handleRefresh = () => {
    if (subtask) {
      // Clear cache and reload
      const cacheKey = `agents_${subtask.id}`;
      cacheManager.delete(cacheKey);
      loadAgents();
    } else {
      // Clear cache for 'all' and reload
      const cacheKey = `agents_all`;
      cacheManager.delete(cacheKey);
      loadAgents();
    }
  };

  // Enhanced helper functions
  const handleFavorite = (agent: EnhancedAgentData) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(agent.id)) {
      newFavorites.delete(agent.id);
    } else {
      newFavorites.add(agent.id);
    }
    setFavorites(newFavorites);
  };

  const handleShare = (agent: EnhancedAgentData) => {
    if (navigator.share) {
      navigator.share({
        title: agent.name,
        text: agent.description,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${agent.name} - ${agent.description}`);
    }
  };

  // Convert GeneratedAgent to EnhancedAgentData
  const convertToEnhancedAgent = (agent: GeneratedAgent): EnhancedAgentData => {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      role: agent.config.name, // Use config name as role
      capabilities: agent.functions || [],
      technologies: agent.technology ? [agent.technology] : [],
      skills: agent.tools || [],
      experience: agent.complexity === 'Low' ? 'junior' : 
                  agent.complexity === 'High' ? 'expert' : 'mid',
      availability: 'available',
      rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      projectsCompleted: Math.floor(Math.random() * 50) + 10,
      responseTime: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
      costPerHour: Math.floor(Math.random() * 50) + 25, // $25-75/hour
      languages: ['English'], // Default language
      specializations: agent.functions || [],
      status: agent.status || 'generated',
      generationMetadata: agent.generationMetadata,
      setupCost: agent.setupCost || 0,
      isAIGenerated: agent.isAIGenerated || true,
      personality: 'professional', // Default personality
      communicationStyle: 'formal', // Default communication style
      lastActive: new Date().toISOString(),
      verified: Math.random() > 0.3, // 70% verified
      badges: [], // Default empty badges
      portfolio: [] // Default empty portfolio
    };
  };

  const handleSetupRequest = (agent: GeneratedAgent) => {
    onSetupRequest?.(agent);
  };

  const handleConfigView = (agent: GeneratedAgent) => {
    onConfigView?.(agent);
  };

  // Filter agents based on search and filters
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = !searchQuery || 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.functions.some(fn => fn.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTechnology = filterTechnology === 'all' || agent.technology === filterTechnology;
    
    const matchesComplexity = filterComplexity === 'all' || agent.complexity === filterComplexity;
    
    return matchesSearch && matchesTechnology && matchesComplexity;
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

  const getTechnologyIcon = (technology: string) => {
    switch (technology.toLowerCase()) {
      case 'python':
        return <Code className="h-4 w-4 text-blue-500" />;
      case 'node.js':
        return <Code className="h-4 w-4 text-green-500" />;
      case 'javascript':
        return <Code className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  // Always show agents, even without selected subtask

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {lang === 'de' ? 'AI-Agent Lösungen' : 'AI Agent Solutions'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {lang === 'de' 
              ? `Für: ${subtask?.title || 'Alle Teilaufgaben'}`
              : `For: ${subtask?.title || 'All Subtasks'}`
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
            placeholder={lang === 'de' ? 'Agenten durchsuchen...' : 'Search agents...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterTechnology}
            onChange={(e) => setFilterTechnology(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{lang === 'de' ? 'Alle Technologien' : 'All Technologies'}</option>
            <option value="Python">Python</option>
            <option value="Node.js">Node.js</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Custom">Custom</option>
          </select>
          
          <select
            value={filterComplexity}
            onChange={(e) => setFilterComplexity(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{lang === 'de' ? 'Alle Komplexität' : 'All Complexity'}</option>
            <option value="Low">{lang === 'de' ? 'Niedrig' : 'Low'}</option>
            <option value="Medium">{lang === 'de' ? 'Mittel' : 'Medium'}</option>
            <option value="High">{lang === 'de' ? 'Hoch' : 'High'}</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">
              {lang === 'de' ? 'Generiere AI-Agent...' : 'Generating AI agent...'}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Agents Grid */}
      {showSkeleton ? (
        <AgentTabSkeleton count={6} compact={true} />
      ) : error ? (
        <ErrorStateSkeleton />
      ) : !isLoading && filteredAgents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent, index) => {
            const enhancedAgent = convertToEnhancedAgent(agent);
            return (
              <EnhancedAgentCard
                key={agent.id || index}
                agent={enhancedAgent}
                lang={lang}
                onSelect={(enhancedAgent) => onAgentSelect?.(agent)}
                onSetupClick={(enhancedAgent) => handleSetupRequest(agent)}
                onConfigClick={(enhancedAgent) => handleConfigView(agent)}
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
      {!isLoading && !error && filteredAgents.length === 0 && (
        <EmptyStateSkeleton />
      )}
    </div>
  );
}
