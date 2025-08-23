import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Zap, 
  Workflow, 
  DollarSign,
  Clock,
  TrendingUp,
  Euro,
  Bot
} from 'lucide-react';
import { FastAnalysisEngine } from '../lib/patternEngine/fastAnalysisEngine';
import { TaskSpecificWorkflows } from './TaskSpecificWorkflows';



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
  
  // Initialize FastAnalysisEngine
  const fastAnalysisEngine = useMemo(() => new FastAnalysisEngine(), []);
  
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
                      <div className="font-medium text-sm text-gray-900 mb-1">{subtask.title}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {subtask.systems?.slice(0, 2).map((system) => (
                            <Badge key={system} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                              {system}
                            </Badge>
                          ))}
                          {subtask.systems && subtask.systems.length > 2 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                              +{subtask.systems.length - 2}
                            </Badge>
                          )}
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
            <div className="space-y-6">
              {/* Task-Specific Workflows */}
              <TaskSpecificWorkflows
                taskText={task.title || task.name || ''}
                lang={lang}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskPanel;
