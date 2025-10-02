import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Loader2
} from 'lucide-react';
import { EffortSection } from './EffortSection';
import { TopSubtasksSection } from './TopSubtasksSection';
import { InsightsTrendsSection } from './InsightsTrendsSection';
import { ImplementationRequestCTA } from './ImplementationRequestCTA';
import { analyzeTrends } from '@/lib/trendAnalysis';
import { matchWorkflowsToSubtasks } from '@/lib/workflowMatcher';
import { DynamicSubtask } from '@/lib/types';
import { generateSubtasksWithAI } from '@/lib/aiAnalysis';
import { isOpenAIAvailable } from '@/lib/openai';
import { workflowIndexer } from '@/lib/workflowIndexer';

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

// ScoreCircle wrapper for consistent styling
const ScoreCircleWrapper = ({ automationRatio, size = 60, lang = 'de', animateKey }: { 
  automationRatio: number; 
  size?: number;
  lang?: string;
  animateKey?: string;
}) => {
  const key = animateKey ? `scorecircle-animated-${animateKey}` : undefined;
  const shouldAnimate = (() => {
    if (!key) return true;
    try {
      const done = sessionStorage.getItem(key);
      return !done;
    } catch {
      return true;
    }
  })();

  // After first mount, mark as animated so reopening tabs won't re-animate
  if (key && shouldAnimate) {
    try { sessionStorage.setItem(key, '1'); } catch {}
  }

  return (
    <div style={{ width: size, height: size }}>
      <ScoreCircle 
        score={automationRatio} 
        maxScore={100} 
        variant="xsmall" 
        lang={lang}
        animate={shouldAnimate}
        label=""
        showPercentage={false}
      />
    </div>
  );
};

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




