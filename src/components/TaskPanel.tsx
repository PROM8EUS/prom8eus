import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { TaskSpecificWorkflows } from './TaskSpecificWorkflows';
import BusinessCase from './BusinessCase';
import { DynamicSubtask } from '@/lib/patternEngine/dynamicSubtaskGenerator';
import { fastAnalysisEngine } from '@/lib/patternEngine/fastAnalysisEngine';

// ScoreCircle wrapper for consistent styling
const ScoreCircleWrapper = ({ automationRatio, size = 60, lang = 'de' }: { 
  automationRatio: number; 
  size?: number;
  lang?: string;
}) => {
  return (
    <div style={{ width: size, height: size }}>
      <ScoreCircle 
        score={automationRatio} 
        maxScore={100} 
        variant="xsmall" 
        lang={lang}
      />
    </div>
  );
};

// Animated Counter Badge Component
const AnimatedCounterBadge = ({ count, isLoading }: { count: number; isLoading: boolean }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setCurrentIndex(0);
      setIsAnimating(false);
      return;
    }

    // Only animate when count changes and we're not loading
    if (count > 0 && !isAnimating && !isLoading) {
      setIsAnimating(true);
      const duration = 3000; // 3 second animation (slower)
      const steps = 120; // More steps for smoother animation
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

  // Always show badge, but with different content based on state
  if (isLoading) {
    return (
      <Badge className="ml-1 text-xs bg-primary text-primary-foreground flex items-center gap-1 animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
      </Badge>
    );
  }

  // Only show badge if count > 0
  if (count === 0) {
    return null;
  }

  return (
    <Badge className="ml-1 text-xs bg-primary text-primary-foreground overflow-hidden">
      <div className="relative h-5">
        <div 
          className="transition-transform duration-100 ease-out"
          style={{
            transform: `translateY(-${currentIndex * 20}px)`,
          }}
        >
          {Array.from({ length: count }, (_, i) => i + 1).map((num) => (
            <div key={num} className="h-5 flex items-center justify-center text-sm font-medium">
              {num}
            </div>
          ))}
        </div>
      </div>
    </Badge>
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
  
  // fastAnalysisEngine is already a singleton instance, no need to create new one





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
  


  // Generate subtasks when task becomes visible
  useEffect(() => {
    if (isVisible && task) {
      const taskText = task.title || task.name || task.description || '';
      if (taskText && !task.subtasks) {
        console.log('🔄 [TaskPanel] Generating subtasks for:', taskText);
        setIsGenerating(true);
        
        try {
          const analysis = fastAnalysisEngine.analyzeTask(taskText);
          console.log('✅ [TaskPanel] Generated subtasks:', analysis.subtasks?.length || 0);
          
          if (analysis.subtasks && analysis.subtasks.length > 0) {
            const mappedSubtasks = analysis.subtasks.map(subtask => ({
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
          } else {
            console.log('⚠️ [TaskPanel] No subtasks generated, using fallback');
            setGeneratedSubtasks([]);
          }
        } catch (error) {
          console.error('❌ [TaskPanel] Error generating subtasks:', error);
          setGeneratedSubtasks([]);
        } finally {
          setIsGenerating(false);
        }
      }
    }
  }, [isVisible, task, fastAnalysisEngine]);
  
  // Use real subtasks from task prop or generated subtasks
  const realSubtasks = useMemo(() => {
    if (task?.subtasks && task.subtasks.length > 0) {
      console.log('✅ [TaskPanel] Using real subtasks from task prop:', task.subtasks.length);
      return task.subtasks.map(subtask => ({
        id: subtask.id,
        title: subtask.title,
        systems: subtask.systems || [],
        manualHoursShare: (100 - subtask.automationPotential) / 100,
        automationPotential: subtask.automationPotential / 100,
        risks: subtask.risks || [],
        assumptions: [],
        kpis: [],
        qualityGates: []
      }));
    } else if (generatedSubtasks.length > 0) {
      console.log('✅ [TaskPanel] Using generated subtasks:', generatedSubtasks.length);
      return generatedSubtasks;
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
      // Preload workflows in background
      const taskText = realSubtasks.map(subtask => subtask.title).join(' ') || (task.title || task.name || '');
      const selectedApps = Object.values(selectedTools).flat();
      
      // Import and call the workflow loading function
      import('../lib/n8nApi').then(({ n8nApiClient }) => {
        n8nApiClient.fastSearchWorkflows(taskText, selectedApps)
          .then(workflows => {
            // Only update if count actually changed to prevent unnecessary re-renders
            setSolutionsCount(prevCount => {
              if (prevCount !== workflows.length) {
                return workflows.length;
              }
              return prevCount;
            });
          })
          .catch(error => {
            console.warn('Failed to preload workflows:', error);
          });
      });
    }
  }, [isVisible, realSubtasks, selectedTools, task.title, task.name]);

  // Calculate business case based on actual subtask effort reduction
  let manualHoursTotal = 0;
  let residualHoursTotal = 0;
  
  // Calculate total manual hours from subtasks
  realSubtasks.forEach(s => {
    manualHoursTotal += s.manualHoursShare * 8; // 8 hours base per task
  });
  
  // Calculate residual hours after automation
  realSubtasks.forEach(s => {
    residualHoursTotal += s.manualHoursShare * 8 * (1 - s.automationPotential);
  });
  
  // Fallback to default values if no subtasks
  if (realSubtasks.length === 0) {
    manualHoursTotal = 8;
    residualHoursTotal = 4; // Assume 50% automation potential
  }

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Business Case */}
      <BusinessCase 
        task={{
          name: task.name || task.title,
          text: task.description,
          automationRatio: realSubtasks.reduce((acc, s) => acc + s.automationPotential, 0) / Math.max(realSubtasks.length, 1) * 100,
          humanRatio: realSubtasks.reduce((acc, s) => acc + (1 - s.automationPotential), 0) / Math.max(realSubtasks.length, 1) * 100,
          subtasks: realSubtasks.map(s => ({
            id: s.id,
            title: s.title,
            estimatedTime: s.manualHoursShare * 8,
            automationPotential: s.automationPotential
          }))
        }}
        lang={lang}
      />

      {/* Subtasks and Solutions */}
      <Tabs defaultValue="subtasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subtasks" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            {lang === 'de' ? 'Teilaufgaben' : 'Subtasks'}
          </TabsTrigger>
          <TabsTrigger value="solutions" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {lang === 'de' ? 'Lösungen' : 'Solutions'}
            <AnimatedCounterBadge count={solutionsCount} isLoading={isGenerating || isLoadingSolutions} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subtasks" className="space-y-4">
          {isGenerating ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm">
                {lang === 'de' ? 'Generiere spezifische Teilaufgaben...' : 'Generating specific subtasks...'}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {realSubtasks.map((subtask, index) => {
              const hoursBefore = subtask.manualHoursShare * 8; // 8 hours base per task
              const hoursAfter = subtask.manualHoursShare * 8 * (1 - subtask.automationPotential);
              
              return (
                <div key={subtask.id} className={`py-2 px-4 ${index < realSubtasks.length - 1 ? 'border-b' : ''}`}>
                  <div className="flex items-center gap-4">
                    {/* Circular Progress Chart for each subtask */}
                    <div className="flex-shrink-0 flex items-center">
                      <ScoreCircleWrapper 
                        automationRatio={Math.round(subtask.automationPotential * 100)} 
                        size={32}
                        lang={lang}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex items-center">
                      <div className="flex items-center justify-between w-full">
                        <div className="font-medium text-sm text-gray-900">{subtask.title}</div>
                        
                        {/* Zeitersparnis */}
                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <span className="text-gray-400">{hoursBefore.toFixed(1)}h</span>
                          <span className="text-primary">→</span>
                          <span className="text-green-600 font-semibold">{hoursAfter.toFixed(1)}h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="solutions" className="space-y-4">
          {isGenerating ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm">
                {lang === 'de' ? 'Generiere Lösungen...' : 'Generating solutions...'}
              </p>
            </div>
          ) : (
            <div className="min-h-[200px]">
              <TaskSpecificWorkflows
                taskText={realSubtasks?.map(subtask => subtask.title).join(' ') || (task.title || task.name || '')}
                lang={lang}
                selectedApplications={Object.values(selectedTools).flat()}
                onSolutionsLoaded={handleSolutionsLoaded}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Hidden TaskSpecificWorkflows to load solutions in background */}
      {isVisible && !isGenerating && (
        <div className="hidden">
          <TaskSpecificWorkflows
            taskText={realSubtasks?.map(subtask => subtask.title).join(' ') || (task.title || task.name || '')}
            lang={lang}
            selectedApplications={Object.values(selectedTools).flat()}
            onSolutionsLoaded={handleSolutionsLoaded}
          />
        </div>
      )}
    </div>
  );
};
