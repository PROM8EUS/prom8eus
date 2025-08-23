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
  const [hourlyRate, setHourlyRate] = useState(40);
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
  
  const monthlySolutionCost = 78; // Default cost

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Business Case */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Business Case
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">€/h:</span>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-lg font-semibold">{manualHoursTotal}h</div>
              <div className="text-xs text-gray-600">Manuell</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Zap className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-lg font-semibold">{residualHoursTotal.toFixed(1)}h</div>
              <div className="text-xs text-gray-600">Auto</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <div className="text-lg font-semibold">{(manualHoursTotal - residualHoursTotal).toFixed(1)}h</div>
              <div className="text-xs text-gray-600">Ersparnis</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Euro className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-lg font-semibold">€{Math.round((manualHoursTotal - residualHoursTotal) * hourlyRate * 4.33)}</div>
              <div className="text-xs text-gray-600">Monatlich</div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              <span>Vorher: €{Math.round(manualHoursTotal * hourlyRate * 4.33)}</span>
              <span>Nachher: €{Math.round(residualHoursTotal * hourlyRate * 4.33 + monthlySolutionCost)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.max(0, Math.round(((manualHoursTotal * hourlyRate * 4.33) - (residualHoursTotal * hourlyRate * 4.33 + monthlySolutionCost)) / (manualHoursTotal * hourlyRate * 4.33) * 100))}%` 
                }}
              ></div>
            </div>
            <div className="text-center mt-2 text-sm">
              <span className={((manualHoursTotal * hourlyRate * 4.33) - (residualHoursTotal * hourlyRate * 4.33 + monthlySolutionCost)) > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {((manualHoursTotal * hourlyRate * 4.33) - (residualHoursTotal * hourlyRate * 4.33 + monthlySolutionCost)) > 0 ? '+' : ''}€{Math.round((manualHoursTotal * hourlyRate * 4.33) - (residualHoursTotal * hourlyRate * 4.33 + monthlySolutionCost))} monatliche Einsparung
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-2">
              {realSubtasks.map((subtask) => {
              const hoursBefore = subtask.manualHoursShare * 8; // 8 hours base per task
              const hoursAfter = subtask.manualHoursShare * 8 * (1 - subtask.automationPotential);
              
              return (
                <div key={subtask.id} className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="flex items-center gap-4">
                    {/* Mini Pie Chart for each subtask */}
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="3"
                          strokeDasharray={`${subtask.automationPotential * 100}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">
                          {Math.round(subtask.automationPotential * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 mb-2">{subtask.title}</div>
                      
                                                                   {/* Eingesetzte Anwendungen und Zeitersparnis in zwei Spalten */}
                       <div className="grid grid-cols-[1fr_auto] gap-4 mb-2">
                        {/* Eingesetzte Anwendungen */}
                        <div>
                          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            {lang === 'de' ? 'Eingesetzte Anwendungen:' : 'Used Applications:'}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    {lang === 'de' 
                                      ? 'Diese Auswahl dient als Filter für die Lösungen dieser Aufgabe. Nur Lösungen, die mit den ausgewählten Anwendungen kompatibel sind, werden angezeigt.'
                                      : 'This selection serves as a filter for the solutions of this task. Only solutions compatible with the selected applications will be displayed.'
                                    }
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {getTypicalApplications(subtask).map((app) => {
                              const isSelected = selectedTools[subtask.id]?.includes(app.id) || false;
                              return (
                                <div
                                  key={app.id}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md border cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'bg-primary/10 border-primary/30 text-primary' 
                                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                  onClick={() => handleToolToggle(subtask.id, app.id)}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    {isSelected ? (
                                      <Check className="w-3 h-3 text-primary" />
                                    ) : (
                                      <div className="w-3 h-3 rounded-sm border border-gray-300" />
                                    )}
                                  </div>
                                  <div className="w-4 h-4 rounded-sm bg-gray-100 flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={applicationLogos[app.logoKey] || getFallbackLogo(app.logoKey)}
                                      alt={app.name}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        // Try fallback logo first
                                        const fallbackUrl = getFallbackLogo(app.logoKey);
                                        if (fallbackUrl && fallbackUrl !== e.currentTarget.src) {
                                          e.currentTarget.src = fallbackUrl;
                                          return;
                                        }
                                        
                                        // Final fallback to text-based icon
                                        e.currentTarget.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-200 rounded';
                                        fallback.textContent = app.name.charAt(0).toUpperCase();
                                        e.currentTarget.parentNode?.appendChild(fallback);
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">{app.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Zeitersparnis */}
                        <div>
                          <div className="text-xs text-gray-600 mb-1">
                            {lang === 'de' ? 'Zeitersparnis:' : 'Time savings:'}
                          </div>
                          <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <span className="text-gray-400">{hoursBefore.toFixed(1)}h</span>
                            <span className="text-primary">→</span>
                            <span className="text-green-600 font-semibold">{hoursAfter.toFixed(1)}h</span>
                          </div>
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
