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
  ListFilter,
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
import { UnifiedSolutionCard, UnifiedSolutionData } from '../UnifiedSolutionCard';
import FilterBar from '@/components/FilterBar';
import SolutionDetailModal from '@/components/SolutionDetailModal';

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
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'experience' | 'availability'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterTechnology, setFilterTechnology] = useState<string>('all');
  const [filterComplexity, setFilterComplexity] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal state
  const [selectedAgent, setSelectedAgent] = useState<GeneratedAgent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load agents when subtask changes
  useEffect(() => {
    loadAgents();
  }, [subtask]);

  const loadAgents = async () => {

    setIsLoading(true);
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
        return;
      }

      // Generate agents based on context
      let agents: GeneratedAgent[] = [];
      
      if (subtask) {
        // Generate specific agent for individual subtask
        const agent = await generateAgentWithFallback(subtask, lang, 3000);
        agents = [agent];
        console.log('✅ [AgentTab] Generated specific agent:', agent.name);
      } else {
        // Generate complete solution agents for "Alle (Komplettlösungen)"
        agents = generateCompleteSolutionAgents(lang);
        console.log('✅ [AgentTab] Loaded complete solution agents:', agents.length);
      }
      
      setAgents(agents);
      onUpdateCount?.(agents.length);

      // Cache the results
      cacheManager.set(cacheKey, agents, 60 * 60 * 1000); // 1 hour cache

    } catch (error) {
      console.error('❌ [AgentTab] Error loading agents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load agents');
      setAgents([]);
      onUpdateCount?.(0);
    } finally {
      setIsLoading(false);
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

  const handleShare = (agent: UnifiedSolutionData) => {
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

// Convert GeneratedAgent to UnifiedSolutionData
const convertToUnifiedSolution = (agent: GeneratedAgent): UnifiedSolutionData => {
    if (!agent) {
      console.error('❌ [AgentTab] convertToEnhancedAgent called with undefined agent');
      return {
        id: 'error',
        name: 'Error',
        description: 'Agent data not available',
        type: 'agent',
        role: 'Error',
        technologies: [],
        skills: [],
        experience: 'junior',
        availability: 'offline',
        rating: 0,
        projectsCompleted: 0,
        responseTime: 0,
        costPerHour: 0,
        languages: [],
        specializations: [],
        status: 'fallback',
        generationMetadata: {
          timestamp: Date.now(),
          model: 'fallback',
          language: 'en',
          cacheKey: 'error-fallback'
        },
        setupCost: 0,
        isAIGenerated: false,
        personality: 'professional',
        communicationStyle: 'formal',
        lastActive: new Date().toISOString(),
        portfolio: [],
        verified: false,
      };
    }
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: 'agent',
      role: agent.config?.name || agent.name, // Use config name as role or fallback to name
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
      portfolio: [], // Default empty portfolio
      // Add missing properties for SolutionDetailModal
      metrics: {
        usageCount: Math.floor(Math.random() * 100) + 10,
        successRate: Math.floor(Math.random() * 20) + 80, // 80-100%
        averageExecutionTime: Math.floor(Math.random() * 30) + 5,
        errorRate: Math.floor(Math.random() * 5), // 0-5%
        userRating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        reviewCount: Math.floor(Math.random() * 50) + 5,
        lastUsed: new Date(),
        performanceScore: Math.floor(Math.random() * 20) + 80 // 80-100
      },
      requirements: [],
      useCases: [],
      integrations: [],
      subcategories: [],
      tags: [],
      category: 'AI & Automation',
      implementationPriority: 'Medium',
      timeToValue: '1-2 weeks',
      estimatedROI: '200-300%',
      automationPotential: Math.floor(Math.random() * 40) + 60, // 60-100%
      difficulty: 'Intermediate',
      setupTime: 'Medium',
      deployment: 'Cloud',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      author: 'AI Generated',
      source: 'ai-generated',
      sourceUrl: '#'
    };
  };

  const handleSetupRequest = (agent: GeneratedAgent) => {
    onSetupRequest?.(agent);
  };

  const handleConfigView = (agent: GeneratedAgent) => {
    onConfigView?.(agent);
  };

  const handleAgentSelect = (agent: GeneratedAgent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
    onAgentSelect?.(agent);
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
          searchPlaceholder={lang === 'de' ? 'Agenten durchsuchen...' : 'Search agents...'}
          filters={[
            {
              label: lang === 'de' ? 'Technologie' : 'Technology',
              value: filterTechnology,
              options: [
                { value: 'all', label: lang === 'de' ? 'Alle Technologien' : 'All Technologies' },
                { value: 'Python', label: 'Python' },
                { value: 'Node.js', label: 'Node.js' },
                { value: 'JavaScript', label: 'JavaScript' },
                { value: 'Custom', label: 'Custom' }
              ],
              onValueChange: setFilterTechnology
            },
            {
              label: lang === 'de' ? 'Komplexität' : 'Complexity',
              value: filterComplexity,
              options: [
                { value: 'all', label: lang === 'de' ? 'Alle Komplexität' : 'All Complexity' },
                { value: 'Low', label: lang === 'de' ? 'Niedrig' : 'Low' },
                { value: 'Medium', label: lang === 'de' ? 'Mittel' : 'Medium' },
                { value: 'High', label: lang === 'de' ? 'Hoch' : 'High' }
              ],
              onValueChange: setFilterComplexity
            }
          ]}
          sortBy={sortBy}
          sortOptions={[
            { value: 'relevance', label: lang === 'de' ? 'Relevanz' : 'Relevance' },
            { value: 'rating', label: lang === 'de' ? 'Bewertung' : 'Rating' },
            { value: 'experience', label: lang === 'de' ? 'Erfahrung' : 'Experience' },
            { value: 'availability', label: lang === 'de' ? 'Verfügbarkeit' : 'Availability' }
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
              {lang === 'de' ? 'Generiere AI-Agent...' : 'Generating AI agent...'}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Agents Grid */}
      {error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lang === 'de' ? 'Fehler beim Laden' : 'Error Loading'}
          </h3>
          <p className="text-gray-600">
            {lang === 'de' ? 'Agents konnten nicht geladen werden.' : 'Agents could not be loaded.'}
          </p>
        </div>
      ) : !isLoading && filteredAgents.length > 0 ? (
        <div className="space-y-4">
          {filteredAgents.map((agent, index) => {
            const unifiedSolution = convertToUnifiedSolution(agent);
            return (
              <UnifiedSolutionCard
                key={agent.id || index}
                solution={unifiedSolution}
                lang={lang}
                onSelect={() => handleAgentSelect(agent)}
                onSetupClick={(unifiedSolution) => handleSetupRequest(agent)}
                onConfigClick={(unifiedSolution) => handleConfigView(agent)}
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
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lang === 'de' ? 'Keine Agents gefunden' : 'No Agents Found'}
          </h3>
          <p className="text-gray-600">
            {lang === 'de' ? 'Versuchen Sie andere Suchbegriffe oder Filter.' : 'Try different search terms or filters.'}
          </p>
        </div>
      )}

      {/* Agent Detail Modal */}
      <SolutionDetailModal
        solution={selectedAgent ? convertToUnifiedSolution(selectedAgent) : null}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAgent(null);
        }}
        lang={lang}
      />
    </div>
  );
}

