import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  Zap, 
  Workflow, 
  DollarSign,
  Clock,
  TrendingUp,
  Euro,
  Bot,
  Check,
  HelpCircle
} from 'lucide-react';
import { FastAnalysisEngine } from '../lib/patternEngine/fastAnalysisEngine';
import { TaskSpecificWorkflows } from './TaskSpecificWorkflows';
import { AIToolRecommendations } from './AIToolRecommendations';
import BusinessCase from './BusinessCase';

// Circular Pie Chart Component (same as in TaskList)
const CircularPieChart = ({ automationRatio, humanRatio, size = 60, showPercentage = true }: { 
  automationRatio: number; 
  humanRatio: number; 
  size?: number;
  showPercentage?: boolean;
}) => {
  const radius = size / 2;
  const circumference = 2 * Math.PI * (radius - 2);
  
  // Calculate stroke dasharray for automation (brand color)
  const automationStrokeDasharray = (automationRatio / 100) * circumference;
  const humanStrokeDasharray = (humanRatio / 100) * circumference;
  
  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          fill="none"
          stroke="#ccfbf1"
          strokeWidth="4"
        />
        {/* Automation segment (brand color) */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeDasharray={`${automationStrokeDasharray} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text - only show if showPercentage is true */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs font-bold text-primary">{automationRatio}%</div>
          </div>
        </div>
      )}
    </div>
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



const TaskPanel: React.FC<TaskPanelProps> = ({ 
  task, 
  lang = 'de', 
  onOpenSolutions, 
  isVisible = false 
}) => {
  const [generatedSubtasks, setGeneratedSubtasks] = useState<Subtask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Record<string, string[]>>({});
  const [applicationLogos, setApplicationLogos] = useState<Record<string, string>>({});
  const [solutionsCount, setSolutionsCount] = useState(0);
  
  // Initialize FastAnalysisEngine
  const fastAnalysisEngine = useMemo(() => new FastAnalysisEngine(), []);

  // Get fallback logo URL for an application
  const getFallbackLogo = (logoKey: string): string => {
    const fallbackLogos: Record<string, string> = {
      'excel': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg',
      'powerpoint': 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Microsoft_Office_PowerPoint_%282019%E2%80%93present%29.svg',
      'word': 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Microsoft_Office_Word_%282019%E2%80%93present%29.svg',
      'outlook': 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
      'teams': 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg',
      'sharepoint': 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg',
      'powerbi': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/New_Power_BI_Logo.svg',
      'onedrive': 'https://upload.wikimedia.org/wikipedia/commons/7/7c/OneDrive_logo.svg',
      'google-sheets': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg',
      'google-docs': 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282020%29.svg',
      'calendar': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
      'salesforce': 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
      'slack': 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
      'notion': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
      'asana': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Asana_logo.svg',
      'trello': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Trello_logo.svg',
      'figma': 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg',
      'canva': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg',
      'zoom': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Zoom_logo.svg',
      'dropbox': 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Dropbox_Icon.svg'
    };
    return fallbackLogos[logoKey] || '';
  };

  // Load real application logos using multiple sources
  const loadApplicationLogos = async () => {
    // Map application names to their real domains and alternative sources
    const logoMapping = {
      // Microsoft Office
      'excel': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg',
        fallback: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/microsoftexcel.svg'
      },
      'powerpoint': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Microsoft_Office_PowerPoint_%282019%E2%80%93present%29.svg',
        fallback: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/microsoftpowerpoint.svg'
      },
      'word': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Microsoft_Office_Word_%282019%E2%80%93present%29.svg',
        fallback: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/microsoftword.svg'
      },
            'outlook': {
        primary: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
        fallback: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/microsoftoutlook.svg'
      },
      'teams': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg',
        fallback: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/microsoftteams.svg'
      },
            'sharepoint': {
        primary: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg',
        fallback: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/microsoftsharepoint.svg'
      },
            'powerbi': {
        primary: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/New_Power_BI_Logo.svg',
        fallback: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/powerbi.svg'
      },
      'onedrive': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/OneDrive_logo.svg',
        fallback: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/microsoftonedrive.svg'
      },
      
      // Google Workspace
      'google-sheets': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg',
        fallback: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/googlesheets.svg'
      },
      'google-docs': { 
        primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/googledocs.svg',
        fallback: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282020%29.svg'
      },
      'calendar': { 
        primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/googlecalendar.svg',
        fallback: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg'
      },
      
      // Other applications
      'salesforce': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
        fallback: 'https://logo.clearbit.com/salesforce.com?size=32&format=png'
      },
      'slack': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
        fallback: 'https://logo.clearbit.com/slack.com?size=32&format=png'
      },
      'notion': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
        fallback: 'https://logo.clearbit.com/notion.so?size=32&format=png'
      },
      'asana': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Asana_logo.svg',
        fallback: 'https://logo.clearbit.com/asana.com?size=32&format=png'
      },
      'trello': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Trello_logo.svg',
        fallback: 'https://logo.clearbit.com/trello.com?size=32&format=png'
      },
      'figma': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg',
        fallback: 'https://logo.clearbit.com/figma.com?size=32&format=png'
      },
      'canva': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg',
        fallback: 'https://logo.clearbit.com/canva.com?size=32&format=png'
      },
      'zoom': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Zoom_logo.svg',
        fallback: 'https://logo.clearbit.com/zoom.us?size=32&format=png'
      },
      'dropbox': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Dropbox_Icon.svg',
        fallback: 'https://logo.clearbit.com/dropbox.com?size=32&format=png'
      }
    };

    const logos: Record<string, string> = {};
    
    // Load logos with fallback mechanism
    Object.entries(logoMapping).forEach(([appId, sources]) => {
      logos[appId] = sources.primary;
    });

    setApplicationLogos(logos);
  };

  // Test logo availability and use working ones
  const testAndLoadLogos = async () => {
    const testLogos = {
      'powerbi': [
        'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/powerbi.svg',
        'https://upload.wikimedia.org/wikipedia/commons/c/cf/Power_bi_logo_black.svg'
      ],
      'outlook': [
        'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
        'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/microsoftoutlook.svg'
      ],
      'sharepoint': [
        'https://upload.wikimedia.org/wikipedia/commons/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg',
        'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/microsoftsharepoint.svg'
      ]
    };

    const workingLogos: Record<string, string> = {};
    
    for (const [appId, urls] of Object.entries(testLogos)) {
      for (const url of urls) {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            workingLogos[appId] = url;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    setApplicationLogos(prev => ({ ...prev, ...workingLogos }));
  };

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
  }, [task?.subtasks, generatedSubtasks]);

  // Update solutions count when solutions are loaded
  const handleSolutionsLoaded = (count: number) => {
    setSolutionsCount(count);
  };

  // Get typical applications for a subtask
  const getTypicalApplications = (subtask: Subtask) => {
    // Define typical applications based on subtask content with Simple Icons mapping
    const applications = [
      { id: 'excel', name: 'Excel', logoKey: 'excel', category: 'data' },
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
  
  // Load application logos on component mount
  useEffect(() => {
    loadApplicationLogos();
    testAndLoadLogos(); // Test and load problematic logos
  }, []);

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
            setSolutionsCount(workflows.length);
          })
          .catch(error => {
            console.warn('Failed to preload workflows:', error);
          });
      });
    }
  }, [isVisible, realSubtasks, selectedTools, task.title, task.name]);

  // Reload workflows when selected tools change
  useEffect(() => {
    if (isVisible && realSubtasks && realSubtasks.length > 0) {
      const taskText = realSubtasks.map(subtask => subtask.title).join(' ') || (task.title || task.name || '');
      const selectedApps = Object.values(selectedTools).flat();
      
      // Debounce the reload to avoid too many API calls
      const timeoutId = setTimeout(() => {
        import('../lib/n8nApi').then(({ n8nApiClient }) => {
          n8nApiClient.fastSearchWorkflows(taskText, selectedApps)
            .then(workflows => {
              setSolutionsCount(workflows.length);
            })
            .catch(error => {
              console.warn('Failed to reload workflows:', error);
            });
        });
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedTools, isVisible, realSubtasks, task.title, task.name]);

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
            {solutionsCount > 0 && (
              <Badge className="ml-1 text-xs bg-primary text-primary-foreground">
                {solutionsCount}
              </Badge>
            )}
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
                      <CircularPieChart 
                        automationRatio={Math.round(subtask.automationPotential * 100)} 
                        humanRatio={Math.round((1 - subtask.automationPotential) * 100)} 
                        size={32}
                        showPercentage={false}
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
            <TaskSpecificWorkflows
              taskText={realSubtasks?.map(subtask => subtask.title).join(' ') || (task.title || task.name || '')}
              lang={lang}
              selectedApplications={Object.values(selectedTools).flat()}
              onSolutionsLoaded={handleSolutionsLoaded}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskPanel;
