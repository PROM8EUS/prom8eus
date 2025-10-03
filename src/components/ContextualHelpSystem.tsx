/**
 * ContextualHelpSystem Component
 * Provides intelligent contextual help based on user behavior and current context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SmartTooltip } from './ui/SmartTooltip';
import { 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  Target,
  TrendingUp,
  Users,
  Settings,
  Sparkles,
  ChevronRight,
  X,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface HelpContext {
  section: string;
  element: string;
  action: string;
  timestamp: number;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface HelpContent {
  title: string;
  description: string;
  examples?: string[];
  tips?: string[];
  links?: Array<{
    text: string;
    url: string;
    external?: boolean;
  }>;
  related?: string[];
  priority: 'high' | 'medium' | 'low';
  category: 'workflow' | 'agent' | 'llm' | 'general' | 'navigation';
}

interface ContextualHelpContextType {
  currentContext: HelpContext | null;
  helpContent: Record<string, HelpContent>;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  isHelpMode: boolean;
  showHints: boolean;
  updateContext: (context: Partial<HelpContext>) => void;
  setUserLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  toggleHelpMode: () => void;
  toggleHints: () => void;
  getContextualHelp: (section: string, element?: string) => HelpContent | null;
  trackUserAction: (action: string, section: string, element?: string) => void;
}

const ContextualHelpContext = createContext<ContextualHelpContextType | null>(null);

export function useContextualHelp() {
  const context = useContext(ContextualHelpContext);
  if (!context) {
    throw new Error('useContextualHelp must be used within a ContextualHelpProvider');
  }
  return context;
}

// Predefined help content
const helpContentDatabase: Record<string, HelpContent> = {
  'solutions-overview': {
    title: 'Automation Solutions',
    description: 'This section shows three types of automation solutions: Workflows (n8n/Zapier), AI Agents, and LLM Prompts. Each solution type offers different approaches to automating your task.',
    examples: [
      'Workflows: Visual automation with n8n or Zapier',
      'Agents: AI-powered autonomous task execution',
      'LLMs: Optimized prompts for manual task assistance'
    ],
    tips: [
      'Start with workflows for complex, multi-step processes',
      'Use agents for tasks requiring decision-making',
      'LLM prompts are great for creative or analytical tasks'
    ],
    priority: 'high',
    category: 'general'
  },
  'workflow-tab': {
    title: 'Workflow Solutions',
    description: 'Workflows are visual automation sequences that connect different services and applications. They can handle complex, multi-step processes automatically.',
    examples: [
      'Email marketing automation with Mailchimp',
      'Data synchronization between CRM and spreadsheet',
      'Social media posting across multiple platforms'
    ],
    tips: [
      'Download blueprints to import into your n8n instance',
      'Request setup help for complex integrations',
      'Check the status badge to see if the workflow is verified'
    ],
    priority: 'high',
    category: 'workflow'
  },
  'agent-tab': {
    title: 'AI Agent Solutions',
    description: 'AI Agents are autonomous systems that can perform tasks, make decisions, and interact with various tools and services on your behalf.',
    examples: [
      'Customer support agent with knowledge base access',
      'Data analysis agent with reporting capabilities',
      'Content creation agent with research and writing tools'
    ],
    tips: [
      'Agents work best for tasks requiring decision-making',
      'Each agent has specific functions and tools available',
      'Request setup to get the agent configured for your environment'
    ],
    priority: 'high',
    category: 'agent'
  },
  'llm-tab': {
    title: 'LLM Prompt Solutions',
    description: 'LLM Prompts are optimized text instructions that help you get better results from AI language models like ChatGPT, Claude, or others.',
    examples: [
      'Structured prompt for content creation',
      'Analysis prompt for data interpretation',
      'Creative prompt for brainstorming sessions'
    ],
    tips: [
      'Copy prompts to use in your preferred AI service',
      'Different prompts work better for different AI models',
      'Prompts can be customized for your specific needs'
    ],
    priority: 'high',
    category: 'llm'
  },
  'subtask-navigation': {
    title: 'Subtask Navigation',
    description: 'Use the sidebar to navigate between different subtasks. Each subtask shows specific automation solutions tailored to that part of your overall task.',
    examples: [
      'Click on a subtask to see its specific solutions',
      'Use "All (Complete Solutions)" for overarching approaches',
      'Filter and sort subtasks by automation potential'
    ],
    tips: [
      'High automation potential subtasks are prioritized',
      'Use search to quickly find specific subtasks',
      'Star favorite subtasks for quick access'
    ],
    priority: 'medium',
    category: 'navigation'
  },
  'roi-section': {
    title: 'ROI & Cost Analysis',
    description: 'This section shows the potential time and cost savings from automation. It calculates setup costs and break-even points to help you make informed decisions.',
    examples: [
      'Manual hours vs automated hours comparison',
      'Setup cost estimates based on complexity',
      'Break-even point calculation in months'
    ],
    tips: [
      'Adjust hourly rate to match your organization',
      'Setup costs are estimated based on complexity',
      'ROI calculations help justify automation investments'
    ],
    priority: 'medium',
    category: 'general'
  }
};

interface ContextualHelpProviderProps {
  children: React.ReactNode;
  initialUserLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export function ContextualHelpProvider({ 
  children, 
  initialUserLevel = 'beginner' 
}: ContextualHelpProviderProps) {
  const [currentContext, setCurrentContext] = useState<HelpContext | null>(null);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(initialUserLevel);
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [userActions, setUserActions] = useState<HelpContext[]>([]);

  // Load user preferences from localStorage
  useEffect(() => {
    const savedLevel = localStorage.getItem('user-help-level');
    const savedHints = localStorage.getItem('show-help-hints');
    
    if (savedLevel) {
      setUserLevel(savedLevel as any);
    }
    if (savedHints !== null) {
      setShowHints(JSON.parse(savedHints));
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('user-help-level', userLevel);
    localStorage.setItem('show-help-hints', JSON.stringify(showHints));
  }, [userLevel, showHints]);

  const updateContext = useCallback((context: Partial<HelpContext>) => {
    setCurrentContext(prev => ({
      ...prev,
      ...context,
      timestamp: Date.now()
    } as HelpContext));
  }, []);

  const trackUserAction = useCallback((action: string, section: string, element?: string) => {
    const newAction: HelpContext = {
      section,
      element: element || '',
      action,
      timestamp: Date.now(),
      userLevel
    };
    
    setUserActions(prev => [...prev.slice(-9), newAction]); // Keep last 10 actions
    updateContext(newAction);
  }, [userLevel, updateContext]);

  const getContextualHelp = useCallback((section: string, element?: string): HelpContent | null => {
    const key = element ? `${section}-${element}` : section;
    return helpContentDatabase[key] || null;
  }, []);

  const toggleHelpMode = useCallback(() => {
    setIsHelpMode(prev => !prev);
  }, []);

  const toggleHints = useCallback(() => {
    setShowHints(prev => !prev);
  }, []);

  const contextValue: ContextualHelpContextType = {
    currentContext,
    helpContent: helpContentDatabase,
    userLevel,
    isHelpMode,
    showHints,
    updateContext,
    setUserLevel,
    toggleHelpMode,
    toggleHints,
    getContextualHelp,
    trackUserAction
  };

  return (
    <ContextualHelpContext.Provider value={contextValue}>
      {children}
    </ContextualHelpContext.Provider>
  );
}

interface ContextualHelpPanelProps {
  lang?: 'de' | 'en';
  className?: string;
}

export function ContextualHelpPanel({ lang = 'en', className = '' }: ContextualHelpPanelProps) {
  const { 
    userLevel, 
    isHelpMode, 
    showHints, 
    setUserLevel, 
    toggleHelpMode, 
    toggleHints,
    currentContext,
    getContextualHelp
  } = useContextualHelp();

  const currentHelp = currentContext ? getContextualHelp(currentContext.section, currentContext.element) : null;

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {lang === 'de' ? 'Kontextuelle Hilfe' : 'Contextual Help'}
                </h3>
                <p className="text-sm text-gray-600">
                  {lang === 'de' 
                    ? 'Intelligente Hilfe basierend auf Ihrem Kontext'
                    : 'Intelligent help based on your context'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isHelpMode ? "default" : "outline"}
                size="sm"
                onClick={toggleHelpMode}
                className="flex items-center gap-2"
              >
                {isHelpMode ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {lang === 'de' ? 'Hilfe-Modus' : 'Help Mode'}
              </Button>
            </div>
          </div>

          {/* Current Context Help */}
          {currentHelp && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">
                    {currentHelp.title}
                  </h4>
                  <p className="text-sm text-blue-800">
                    {currentHelp.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Level Selection */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Target className="h-4 w-4" />
              {lang === 'de' ? 'Benutzerstufe' : 'User Level'}
            </h4>
            <div className="flex gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <Button
                  key={level}
                  variant={userLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUserLevel(level)}
                  className="capitalize"
                >
                  {lang === 'de' 
                    ? (level === 'beginner' ? 'Anfänger' : level === 'intermediate' ? 'Fortgeschritten' : 'Experte')
                    : level
                  }
                </Button>
              ))}
            </div>
          </div>

          {/* Help Settings */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {lang === 'de' ? 'Hilfe-Einstellungen' : 'Help Settings'}
            </h4>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {lang === 'de' ? 'Hinweise anzeigen' : 'Show hints'}
                </span>
                <Button
                  variant={showHints ? "default" : "outline"}
                  size="sm"
                  onClick={toggleHints}
                >
                  {showHints ? 'On' : 'Off'}
                </Button>
              </label>
            </div>
          </div>

          {/* Quick Help Topics */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {lang === 'de' ? 'Schnellhilfe' : 'Quick Help'}
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(helpContentDatabase)
                .filter(([_, content]) => content.priority === 'high')
                .slice(0, 3)
                .map(([key, content]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto p-3"
                    onClick={() => {
                      // This would trigger help for that topic
                      console.log('Show help for:', key);
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-shrink-0">
                        {content.category === 'workflow' && <TrendingUp className="h-4 w-4" />}
                        {content.category === 'agent' && <Users className="h-4 w-4" />}
                        {content.category === 'llm' && <Sparkles className="h-4 w-4" />}
                        {content.category === 'general' && <HelpCircle className="h-4 w-4" />}
                        {content.category === 'navigation' && <Target className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {content.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {content.description}
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 flex-shrink-0" />
                    </div>
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContextualHelpProvider;