// Generate complete solution agents for "Alle (Komplettlösungen)"
function generateCompleteSolutionAgents(lang: 'de' | 'en'): GeneratedAgent[] {
  const agents: GeneratedAgent[] = [
    {
      id: 'complete-agent-1',
      name: lang === 'de' ? 'Master Marketing Agent' : 'Master Marketing Agent',
      description: lang === 'de' 
        ? 'Umfassender Marketing-Agent für komplette Kampagnenverwaltung und Lead-Generierung'
        : 'Comprehensive marketing agent for complete campaign management and lead generation',
      tools: ['HubSpot', 'Mailchimp', 'Google Analytics', 'Facebook Ads', 'LinkedIn'],
      technology: 'Python, OpenAI API, Marketing APIs, Analytics',
      complexity: 'High',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      config: {
        name: 'Master Marketing Agent',
        description: 'Comprehensive marketing agent for complete campaign management and lead generation',
        functions: ['campaign_management', 'lead_generation', 'analytics'],
        tools: ['HubSpot', 'Mailchimp', 'Google Analytics'],
        technology: 'Python, OpenAI API, Marketing APIs, Analytics',
        parameters: {},
        environment: {}
      },
      functions: ['campaign_management', 'lead_generation', 'analytics'],
      status: 'generated',
      setupCost: 500
    },
    {
      id: 'complete-agent-2',
      name: lang === 'de' ? 'Data Intelligence Agent' : 'Data Intelligence Agent',
      description: lang === 'de'
        ? 'KI-gestützter Datenanalyse-Agent für umfassende Business Intelligence'
        : 'AI-powered data analysis agent for comprehensive business intelligence',
      tools: ['Python', 'Tableau', 'Power BI', 'Google Analytics', 'Jupyter'],
      technology: 'Python, Machine Learning, Data APIs, Visualization',
      complexity: 'High',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      config: {
        name: 'Data Intelligence Agent',
        description: 'AI-powered data analysis agent for comprehensive business intelligence',
        functions: ['data_analysis', 'predictive_analytics', 'reporting'],
        tools: ['Python', 'Tableau', 'Power BI'],
        technology: 'Python, Machine Learning, Data APIs, Visualization',
        parameters: {},
        environment: {}
      },
      functions: ['data_analysis', 'predictive_analytics', 'reporting'],
      status: 'generated',
      setupCost: 750
    },
    {
      id: 'complete-agent-3',
      name: lang === 'de' ? 'Communication Hub Agent' : 'Communication Hub Agent',
      description: lang === 'de'
        ? 'Zentraler Kommunikations-Agent für alle Kanäle und Stakeholder-Management'
        : 'Central communication agent for all channels and stakeholder management',
      tools: ['Slack', 'Microsoft Teams', 'Zoom', 'Calendly', 'Email'],
      technology: 'JavaScript, Node.js, Communication APIs',
      complexity: 'Medium',
      isAIGenerated: true,
      generatedAt: new Date().toISOString(),
      config: {
        name: 'Communication Hub Agent',
        description: 'Central communication agent for all channels and stakeholder management',
        functions: ['communication', 'scheduling', 'coordination'],
        tools: ['Slack', 'Microsoft Teams', 'Zoom'],
        technology: 'JavaScript, Node.js, Communication APIs',
        parameters: {},
        environment: {}
      },
      functions: ['communication', 'scheduling', 'coordination'],
      status: 'generated',
      setupCost: 300
    }
  ];

  return agents;
}
