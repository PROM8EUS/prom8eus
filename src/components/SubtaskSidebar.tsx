/**
 * SubtaskSidebar Component
 * Extracted from TaskPanel.tsx for better modularity and file size compliance
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AppIcon } from './AppIcon';
import ScoreCircle from './ScoreCircle';
import { 
  Workflow, 
  Zap, 
  HelpCircle,
  Loader2,
  ChevronRight,
  Users,
  Clock,
  Target,
  MoreHorizontal
} from 'lucide-react';
import { DynamicSubtask } from '@/lib/types';

// Simple string->SHA256 helper for stable cache keys
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SUBTASK_CACHE_NS = 'subtasks_cache_v1';
const SUBTASK_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

type CachedSubtasks = {
  createdAt: string;
  subtasks: Subtask[];
};

type Subtask = {
  id: string;
  title: string;
  systems?: string[];
  aiTools?: string[];
  selectedTools?: string[];
  manualHoursShare: number;
  automationPotential: number;
  risks?: string[];
  assumptions?: string[];
  kpis?: string[];
  qualityGates?: string[];
};

function readSubtaskCache(): Record<string, CachedSubtasks> {
  try {
    const raw = localStorage.getItem(SUBTASK_CACHE_NS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSubtaskCache(cache: Record<string, CachedSubtasks>) {
  try {
    localStorage.setItem(SUBTASK_CACHE_NS, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
}

async function getCachedSubtasksForText(taskText: string): Promise<Subtask[] | null> {
  const key = await sha256(taskText);
  const cache = readSubtaskCache();
  const entry = cache[key];
  if (!entry) return null;
  const age = Date.now() - new Date(entry.createdAt).getTime();
  if (age > SUBTASK_CACHE_TTL_MS) return null;
  console.log(`✅ [SubtasksCache] Hit for ${key}, age ${(age/1000).toFixed(0)}s, items: ${entry.subtasks.length}`);
  return entry.subtasks;
}

async function setCachedSubtasksForText(taskText: string, subtasks: Subtask[]): Promise<void> {
  const key = await sha256(taskText);
  const cache = readSubtaskCache();
  cache[key] = { createdAt: new Date().toISOString(), subtasks };
  writeSubtaskCache(cache);
  console.log(`💾 [SubtasksCache] Saved ${subtasks.length} items for ${key}`);
}

// Simple Counter Component
const SimpleCounter = ({ count, isLoading }: { count: number; isLoading: boolean }) => {

  // Loading shimmer — just gray text
  if (isLoading) {
    return (
      <span className="ml-1 text-gray-500 text-[10px] leading-none animate-pulse">
        ·
      </span>
    );
  }

  // Only show badge if count > 0
  if (count === 0) {
    return null;
  }

  return (
    <span className="ml-1 text-gray-500 text-[10px] leading-none">
      {count}
    </span>
  );
};

type SubtaskSidebarProps = {
  task: {
    title?: string;
    name?: string;
    description?: string;
    category?: string;
    subtasks?: Array<{
      id: string;
      title: string;
      description: string;
      automationPotential: number;
      estimatedTime: number;
      priority: 'low' | 'medium' | 'high' | 'critical';
      complexity: 'low' | 'medium' | 'high';
      systems: string[];
      risks: string[];
      opportunities: string[];
      dependencies: string[];
    }>;
  };
  lang?: 'de' | 'en';
  isVisible?: boolean;
  onSubtaskSelect?: (subtaskId: string) => void;
  selectedSubtaskId?: string;
};

// Removed unused types: SortOption, FilterOption

export default function SubtaskSidebar({ 
  task, 
  lang = 'de', 
  isVisible = false, 
  onSubtaskSelect,
  selectedSubtaskId 
}: SubtaskSidebarProps) {
  const [generatedSubtasks, setGeneratedSubtasks] = useState<Subtask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Record<string, string[]>>({});
  
  // Simplified state - no search, filter, or favorites

  // Handle tool selection
  const handleToolToggle = (subtaskId: string, toolId: string) => {
    setSelectedTools(prev => {
      const current = prev[subtaskId] || [];
      const updated = current.includes(toolId)
        ? current.filter(id => id !== toolId)
        : [...current, toolId];
      
      return {
        ...prev,
        [subtaskId]: updated
      };
    });
  };

  // Simplified handlers - no search, filter, or favorites


  // Get typical applications for a subtask
  const getTypicalApplications = (subtask: Subtask) => {
    // Define typical applications based on subtask content - using available logos
    const applications = [
      { id: 'excel-ai', name: 'Excel AI', logoKey: 'excel-ai', category: 'data' },
      { id: 'power-bi-ai', name: 'Power BI', logoKey: 'power-bi-ai', category: 'analytics' },
      { id: 'google-sheets-ai', name: 'Google Sheets', logoKey: 'google-sheets-ai', category: 'data' },
      { id: 'chatgpt', name: 'ChatGPT', logoKey: 'chatgpt', category: 'ai' },
      { id: 'claude', name: 'Claude', logoKey: 'claude', category: 'ai' },
      { id: 'gemini', name: 'Gemini', logoKey: 'gemini', category: 'ai' },
      { id: 'grok', name: 'Grok', logoKey: 'grok', category: 'ai' },
      { id: 'perplexity', name: 'Perplexity', logoKey: 'perplexity', category: 'ai' },
      { id: 'notion-ai', name: 'Notion AI', logoKey: 'notion-ai', category: 'documentation' },
      { id: 'canva-ai', name: 'Canva AI', logoKey: 'canva-ai', category: 'design' },
      { id: 'copy-ai', name: 'Copy.ai', logoKey: 'copy-ai', category: 'content' },
      { id: 'writesonic', name: 'Writesonic', logoKey: 'writesonic', category: 'content' },
      { id: 'jasper', name: 'Jasper', logoKey: 'jasper', category: 'content' },
      { id: 'grammarly', name: 'Grammarly', logoKey: 'grammarly', category: 'writing' },
      { id: 'github-copilot', name: 'GitHub Copilot', logoKey: 'github-copilot', category: 'development' },
      { id: 'code-whisperer', name: 'Code Whisperer', logoKey: 'code-whisperer', category: 'development' },
      { id: 'tabnine', name: 'Tabnine', logoKey: 'tabnine', category: 'development' },
      { id: 'microsoft-copilot', name: 'Microsoft Copilot', logoKey: 'microsoft-copilot', category: 'ai' },
      { id: 'obsidian-ai', name: 'Obsidian AI', logoKey: 'obsidian-ai', category: 'documentation' },
      { id: 'airtable-ai', name: 'Airtable AI', logoKey: 'airtable-ai', category: 'data' }
    ];

    // Filter applications based on subtask title/content
    const lowerTitle = subtask.title.toLowerCase();
    
    if (lowerTitle.includes('daten') || lowerTitle.includes('data') || lowerTitle.includes('analyse') || lowerTitle.includes('report')) {
      return applications.filter(app => ['excel-ai', 'power-bi-ai', 'google-sheets-ai', 'airtable-ai'].includes(app.id));
    }
    
    if (lowerTitle.includes('präsentation') || lowerTitle.includes('presentation') || lowerTitle.includes('meeting')) {
      return applications.filter(app => ['canva-ai', 'notion-ai', 'microsoft-copilot'].includes(app.id));
    }
    
    if (lowerTitle.includes('dokument') || lowerTitle.includes('document') || lowerTitle.includes('bericht')) {
      return applications.filter(app => ['notion-ai', 'obsidian-ai', 'microsoft-copilot'].includes(app.id));
    }
    
    if (lowerTitle.includes('kommunikation') || lowerTitle.includes('communication') || lowerTitle.includes('email')) {
      return applications.filter(app => ['microsoft-copilot', 'chatgpt', 'claude'].includes(app.id));
    }
    
    if (lowerTitle.includes('projekt') || lowerTitle.includes('project') || lowerTitle.includes('task')) {
      return applications.filter(app => ['notion-ai', 'airtable-ai', 'microsoft-copilot'].includes(app.id));
    }
    
    if (lowerTitle.includes('design') || lowerTitle.includes('visual') || lowerTitle.includes('grafik')) {
      return applications.filter(app => ['canva-ai', 'chatgpt', 'claude'].includes(app.id));
    }
    
    if (lowerTitle.includes('entwicklung') || lowerTitle.includes('development') || lowerTitle.includes('programmierung') || lowerTitle.includes('coding')) {
      return applications.filter(app => ['github-copilot', 'code-whisperer', 'tabnine', 'microsoft-copilot'].includes(app.id));
    }
    
    if (lowerTitle.includes('content') || lowerTitle.includes('text') || lowerTitle.includes('schreiben') || lowerTitle.includes('writing')) {
      return applications.filter(app => ['copy-ai', 'writesonic', 'jasper', 'grammarly', 'chatgpt'].includes(app.id));
    }
    
    if (lowerTitle.includes('ai') || lowerTitle.includes('automatisierung') || lowerTitle.includes('automation')) {
      return applications.filter(app => ['chatgpt', 'claude', 'gemini', 'grok', 'perplexity', 'microsoft-copilot'].includes(app.id));
    }
    
    // Default: return common applications
    return applications.slice(0, 6);
  };

  // Get all subtasks - no filtering, always show all
  const realSubtasks = useMemo(() => {
    console.log('🔍 [SubtaskSidebar] Debug subtasks check:', {
      hasTask: !!task,
      hasSubtasks: !!(task?.subtasks),
      subtasksLength: task?.subtasks?.length || 0,
      subtasksData: task?.subtasks
    });
    
    let baseSubtasks: Subtask[] = [];
    
    if (task?.subtasks && task.subtasks.length > 0) {
      console.log('✅ [SubtaskSidebar] Using real subtasks from task prop:', task.subtasks.length);
      baseSubtasks = task.subtasks.map(subtask => ({
        id: subtask.id || `subtask-${Math.random().toString(36).substr(2, 9)}`,
        title: subtask.title || 'Unbekannte Teilaufgabe',
        systems: subtask.systems || [],
        manualHoursShare: subtask.automationPotential ? (100 - subtask.automationPotential) / 100 : 0.3,
        automationPotential: subtask.automationPotential ? subtask.automationPotential / 100 : 0.7,
        risks: subtask.risks || [],
        assumptions: [],
        kpis: [],
        qualityGates: []
      }));
    } else if (generatedSubtasks.length > 0) {
      console.log('✅ [SubtaskSidebar] Using generated subtasks:', generatedSubtasks.length);
      baseSubtasks = [...generatedSubtasks];
    } else {
      console.log('⚠️ [SubtaskSidebar] No subtasks available, using fallback');
      baseSubtasks = [
        {
          id: 'task-1',
          title: 'Aufgabe planen und strukturieren',
          systems: ['Planning Tools', 'Documentation'],
          manualHoursShare: 0.20,
          automationPotential: 0.60
        },
        {
          id: 'task-2',
          title: 'Aufgabe ausführen',
          systems: ['Execution Tools', 'Workflow'],
          manualHoursShare: 0.40,
          automationPotential: 0.80
        },
        {
          id: 'task-3',
          title: 'Koordination und Kommunikation',
          systems: ['Communication Tools', 'Collaboration'],
          manualHoursShare: 0.25,
          automationPotential: 0.75
        },
        {
          id: 'task-4',
          title: 'Ergebnisse evaluieren und dokumentieren',
          systems: ['Analytics', 'Documentation'],
          manualHoursShare: 0.15,
          automationPotential: 0.85
        }
      ];
    }

    // Always show all subtasks, sorted by automation potential (highest first)
    return baseSubtasks.sort((a, b) => b.automationPotential - a.automationPotential);
  }, [task?.subtasks, generatedSubtasks]);

  if (!isVisible) return null;

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {lang === 'de' ? 'Teilaufgaben' : 'Subtasks'}
          </h3>
          <div className="flex items-center gap-2">
            <SimpleCounter count={realSubtasks.length} isLoading={isGenerating} />
          </div>
        </div>

        {/* Subtasks List */}
        <div className="space-y-3">
              {/* "Alle (Komplettlösungen)" as first item in the list */}
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  selectedSubtaskId === 'all'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSubtaskSelect?.('all')}
              >
                <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {lang === 'de' ? 'Alle' : 'All'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-xs text-gray-600">
                        {lang === 'de' ? 'Übergreifende Lösungen' : 'Overarching solutions'}
                      </span>
                    </div>
                  </div>
                </div>
                </CardContent>
              </Card>

              {/* Individual subtasks */}
              {realSubtasks.map((subtask, index) => (
                <Card
                  key={subtask.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedSubtaskId === subtask.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSubtaskSelect?.(subtask.id)}
                >
                  <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                          <ScoreCircle 
                            score={Math.round(subtask.automationPotential * 100)} 
                            maxScore={100} 
                            variant="xsmall" 
                            lang={lang}
                            animate={false}
                            label=""
                            showPercentage={false}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 flex-1">
                          {subtask.title}
                        </span>
                      </div>

                      {/* Systems */}
                      {subtask.systems && subtask.systems.length > 0 && (
                        <div className="flex items-center gap-1 mb-2 overflow-hidden">
                          {subtask.systems.slice(0, 2).map((system) => (
                            <Badge key={system} variant="secondary" className="text-xs flex-shrink-0">
                              {system}
                            </Badge>
                          ))}
                          {subtask.systems.length > 2 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs flex-shrink-0 cursor-help">
                                    +{subtask.systems.length - 2}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    {subtask.systems.slice(2).join(', ')}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}

                      {/* Applications */}
                      <div className="flex items-center gap-1">
                        {getTypicalApplications(subtask).slice(0, 4).map((app) => (
                          <TooltipProvider key={app.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-5 h-5 rounded-sm overflow-hidden bg-gray-100 flex items-center justify-center">
                                  <AppIcon tool={app} size="sm" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{app.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}