type TaskPanelProps = {
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
  onOpenSolutions?: (mode: 'templates' | 'agents', subtaskId: string) => void;
  isVisible?: boolean;
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



export default function TaskPanel({ task, lang = 'de', isVisible = false }: TaskPanelProps) {
  const [generatedSubtasks, setGeneratedSubtasks] = useState<Subtask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Record<string, string[]>>({});
  const [solutionsCount, setSolutionsCount] = useState(0);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const hasLoadedSolutions = useRef(false);
  





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

  // Initialize solutions count when subtasks change
  useEffect(() => {
    setSolutionsCount(0);
    // Only set loading if we haven't loaded solutions yet
    if (!hasLoadedSolutions.current) {
      setIsLoadingSolutions(true);
    }
  }, [task?.subtasks, generatedSubtasks]);

  // Start loading solutions when task becomes visible
  useEffect(() => {
    if (isVisible && !hasLoadedSolutions.current) {
      setIsLoadingSolutions(true);
    }
  }, [isVisible]);

  // Update solutions count when solutions are loaded
  const handleSolutionsLoaded = (count: number) => {
    console.log('✅ [TaskPanel] Solutions loaded:', count);
    setIsLoadingSolutions(false);
    setSolutionsCount(count);
    hasLoadedSolutions.current = true; // Mark as loaded
  };

  // Remove the handleSolutionsTabOpen function since we load automatically

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
  


  // Generate subtasks when task becomes visible - WITH DEBOUNCING
  useEffect(() => {
    if (isVisible && task) {
      const taskText = task.title || task.name || task.description || '';
      if (taskText && !task.subtasks) {
        console.log('🔄 [TaskPanel] Generating subtasks for:', taskText);
        setIsGenerating(true);
        
        // DEBOUNCE: Only generate if not already generating for this task
        const taskId = task.id || taskText;
        if (window.subtaskGenerationInProgress?.has(taskId)) {
          console.log('⏳ [TaskPanel] Subtask generation already in progress for:', taskText);
          return;
        }
        
        // Mark as in progress
        if (!window.subtaskGenerationInProgress) {
          window.subtaskGenerationInProgress = new Set();
        }
        window.subtaskGenerationInProgress.add(taskId);
        
        const generateSubtasks = async () => {
          try {
            // 0) Try cache per analysis first
            const cached = await getCachedSubtasksForText(taskText);
            if (cached && cached.length > 0) {
              console.log('✅ [TaskPanel] Using cached subtasks:', cached.length);
              setGeneratedSubtasks(cached);
              window.subtaskGenerationInProgress.delete(taskId);
              return;
            }
            
            // 1) Try AI-powered generation first if available
            if (isOpenAIAvailable()) {
              console.log('🤖 [TaskPanel] Using AI for subtask generation...');
              const aiResult = await generateSubtasksWithAI(taskText, lang);
              
              if (aiResult.aiEnabled && aiResult.subtasks.length > 0) {
                console.log('✅ [TaskPanel] AI generated subtasks:', aiResult.subtasks.length);
                const mappedSubtasks = aiResult.subtasks.map(subtask => ({
                  id: subtask.id,
                  title: subtask.title,
                  systems: subtask.systems || [],
                  aiTools: subtask.aiTools || [],
                  selectedTools: [],
                  manualHoursShare: (100 - subtask.automationPotential) / 100,
                  automationPotential: subtask.automationPotential / 100,
                  risks: subtask.risks || [],
                  assumptions: [],
                  kpis: [],
                  qualityGates: []
                }));
                setGeneratedSubtasks(mappedSubtasks);
                await setCachedSubtasksForText(taskText, mappedSubtasks);
                window.subtaskGenerationInProgress.delete(taskId);
                return;
              }
            }
            
            // No fallback - AI is required
            console.log('❌ [TaskPanel] AI subtask generation failed - no fallback available');
            setGeneratedSubtasks([]);
            window.subtaskGenerationInProgress.delete(taskId);
          } catch (error) {
            console.error('❌ [TaskPanel] Error generating subtasks:', error);
            window.subtaskGenerationInProgress.delete(taskId);
            setGeneratedSubtasks([]);
          } finally {
            setIsGenerating(false);
          }
        };
        
        generateSubtasks();
      }
    }
  }, [isVisible, task, lang]);
  
  // Use real subtasks from task prop or generated subtasks
  const realSubtasks = useMemo(() => {
    console.log('🔍 [TaskPanel] Debug subtasks check:', {
      hasTask: !!task,
      hasSubtasks: !!(task?.subtasks),
      subtasksLength: task?.subtasks?.length || 0,
      subtasksData: task?.subtasks
    });
    
    if (task?.subtasks && task.subtasks.length > 0) {
      console.log('✅ [TaskPanel] Using real subtasks from task prop:', task.subtasks.length);
      const mapped = task.subtasks.map(subtask => ({
        id: subtask.id || `subtask-${Math.random().toString(36).substr(2, 9)}`,
        title: subtask.title || subtask.text || 'Unbekannte Teilaufgabe',
        systems: subtask.systems || [],
        manualHoursShare: subtask.automationPotential ? (100 - subtask.automationPotential) / 100 : 0.3,
        automationPotential: subtask.automationPotential ? subtask.automationPotential / 100 : 0.7,
        risks: subtask.risks || [],
        assumptions: [],
        kpis: [],
        qualityGates: []
      }));
      // Sort by highest savings (manualHoursShare * automationPotential)
      return mapped.sort((a, b) => (b.manualHoursShare * b.automationPotential) - (a.manualHoursShare * a.automationPotential));
    } else if (generatedSubtasks.length > 0) {
      console.log('✅ [TaskPanel] Using generated subtasks:', generatedSubtasks.length);
      // Sort generated by highest savings
      return [...generatedSubtasks].sort((a, b) => (b.manualHoursShare * b.automationPotential) - (a.manualHoursShare * a.automationPotential));
    } else {
      console.log('⚠️ [TaskPanel] No subtasks available, using fallback');
      return [
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
  }, [task?.subtasks, generatedSubtasks]);

  // Preload workflows when task panel becomes visible
  useEffect(() => {
    if (isVisible && realSubtasks && realSubtasks.length > 0) {
      // Mark as loading; SolutionsTab will perform loading via indexer and update count
      setIsLoadingSolutions(true);
    }
  }, [isVisible, realSubtasks]);

  // New: selected period synced with BusinessCase
  type Period = 'year' | 'month' | 'week' | 'day';
  const [period, setPeriod] = useState<Period>('month');
  const HOURS_PER_PERIOD: Record<Period, number> = {
    year: 2080,
    month: 160,
    week: 40,
    day: 8,
  };

  // Calculate business case based on actual subtask effort reduction
  let manualHoursTotal = 0;
  let residualHoursTotal = 0;
  const basePerTaskHours = 8; // baseline per subtask for a day
  const scale = HOURS_PER_PERIOD[period] / HOURS_PER_PERIOD['day'];
  
  // Calculate total manual hours from subtasks
  realSubtasks.forEach(s => {
    manualHoursTotal += s.manualHoursShare * basePerTaskHours * scale;
  });
  
  // Calculate residual hours after automation
  realSubtasks.forEach(s => {
    residualHoursTotal += s.manualHoursShare * basePerTaskHours * (1 - s.automationPotential) * scale;
  });
  
  // Fallback to default values if no subtasks
  if (realSubtasks.length === 0) {
    manualHoursTotal = basePerTaskHours * scale;
    residualHoursTotal = (basePerTaskHours * 0.5) * scale; // Assume 50% automation potential
  }

  // Memoize task object to prevent unnecessary re-renders
  const businessCaseTask = useMemo(() => ({
    name: task.name || task.title,
    text: task.description,
    automationRatio: realSubtasks.reduce((acc, s) => acc + s.automationPotential, 0) / Math.max(realSubtasks.length, 1) * 100,
    humanRatio: realSubtasks.reduce((acc, s) => acc + (1 - s.automationPotential), 0) / Math.max(realSubtasks.length, 1) * 100,
    subtasks: realSubtasks.map(s => ({
      id: s.id,
      title: s.title,
      estimatedTime: s.manualHoursShare * basePerTaskHours, // base at day; BusinessCase scales by period
      automationPotential: s.automationPotential
    }))
  }), [task.name, task.title, task.description, realSubtasks, basePerTaskHours]);

  // Convert realSubtasks to DynamicSubtask format for new components
  const dynamicSubtasks: DynamicSubtask[] = useMemo(() => {
    return realSubtasks.map(s => ({
      id: s.id,
      title: s.title,
      description: '', // Not available in current format
      automationPotential: s.automationPotential,
      estimatedTime: s.manualHoursShare * basePerTaskHours,
      priority: 'medium' as const,
      complexity: 'medium' as const,
      systems: s.systems || [],
      dependencies: [],
      risks: s.risks || [],
      opportunities: [],
      aiTools: s.aiTools
    }));
  }, [realSubtasks, basePerTaskHours]);

  // Load workflows for matching
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [trendInsights, setTrendInsights] = useState<any[]>([]);

  useEffect(() => {
    if (isVisible && dynamicSubtasks.length > 0) {
      // Load workflows from indexer
      const loadWorkflows = async () => {
        try {
          const taskQuery = task.title || task.name || '';
          console.log('🔍 [TaskPanel] Loading workflows for query:', taskQuery);
          
          const results = await workflowIndexer.searchWorkflows({
            query: taskQuery,
            limit: 50 // Increase limit for better matching
          });
          
          console.log('✅ [TaskPanel] Loaded workflows:', results.workflows.length);
          setWorkflows(results.workflows); // FIX: Use results.workflows instead of results

          // Analyze trends
          const trends = analyzeTrends(results.workflows, dynamicSubtasks, {
            includeCategory: task.category
          });
          console.log('📊 [TaskPanel] Trend insights:', trends.length);
          setTrendInsights(trends);
        } catch (error) {
          console.error('❌ [TaskPanel] Error loading workflows:', error);
        }
      };
      loadWorkflows();
    }
  }, [isVisible, dynamicSubtasks, task.title, task.name, task.category]);

  if (!isVisible) return null;

  return (
    <div className="space-y-5">
      {/* Effort/ROI Section */}
      <EffortSection
        manualHours={manualHoursTotal}
        automatedHours={residualHoursTotal}
        hourlyRate={60} // Default rate
        period={period}
        lang={lang}
        onHourlyRateChange={(newRate) => {
          console.log('Hourly rate changed:', newRate);
          // Could store in state if needed
        }}
      />

      {/* Top Subtasks Section with Workflows */}
      {isGenerating ? (
        <Card className="shadow-sm">
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm">
                {lang === 'de' ? 'Generiere spezifische Teilaufgaben...' : 'Generating specific subtasks...'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <TopSubtasksSection
              subtasks={dynamicSubtasks}
              workflows={workflows}
              lang={lang}
              topCount={3}
              sortBy="automationPotential"
              period={period}
            />
          </CardContent>
        </Card>
      )}

      {/* Insights & Trends Section */}
      {trendInsights.length > 0 && (
        <InsightsTrendsSection
          insights={trendInsights}
          lang={lang}
        />
      )}

      {/* CTA Button - Implementation Request */}
      <div className="flex justify-center pt-4 pb-2">
        <ImplementationRequestCTA
          taskTitle={task.title || task.name}
          taskDescription={task.description}
          subtasks={dynamicSubtasks}
          automationScore={Math.round(businessCaseTask.automationRatio)}
          estimatedSavings={{
            hours: manualHoursTotal - residualHoursTotal,
            cost: (manualHoursTotal - residualHoursTotal) * 60,
            period: period === 'year' ? (lang === 'de' ? 'Jahr' : 'year') :
                   period === 'month' ? (lang === 'de' ? 'Monat' : 'month') :
                   period === 'week' ? (lang === 'de' ? 'Woche' : 'week') :
                   (lang === 'de' ? 'Tag' : 'day')
          }}
          lang={lang}
          size="lg"
        />
      </div>
    </div>
  );
};
