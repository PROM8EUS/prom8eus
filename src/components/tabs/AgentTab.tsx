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

type AgentTabProps = {
  subtask: DynamicSubtask | null;
  lang?: 'de' | 'en';
  onAgentSelect?: (agent: GeneratedAgent) => void;
  onSetupRequest?: (agent: GeneratedAgent) => void;
  onConfigView?: (agent: GeneratedAgent) => void;
};

export default function AgentTab({ 
  subtask, 
  lang = 'en', 
  onAgentSelect,
  onSetupRequest,
  onConfigView 
}: AgentTabProps) {
  const [agents, setAgents] = useState<GeneratedAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTechnology, setFilterTechnology] = useState<string>('all');
  const [filterComplexity, setFilterComplexity] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');

  // Load agents when subtask changes
  useEffect(() => {
    if (subtask) {
      loadAgents();
    } else {
      setAgents([]);
    }
  }, [subtask]);

  const loadAgents = async () => {
    if (!subtask) return;

    setIsLoading(true);
    try {
      // Check cache first
      const cacheKey = `agents_${subtask.id}`;
      const cached = cacheManager.get<GeneratedAgent[]>(cacheKey);
      
      if (cached && cached.length > 0) {
        console.log('✅ [AgentTab] Using cached agents:', cached.length);
        setAgents(cached);
        setIsLoading(false);
        return;
      }

      // Generate agents with fallback
      const agent = await generateAgentWithFallback(subtask, lang, 3000);
      
      console.log('✅ [AgentTab] Generated agent:', agent.name);
      setAgents([agent]);

      // Cache the results
      cacheManager.set(cacheKey, [agent], 60 * 60 * 1000); // 1 hour cache

    } catch (error) {
      console.error('❌ [AgentTab] Error loading agents:', error);
      setAgents([]);
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
    }
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

  if (!subtask) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">
            {lang === 'de' ? 'Wählen Sie eine Teilaufgabe aus' : 'Select a subtask'}
          </p>
          <p className="text-sm">
            {lang === 'de' 
              ? 'Wählen Sie eine Teilaufgabe aus der Seitenleiste aus, um AI-Agenten anzuzeigen'
              : 'Select a subtask from the sidebar to view AI agents'
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
            {lang === 'de' ? 'AI-Agent Lösungen' : 'AI Agent Solutions'}
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

      {/* Agents Grid */}
      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent, index) => (
            <Card key={agent.id || index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {agent.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(agent.status)}
                            <span className="text-xs text-gray-600">
                              {getStatusText(agent.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {agent.complexity}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {agent.description}
                  </p>

                  {/* Technology */}
                  <div className="flex items-center gap-2">
                    {getTechnologyIcon(agent.technology)}
                    <span className="text-sm font-medium text-gray-700">
                      {agent.technology}
                    </span>
                  </div>

                  {/* Functions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {lang === 'de' ? 'Funktionen:' : 'Functions:'}
                    </h4>
                    <div className="space-y-1">
                      {agent.functions.slice(0, 3).map((func, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                          <span className="text-xs text-gray-600 line-clamp-1">
                            {func}
                          </span>
                        </div>
                      ))}
                      {agent.functions.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{agent.functions.length - 3} {lang === 'de' ? 'weitere' : 'more'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tools */}
                  {agent.tools.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {lang === 'de' ? 'Tools:' : 'Tools:'}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.slice(0, 4).map((tool, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                        {agent.tools.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.tools.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Setup Cost */}
                  {agent.setupCost && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">
                        {lang === 'de' ? 'Setup-Kosten:' : 'Setup Cost:'}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {agent.setupCost}€
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfigView(agent)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {lang === 'de' ? 'Config' : 'Config'}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSetupRequest(agent)}
                      className="flex-1"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {lang === 'de' ? 'Einrichten' : 'Setup'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {lang === 'de' ? 'Keine Agenten gefunden' : 'No agents found'}
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
