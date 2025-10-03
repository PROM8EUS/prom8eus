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

// Animated Counter Badge Component
const AnimatedCounterBadge = ({ count, isLoading }: { count: number; isLoading: boolean }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const ITEM_HEIGHT = 16; // px — compact height to avoid changing tab size

  useEffect(() => {
    if (isLoading) {
      setCurrentIndex(0);
      setIsAnimating(false);
      return;
    }

    // Only animate when count changes and we're not loading
    if (count > 0 && !isAnimating && !isLoading) {
      setIsAnimating(true);
      const duration = 2000; // 2s for a subtler animation
      const steps = Math.min(80, Math.max(30, count * 20));
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const targetIndex = Math.floor(progress * count);
        setCurrentIndex(Math.min(targetIndex, count - 1));
        
        if (currentStep >= steps) {
          setCurrentIndex(count - 1);
          setIsAnimating(false);
          clearInterval(timer);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    } else if (count > 0 && !isLoading) {
      // If not animating but count is available, set it directly
      setCurrentIndex(count - 1);
    }
  }, [count, isLoading, isAnimating]);

  // Loading shimmer — compact and brand-colored
  if (isLoading) {
    return (
      <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[18px] px-1.5 rounded-full bg-primary/80 text-primary-foreground text-[10px] leading-none animate-pulse">
        ·
      </span>
    );
  }

  // Only show badge if count > 0
  if (count === 0) {
    return null;
  }

  return (
    <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[18px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] leading-none overflow-hidden">
      <span 
        className="relative"
        style={{ height: ITEM_HEIGHT, display: 'inline-block' }}
      >
        <span 
          className="transition-transform duration-100 ease-out block"
          style={{ transform: `translateY(-${currentIndex * ITEM_HEIGHT}px)` }}
        >
          {Array.from({ length: count }, (_, i) => i + 1).map((num) => (
            <span key={num} className="flex items-center justify-center" style={{ height: ITEM_HEIGHT, lineHeight: `${ITEM_HEIGHT}px` }}>
              {num}
            </span>
          ))}
        </span>
      </span>
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get typical applications for a subtask
  const getTypicalApplications = (subtask: Subtask) => {
    // Define typical applications based on subtask content with Simple Icons mapping
    const applications = [
      { id: 'excel-ai', name: 'Excel AI', logoKey: 'excel-ai', category: 'data' },
      { id: 'powerpoint', name: 'PowerPoint', logoKey: 'powerpoint', category: 'presentation' },
      { id: 'word', name: 'Word', logoKey: 'word', category: 'documentation' },
      { id: 'outlook', name: 'Outlook', logoKey: 'outlook', category: 'communication' },
      { id: 'teams', name: 'Teams', logoKey: 'teams', category: 'collaboration' },
      { id: 'sharepoint', name: 'SharePoint', logoKey: 'sharepoint', category: 'storage' },
      { id: 'powerbi', name: 'Power BI', logoKey: 'powerbi', category: 'analytics' },
      { id: 'salesforce', name: 'Salesforce', logoKey: 'salesforce', category: 'crm' },
      { id: 'slack', name: 'Slack', logoKey: 'slack', category: 'communication' },
      { id: 'notion', name: 'Notion', logoKey: 'notion', category: 'documentation' },
      { id: 'asana', name: 'Asana', logoKey: 'asana', category: 'project' },
      { id: 'trello', name: 'Trello', logoKey: 'trello', category: 'project' },
      { id: 'figma', name: 'Figma', logoKey: 'figma', category: 'design' },
      { id: 'canva', name: 'Canva', logoKey: 'canva', category: 'design' },
      { id: 'google-sheets', name: 'Google Sheets', logoKey: 'google-sheets', category: 'data' },
      { id: 'google-docs', name: 'Google Docs', logoKey: 'google-docs', category: 'documentation' },
      { id: 'zoom', name: 'Zoom', logoKey: 'zoom', category: 'communication' },
      { id: 'calendar', name: 'Google Calendar', logoKey: 'calendar', category: 'scheduling' },
      { id: 'dropbox', name: 'Dropbox', logoKey: 'dropbox', category: 'storage' },
      { id: 'onedrive', name: 'OneDrive', logoKey: 'onedrive', category: 'storage' }
    ];

    // Filter applications based on subtask title/content
    const lowerTitle = subtask.title.toLowerCase();
    
    if (lowerTitle.includes('daten') || lowerTitle.includes('data') || lowerTitle.includes('analyse') || lowerTitle.includes('report')) {
      return applications.filter(app => ['excel', 'powerbi', 'google-sheets'].includes(app.id));
    }
    
    if (lowerTitle.includes('präsentation') || lowerTitle.includes('presentation') || lowerTitle.includes('meeting')) {
      return applications.filter(app => ['powerpoint', 'teams', 'zoom'].includes(app.id));
    }
    
    if (lowerTitle.includes('dokument') || lowerTitle.includes('document') || lowerTitle.includes('bericht')) {
      return applications.filter(app => ['word', 'google-docs', 'notion'].includes(app.id));
    }
    
    if (lowerTitle.includes('kommunikation') || lowerTitle.includes('communication') || lowerTitle.includes('email')) {
      return applications.filter(app => ['outlook', 'teams', 'slack'].includes(app.id));
    }
    
    if (lowerTitle.includes('projekt') || lowerTitle.includes('project') || lowerTitle.includes('task')) {
      return applications.filter(app => ['asana', 'trello', 'notion'].includes(app.id));
    }
    
    if (lowerTitle.includes('design') || lowerTitle.includes('visual') || lowerTitle.includes('grafik')) {
      return applications.filter(app => ['figma', 'canva', 'powerpoint'].includes(app.id));
    }
    
    if (lowerTitle.includes('storage') || lowerTitle.includes('datei') || lowerTitle.includes('file')) {
      return applications.filter(app => ['sharepoint', 'dropbox', 'onedrive'].includes(app.id));
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
          id: 'planning',
          title: 'Aufgabe planen und strukturieren',
          systems: ['Planning Tools', 'Documentation'],
          manualHoursShare: 0.20,
          automationPotential: 0.60
        },
        {
          id: 'execution',
          title: 'Aufgabe ausführen',
          systems: ['Execution Tools', 'Workflow'],
          manualHoursShare: 0.40,
          automationPotential: 0.80
        },
        {
          id: 'coordination',
          title: 'Koordination und Kommunikation',
          systems: ['Communication Tools', 'Collaboration'],
          manualHoursShare: 0.25,
          automationPotential: 0.75
        },
        {
          id: 'evaluation',
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
      <Card className="shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {lang === 'de' ? 'Teilaufgaben' : 'Subtasks'}
              </h3>
              <div className="flex items-center gap-2">
                <AnimatedCounterBadge count={realSubtasks.length} isLoading={isGenerating} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleCollapse}
                  className="h-8 w-8 p-0"
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rotate-90" />}
                </Button>
              </div>
            </div>

            {/* Subtasks List */}
            {!isCollapsed && (
            <div className="space-y-3">
              {/* "Alle" as first item in the list */}
              <div
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedSubtaskId === 'all'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => onSubtaskSelect?.('all')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {lang === 'de' ? 'Alle' : 'All'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-gray-600">
                        {realSubtasks.length} {lang === 'de' ? 'Teilaufgaben' : 'Subtasks'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual subtasks */}
              {realSubtasks.map((subtask, index) => (
                <div
                  key={subtask.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedSubtaskId === subtask.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => onSubtaskSelect?.(subtask.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {subtask.title}
                        </span>
                        {/* Removed favorite button */}
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                      
                      {/* Automation Potential */}
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-gray-600">
                          {Math.round(subtask.automationPotential * 100)}% {lang === 'de' ? 'Automatisierung' : 'Automation'}
                        </span>
                      </div>

                      {/* Systems */}
                      {subtask.systems && subtask.systems.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {subtask.systems.slice(0, 3).map((system) => (
                            <Badge key={system} variant="secondary" className="text-xs">
                              {system}
                            </Badge>
                          ))}
                          {subtask.systems.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{subtask.systems.length - 3}
                            </Badge>
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
                                  <div className="w-4 h-4 bg-gray-200 rounded-sm flex items-center justify-center text-xs font-medium text-gray-600">
                                    {app.name.charAt(0)}
                                  </div>
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
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* All Solutions Option */}
            {!isCollapsed && (
            <div className="pt-2 border-t border-gray-200">
              <div
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedSubtaskId === 'all'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => onSubtaskSelect?.('all')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-gray-900">
                      {lang === 'de' ? 'Alle (Komplettlösungen)' : 'All (Complete Solutions)'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {lang === 'de' 
                    ? 'Übergreifende Lösungen für die gesamte Aufgabe'
                    : 'Comprehensive solutions for the entire task'
                  }
                </p>
              </div>
            </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
