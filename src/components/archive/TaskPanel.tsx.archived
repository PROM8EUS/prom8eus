/**
 * TaskPanel Component - Refactored for expanded task detail view
 * Now focuses on layout coordination and main content display
 * SubtaskSidebar functionality extracted to separate component
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2,
  ChevronRight,
  Users,
  Clock,
  Target,
  TrendingUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { EffortSection } from './EffortSection';
import { InsightsTrendsSection } from './InsightsTrendsSection';
import { ImplementationRequestCTA } from './ImplementationRequestCTA';
import SubtaskSidebar from './SubtaskSidebar';
import { ExpandedSolutionTabs } from './ExpandedSolutionTabs';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { SmartDefaultsProvider, useSmartDefaults } from './SmartDefaultsManager';
import { ContextualHelpProvider, useContextualHelp } from './ContextualHelpSystem';
import { HelpTrigger, SectionHelp } from './HelpTrigger';
import { analyzeTrends } from '@/lib/trendAnalysis';
import { matchWorkflowsToSubtasks } from '@/lib/workflowMatcher';
import { DynamicSubtask, UnifiedWorkflow, WorkflowCreationContext } from '@/lib/types';
import { generateSubtasksWithAI } from '@/lib/aiAnalysis';
import { isOpenAIAvailable } from '@/lib/openai';
import { generateWorkflowFast, generateUnifiedWorkflow, generateMultipleUnifiedWorkflows } from '@/lib/workflowGenerator';
import { unifiedWorkflowIndexer } from '@/lib/workflowIndexerUnified';

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

// Fallback subtask generation when AI fails
function generateFallbackSubtasks(taskText: string, lang: 'de' | 'en'): any[] {
  console.log('🔄 [TaskPanel] Generating fallback subtasks for:', taskText);
  
  const baseSubtasks = [
    {
      id: 'task-1',
      title: lang === 'de' ? 'Datenanalyse und -aufbereitung' : 'Data Analysis and Preparation',
      systems: ['Database', 'Analytics Tools'],
      aiTools: ['Data Processing', 'ETL Tools'],
      selectedTools: [],
      manualHoursShare: 0.3,
      automationPotential: 0.7,
      risks: [lang === 'de' ? 'Datenqualität' : 'Data Quality'],
      assumptions: [],
      kpis: [],
      qualityGates: []
    },
    {
      id: 'task-2',
      title: lang === 'de' ? 'Implementierung und Testing' : 'Implementation and Testing',
      systems: ['Development Environment', 'Testing Tools'],
      aiTools: ['Code Generation', 'Test Automation'],
      selectedTools: [],
      manualHoursShare: 0.4,
      automationPotential: 0.6,
      risks: [lang === 'de' ? 'Technische Komplexität' : 'Technical Complexity'],
      assumptions: [],
      kpis: [],
      qualityGates: []
    },
    {
      id: 'task-3',
      title: lang === 'de' ? 'Dokumentation und Deployment' : 'Documentation and Deployment',
      systems: ['Documentation System', 'Deployment Pipeline'],
      aiTools: ['Documentation Generator', 'CI/CD Tools'],
      selectedTools: [],
      manualHoursShare: 0.2,
      automationPotential: 0.8,
      risks: [lang === 'de' ? 'Wartbarkeit' : 'Maintainability'],
      assumptions: [],
      kpis: [],
      qualityGates: []
    }
  ];
  
  return baseSubtasks;
}

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
  onWorkflowsGenerated?: (workflows: any[]) => void; // NEW: Callback for generated workflows
  isVisible?: boolean;
};

function TaskPanelContent({ task, lang = 'de', isVisible = false, onWorkflowsGenerated }: TaskPanelProps) {
  const { getSectionDefaults, setExpanded } = useSmartDefaults();
  const { trackUserAction } = useContextualHelp();
  const [generatedSubtasks, setGeneratedSubtasks] = useState<Subtask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>('all');
  const [solutionsCount, setSolutionsCount] = useState(0);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const hasLoadedSolutions = useRef(false);

  // Generate subtasks when task becomes visible - OPTIMIZED FOR IMMEDIATE LOADING
  useEffect(() => {
    if (task) {
      const taskText = task.title || task.name || task.description || '';
      // Generate subtasks if we don't have any yet (either from task or generated)
      // This ensures all tasks have subtasks, even if the analysis didn't generate them
      if (taskText && !isGenerating && generatedSubtasks.length === 0 && (!task.subtasks || task.subtasks.length === 0)) {
        console.log('🔄 [TaskPanel] Generating subtasks for:', taskText);
        setIsGenerating(true);
        
        // DEBOUNCE: Only generate if not already generating for this task
        const taskId = taskText;
        if ((window as any).subtaskGenerationInProgress?.has(taskId)) {
          console.log('⏳ [TaskPanel] Subtask generation already in progress for:', taskText);
          setIsGenerating(false);
          return;
        }
        
        // Mark as in progress
        if (!(window as any).subtaskGenerationInProgress) {
          (window as any).subtaskGenerationInProgress = new Set();
        }
        (window as any).subtaskGenerationInProgress.add(taskId);
        
        // Start generation immediately without waiting
        const generateSubtasks = async () => {
          try {
            // 0) Try cache per analysis first - IMMEDIATE LOADING
            const cached = await getCachedSubtasksForText(taskText);
            if (cached && cached.length > 0) {
              console.log('✅ [TaskPanel] Using cached subtasks:', cached.length);
              setGeneratedSubtasks(cached);
              (window as any).subtaskGenerationInProgress.delete(taskId);
              setIsGenerating(false);
              return;
            }
            
            // If no cache, show loading state immediately
            console.log('⏳ [TaskPanel] No cache found, generating new subtasks...');
            
            // 1) Try AI-powered generation first if available - WITH TIMEOUT
            if (isOpenAIAvailable()) {
              console.log('🤖 [TaskPanel] Using AI for subtask generation...');
              
              try {
                // Set a timeout for AI generation to prevent hanging
                const aiGenerationPromise = generateSubtasksWithAI(taskText, lang);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('AI generation timeout')), 30000)
                );
                
                const aiResult = await Promise.race([aiGenerationPromise, timeoutPromise]) as any;
                
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
                  (window as any).subtaskGenerationInProgress.delete(taskId);
                  setIsGenerating(false);
                  return;
                }
              } catch (aiError) {
                console.error('❌ [TaskPanel] AI generation failed:', aiError);
                console.error('❌ [TaskPanel] AI error details:', {
                  message: aiError.message,
                  stack: aiError.stack,
                  name: aiError.name
                });
                // Continue to fallback generation
              }
            }
            
            // Fallback: Generate basic subtasks if AI fails
            console.log('⚠️ [TaskPanel] AI generation failed, using fallback generation');
            const fallbackSubtasks = generateFallbackSubtasks(taskText, lang);
            setGeneratedSubtasks(fallbackSubtasks);
            await setCachedSubtasksForText(taskText, fallbackSubtasks);
            (window as any).subtaskGenerationInProgress.delete(taskId);
            setIsGenerating(false);
          } catch (error) {
            console.error('❌ [TaskPanel] Error generating subtasks:', error);
            (window as any).subtaskGenerationInProgress.delete(taskId);
            setGeneratedSubtasks([]);
            setIsGenerating(false);
          }
        };
        
        generateSubtasks();
      }
    }
  }, [task, task?.subtasks?.length, lang, isGenerating, generatedSubtasks.length]);
  
  // Use real subtasks from task prop or generated subtasks
  const realSubtasks = useMemo(() => {
    console.log('🔍 [TaskPanel] Debug subtasks check:', {
      hasTask: !!task,
      hasSubtasks: !!(task?.subtasks),
      subtasksLength: task?.subtasks?.length || 0,
      subtasksData: task?.subtasks
    });
    
    if (task?.subtasks && task.subtasks.length > 0) {
      console.log('✅ [TaskPanel] Using real subtasks from task prop (IMMEDIATE):', task.subtasks.length);
      const mapped = task.subtasks.map(subtask => ({
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
      // Sort by highest savings (manualHoursShare * automationPotential)
      return mapped.sort((a, b) => (b.manualHoursShare * b.automationPotential) - (a.manualHoursShare * a.automationPotential));
    } else if (generatedSubtasks.length > 0) {
      console.log('✅ [TaskPanel] Using generated subtasks:', generatedSubtasks.length);
      // Sort generated by highest savings
      return [...generatedSubtasks].sort((a, b) => (b.manualHoursShare * b.automationPotential) - (a.manualHoursShare * a.automationPotential));
    } else {
      console.log('⏳ [TaskPanel] Subtasks are being generated, showing loading state');
      
      // Return optimistic loading subtasks to show immediate feedback
      if (isGenerating) {
        return [
          {
            id: 'loading-1',
            title: 'Lade Teilaufgaben...',
            systems: [],
            aiTools: [],
            selectedTools: [],
            manualHoursShare: 0.5,
            automationPotential: 0.5,
            risks: [],
            assumptions: [],
            kpis: [],
            qualityGates: []
          }
        ];
      }
      
      // Return empty array if not generating - this will trigger subtask generation
      return [];
    }
  }, [task?.subtasks?.length, generatedSubtasks, isGenerating]);

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
    month: 40, // Realistische monatliche Arbeitszeit für eine spezifische Aufgabe
    week: 10, // Realistische wöchentliche Arbeitszeit für eine spezifische Aufgabe
    day: 2, // Realistische tägliche Arbeitszeit für eine spezifische Aufgabe
  };

  // Calculate business case based on AI-generated monthly values
  let manualHoursTotal = 0;
  let residualHoursTotal = 0;
  
  // Calculate business case based on subtasks
  const basePerTaskHours = 2; // Realistic baseline per subtask per month
  const scale = HOURS_PER_PERIOD[period] / HOURS_PER_PERIOD['month'];
  
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
  const [workflows, setWorkflows] = useState<UnifiedWorkflow[]>([]);
  const [allWorkflows, setAllWorkflows] = useState<UnifiedWorkflow[]>([]); // Store all generated workflows
  const [workflowsToShow, setWorkflowsToShow] = useState(3); // Number of workflows to show
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false); // Initial generation state
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  // Memoize workflows to prevent unnecessary re-renders
  const memoizedWorkflows = useMemo(() => {
    return workflows;
  }, [workflows.length, workflows.map(w => w.id).join(',')]);
  const [trendInsights, setTrendInsights] = useState<any[]>([]);

  useEffect(() => {
    if (isVisible && dynamicSubtasks.length > 0) {
      // Reset workflows when task changes
      setAllWorkflows([]);
      setWorkflows([]);
      setWorkflowsToShow(3);
      
      // Generate initial workflows (3 workflows) - ÜBERGREIFENDE WORKFLOWS für Hauptaufgabe
      const generateInitialWorkflows = async () => {
        try {
          setIsGeneratingInitial(true);
          console.log('🔄 [TaskPanel] Generating initial 3 ÜBERGREIFENDE workflows for main task...');
          
          const generatedWorkflows = [];
          const maxInitialWorkflows = 3;
          
          // Generate ÜBERGREIFENDE workflows for the main task (not subtasks!)
          const mainTask: DynamicSubtask = {
            id: 'main-task',
            title: task.title || task.name || 'Hauptaufgabe',
            description: task.description || '',
            automationPotential: 0.8,
            estimatedTime: 8,
            priority: 'high',
            complexity: 'medium',
            systems: ['HR-System', 'Workflow-Engine'],
            dependencies: [],
            risks: [],
            opportunities: ['Effizienzsteigerung', 'Prozessoptimierung'],
            aiTools: ['Workflow-Generator', 'Prozess-Analyzer']
          };
          
          // Generate initial workflows using new UnifiedWorkflow function
          const context: WorkflowCreationContext = {
            subtaskId: mainTask.id,
            language: lang,
            timeout: 5000,
            context: 'overarching'
          };
          
          const unifiedWorkflows = await generateMultipleUnifiedWorkflows(mainTask, maxInitialWorkflows, context);
          
          for (const workflow of unifiedWorkflows) {
            generatedWorkflows.push(workflow);
            console.log(`✅ [TaskPanel] Generated overarching workflow: "${workflow.title}"`);
          }
          
          console.log('✅ [TaskPanel] Generated initial workflows:', generatedWorkflows.length);
          setAllWorkflows(generatedWorkflows);
          setWorkflows(generatedWorkflows.slice(0, workflowsToShow));
          setTrendInsights([]);
          setIsGeneratingInitial(false);
          
          // Pass generated workflows to parent component
          if (onWorkflowsGenerated) {
            onWorkflowsGenerated(generatedWorkflows.slice(0, workflowsToShow));
          }
        } catch (error) {
          console.error('❌ [TaskPanel] Error generating initial workflows:', error);
          setWorkflows([]);
          setAllWorkflows([]);
          setTrendInsights([]);
          setIsGeneratingInitial(false);
        }
      };
      generateInitialWorkflows();
    }
  }, [isVisible, dynamicSubtasks, task, lang]);

  // Generate more workflows
  const generateMoreWorkflows = async () => {
    if (isGeneratingMore) return;
    
    setIsGeneratingMore(true);
    try {
      console.log('🔄 [TaskPanel] Generating more workflows...');
      
      const newWorkflows = [];
      const additionalWorkflows = 3; // Generate 3 more workflows
      let workflowCount = 0;
      
      // If a specific subtask is selected, generate more workflows for that subtask
      if (selectedSubtaskId !== 'all') {
        const selectedSubtask = dynamicSubtasks.find(s => s.id === selectedSubtaskId);
        if (selectedSubtask) {
          // Generate more workflows for selected subtask using UnifiedWorkflow
          const context: WorkflowCreationContext = {
            subtaskId: selectedSubtask.id,
            language: lang,
            timeout: 5000,
            context: 'subtask-specific',
            variation: allWorkflows.length
          };
          
          const unifiedWorkflows = await generateMultipleUnifiedWorkflows(selectedSubtask, additionalWorkflows, context);
          
          for (const workflow of unifiedWorkflows) {
            newWorkflows.push(workflow);
            console.log(`✅ [TaskPanel] Generated subtask-specific workflow: "${workflow.title}"`);
          }
        }
      } else {
        // Generate MORE übergreifende workflows for the main task (for "all" view)
        const mainTask: DynamicSubtask = {
          id: 'main-task',
          title: task.title || task.name || 'Hauptaufgabe',
          description: task.description || '',
          automationPotential: 0.8,
          estimatedTime: 8,
          priority: 'high',
          complexity: 'medium',
          systems: ['HR-System', 'Workflow-Engine'],
          dependencies: [],
          risks: [],
          opportunities: ['Effizienzsteigerung', 'Prozessoptimierung'],
          aiTools: ['Workflow-Generator', 'Prozess-Analyzer']
        };
        
        // Generate more overarching workflows using UnifiedWorkflow
        const context: WorkflowCreationContext = {
          subtaskId: mainTask.id,
          language: lang,
          timeout: 5000,
          context: 'overarching',
          variation: allWorkflows.length
        };
        
        const unifiedWorkflows = await generateMultipleUnifiedWorkflows(mainTask, additionalWorkflows, context);
        
        for (const workflow of unifiedWorkflows) {
          newWorkflows.push(workflow);
          workflowCount++;
          console.log(`✅ [TaskPanel] Generated additional overarching workflow ${workflowCount}: "${workflow.title}"`);
        }
      }
      
      // Deduplicate workflows by ID before updating state
      const existingIds = new Set(allWorkflows.map(w => w.id));
      const uniqueNewWorkflows = newWorkflows.filter(w => !existingIds.has(w.id));
      
      if (uniqueNewWorkflows.length !== newWorkflows.length) {
        console.log(`🧹 [TaskPanel] Removed ${newWorkflows.length - uniqueNewWorkflows.length} duplicate workflows`);
      }
      
      // Add new workflows to existing ones
      const updatedAllWorkflows = [...allWorkflows, ...uniqueNewWorkflows];
      const updatedWorkflowsToShow = workflowsToShow + uniqueNewWorkflows.length;
      
      setAllWorkflows(updatedAllWorkflows);
      setWorkflows(updatedAllWorkflows.slice(0, updatedWorkflowsToShow));
      setWorkflowsToShow(updatedWorkflowsToShow);
      
      // Pass updated workflows to parent component
      if (onWorkflowsGenerated) {
        onWorkflowsGenerated(updatedAllWorkflows.slice(0, updatedWorkflowsToShow));
      }
      
      console.log('✅ [TaskPanel] Generated additional workflows:', newWorkflows.length);
    } catch (error) {
      console.error('❌ [TaskPanel] Error generating more workflows:', error);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  // Handle subtask selection
  const handleSubtaskSelect = async (subtaskId: string) => {
    setSelectedSubtaskId(subtaskId);
    console.log('🔍 [TaskPanel] Selected subtask:', subtaskId);
    
    // If selecting a specific subtask (not "all"), generate workflows for that subtask
    if (subtaskId !== 'all') {
      const selectedSubtask = dynamicSubtasks.find(s => s.id === subtaskId);
      if (selectedSubtask) {
        console.log('🔄 [TaskPanel] Generating workflows for specific subtask:', selectedSubtask.title);
        await generateWorkflowsForSubtask(selectedSubtask);
      }
    }
  };

  // Generate workflows for a specific subtask
  const generateWorkflowsForSubtask = async (subtask: any) => {
    try {
      setIsGeneratingInitial(true);
      console.log('🔄 [TaskPanel] Generating workflows for subtask:', subtask.title);
      
      const generatedWorkflows = [];
      const workflowsPerSubtask = 3; // Generate 3 workflows for this specific subtask
      
      // Generate workflows for specific subtask using UnifiedWorkflow
      const context: WorkflowCreationContext = {
        subtaskId: subtask.id,
        language: lang,
        timeout: 5000,
        context: 'subtask-specific'
      };
      
      const unifiedWorkflows = await generateMultipleUnifiedWorkflows(subtask, workflowsPerSubtask, context);
      
      for (const workflow of unifiedWorkflows) {
        generatedWorkflows.push(workflow);
        console.log(`✅ [TaskPanel] Generated workflow for "${subtask.title}": "${workflow.title}"`);
      }
      
      console.log('✅ [TaskPanel] Generated workflows for subtask:', generatedWorkflows.length);
      setAllWorkflows(generatedWorkflows);
      setWorkflows(generatedWorkflows);
      setWorkflowsToShow(generatedWorkflows.length);
      setIsGeneratingInitial(false);
      
      // Pass generated workflows to parent component
      if (onWorkflowsGenerated) {
        onWorkflowsGenerated(generatedWorkflows);
      }
    } catch (error) {
      console.error('❌ [TaskPanel] Error generating workflows for subtask:', error);
      setWorkflows([]);
      setAllWorkflows([]);
      setIsGeneratingInitial(false);
    }
  };


  // Get selected subtask for display
  const selectedSubtask = useMemo(() => {
    console.log('🔍 [TaskPanel] selectedSubtaskId:', selectedSubtaskId);
    console.log('🔍 [TaskPanel] dynamicSubtasks:', dynamicSubtasks);
    console.log('🔍 [TaskPanel] dynamicSubtasks.length:', dynamicSubtasks.length);
    console.log('🔍 [TaskPanel] dynamicSubtasks IDs:', dynamicSubtasks.map(s => s.id));
    
    if (selectedSubtaskId === 'all') {
      console.log('🔍 [TaskPanel] Returning null for "all"');
      return null; // Show all solutions
    }
    
    const found = dynamicSubtasks.find(s => s.id === selectedSubtaskId);
    console.log('🔍 [TaskPanel] Found subtask:', found);
    return found || null;
  }, [selectedSubtaskId, dynamicSubtasks]);

  // Memoize task object to prevent unnecessary re-renders
  const businessCaseTask = useMemo(() => ({
    name: task.name || task.title,
    text: task.description,
    automationRatio: realSubtasks.reduce((acc, s) => acc + s.automationPotential, 0) / Math.max(realSubtasks.length, 1) * 100,
    humanRatio: realSubtasks.reduce((acc, s) => acc + (1 - s.automationPotential), 0) / Math.max(realSubtasks.length, 1) * 100,
    subtasks: realSubtasks.map(s => ({
      id: s.id,
      title: s.title,
      estimatedTime: s.manualHoursShare * 2, // Realistic baseline per subtask per month
      automationPotential: s.automationPotential
    }))
  }), [task.name, task.title, task.description, realSubtasks]);

  if (!isVisible) return null;

  return (
    <div className="min-h-screen relative z-0">
      {/* Simplified Layout without Grid */}
      <div className="max-w-7xl mx-auto space-y-6 relative z-0">
        
        {/* Effort/ROI Section - Direct Display without Container */}
        <EffortSection
          manualHours={manualHoursTotal}
          automatedHours={residualHoursTotal}
          hourlyRate={60}
          period={period}
          lang={lang}
          showROIBlock={false}
          onHourlyRateChange={(newRate) => {
            console.log('Hourly rate changed:', newRate);
          }}
        />

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Sidebar - Subtask Navigation */}
          <div className="lg:w-1/3 w-full">
            <SubtaskSidebar
              task={task}
              lang={lang}
              isVisible={isVisible}
              onSubtaskSelect={handleSubtaskSelect}
              selectedSubtaskId={selectedSubtaskId}
              aiGeneratedSubtasks={generatedSubtasks}
            />
          </div>

          {/* Main Content Area - Solution Tabs */}
          <div className="lg:w-2/3 w-full space-y-6">
            {/* Direct Solution Tabs Display - No Container */}
            <ExpandedSolutionTabs
              subtask={selectedSubtask}
              lang={lang}
              generatedWorkflows={memoizedWorkflows}
              isGeneratingInitial={isGeneratingInitial}
              onLoadMore={generateMoreWorkflows}
              isLoadingMore={isGeneratingMore}
              onWorkflowSelect={(workflow: UnifiedWorkflow) => {
                console.log('🔍 [TaskPanel] Workflow selected:', workflow.title);
              }}
              onWorkflowDownload={(workflow: UnifiedWorkflow) => {
                console.log('📥 [TaskPanel] Download requested:', workflow.title);
              }}
              onWorkflowSetup={(workflow: UnifiedWorkflow) => {
                console.log('⚙️ [TaskPanel] Setup requested:', workflow.title);
              }}
              onAgentSelect={(agent: any) => {
                console.log('🔍 [TaskPanel] Agent selected:', agent?.name);
              }}
              onAgentSetup={(agent: any) => {
                console.log('⚙️ [TaskPanel] Agent setup requested:', agent?.name);
              }}
              onPromptSelect={(prompt: any) => {
                console.log('🔍 [TaskPanel] Prompt selected:', prompt?.id);
              }}
              onPromptCopy={(prompt: any) => {
                console.log('📋 [TaskPanel] Prompt copied:', prompt?.id);
              }}
              onPromptOpenInService={(prompt: any, service: string) => {
                console.log('🔗 [TaskPanel] Open in service:', service, prompt?.id);
              }}
              className="bg-transparent border-0 shadow-none"
            />


            {/* Insights & Trends Section with Progressive Disclosure */}
            {trendInsights.length > 0 && (
              <CollapsibleSection
                title={lang === 'de' ? 'Erkenntnisse & Trends' : 'Insights & Trends'}
                description={lang === 'de' 
                  ? 'Automatisierungs-Trends und Marktanalysen'
                  : 'Automation trends and market analysis'
                }
                priority="low"
                badge={{
                  text: lang === 'de' ? 'Erkenntnisse' : 'Insights',
                  count: trendInsights.length
                }}
                icon={Target}
                {...getSectionDefaults('insights', 'low')}
                onToggle={(expanded) => setExpanded('insights', expanded)}
                className=""
              >
                <InsightsTrendsSection
                  insights={trendInsights}
                  lang={lang}
                />
              </CollapsibleSection>
            )}
          </div>
        </div>

        {/* Bottom Section - Full Width CTA */}
        <div>
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <div className="w-full">
              <ImplementationRequestCTA
                taskTitle={task.title || task.name}
                taskDescription={task.description}
                subtasks={dynamicSubtasks}
                automationScore={Math.round(businessCaseTask.automationRatio)}
                estimatedSavings={{
                  hours: manualHoursTotal - residualHoursTotal,
                  cost: (manualHoursTotal - residualHoursTotal) * 60, // Default hourly rate
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
        </div>
      </div>
    </div>
  );
}

// Main TaskPanel component with SmartDefaultsProvider and ContextualHelpProvider
export default function TaskPanel(props: TaskPanelProps) {
  return (
    <SmartDefaultsProvider>
      <ContextualHelpProvider>
        <TaskPanelContent {...props} />
      </ContextualHelpProvider>
    </SmartDefaultsProvider>
  );
}