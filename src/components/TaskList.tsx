import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User, ChevronDown, ChevronUp, Zap, Workflow, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { t } from "@/lib/i18n/i18n";

interface Task {
  id?: string;
  text: string;
  name?: string;
  score: number;
  label?: 'Automatisierbar' | 'Mensch';
  category?: 'automatisierbar' | 'mensch' | string;
  description?: string;
  complexity?: 'low' | 'medium' | 'high';
  automationTrend?: 'increasing' | 'stable' | 'decreasing';
  humanRatio?: number;
  automationRatio?: number;
}

interface AIAgent {
  name: string;
  technology: string;
  implementation: string;
  difficulty: "Einfach" | "Mittel" | "Schwer";
  setupTime: string;
}

interface TaskListProps {
  tasks: Task[];
  lang?: "de" | "en";
}

const TaskList = ({ tasks, lang = "de" }: TaskListProps) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityText = (complexity?: string) => {
    switch (complexity) {
      case 'low': return 'Niedrige Komplexität';
      case 'medium': return 'Mittlere Komplexität';
      case 'high': return 'Hohe Komplexität';
      default: return 'Unbekannte Komplexität';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4" />;
      case 'stable': return <Minus className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendText = (trend?: string) => {
    switch (trend) {
      case 'increasing': return 'Steigender Trend';
      case 'decreasing': return 'Fallender Trend';
      case 'stable': return 'Stabiler Trend';
      default: return 'Unbekannter Trend';
    }
  };

  const getAIAgentsForTask = (task: Task) => {
    const agents = [];
    const taskText = (task.name || task.text || '').toLowerCase();
    
    if (task.category === 'automatisierbar') {
      // Software Development with AI assistance
      if (taskText.includes('entwicklung') || taskText.includes('programmierung') || taskText.includes('coding') || 
          taskText.includes('react') || taskText.includes('node.js') || taskText.includes('api') || 
          taskText.includes('debugging') || taskText.includes('testing') || taskText.includes('code review')) {
        agents.push({
          name: "AI-Entwicklungs-Assistent",
          technology: "ChatGPT + GitHub Copilot + Claude",
          implementation: "1. Installiere GitHub Copilot in deiner IDE\n2. Erstelle ChatGPT-Prompts für Code-Reviews\n3. Nutze Claude für Debugging-Hilfe\n4. Überprüfe und validiere AI-generierte Lösungen",
          difficulty: "Mittel",
          setupTime: "2-4 Stunden"
        });
      }
      
      // Data Analysis and Processing
      if (taskText.includes('daten') || taskText.includes('data') || taskText.includes('excel') || 
          taskText.includes('auswertung') || taskText.includes('statistik') || taskText.includes('reporting')) {
        agents.push({
          name: "Datenanalyse-Agent",
          technology: "ChatGPT + Claude + Excel AI",
          implementation: "1. Nutze ChatGPT für Datenanalyse-Strategien\n2. Verwende Claude für komplexe Berechnungen\n3. Aktiviere Excel AI für automatische Formeln\n4. Erstelle automatisierte Reports mit AI"
        });
      }
      
      // Documentation and Communication
      if (taskText.includes('dokumentation') || taskText.includes('protokoll') || taskText.includes('kommunikation') ||
          taskText.includes('email') || taskText.includes('bericht')) {
        agents.push({
          name: "Dokumentations-Agent",
          technology: "ChatGPT + Claude + Grammarly",
          implementation: "1. Erstelle Dokumentations-Templates mit ChatGPT\n2. Nutze Claude für technische Dokumentation\n3. Verwende Grammarly für Qualitätskontrolle\n4. Automatisiere regelmäßige Updates"
        });
      }
      
      // System Integration
      if (taskText.includes('integration') || taskText.includes('system') || taskText.includes('crm') || 
          taskText.includes('erp') || taskText.includes('datenbank')) {
        agents.push({
          name: "System-Integrations-Agent",
          technology: "ChatGPT + Zapier + n8n",
          implementation: "1. Nutze ChatGPT für API-Design und Integration\n2. Erstelle Zapier-Workflows für einfache Verbindungen\n3. Verwende n8n für komplexe Automatisierungen\n4. Automatisiere Datenübertragungen"
        });
      }
      
      // Collaboration and Team Work
      if (taskText.includes('zusammenarbeit') || taskText.includes('team') || taskText.includes('agil') ||
          taskText.includes('meeting') || taskText.includes('koordination')) {
        agents.push({
          name: "Team-Kollaborations-Agent",
          technology: "ChatGPT + Slack AI + Microsoft Teams AI",
          implementation: "1. Nutze ChatGPT für Meeting-Vorbereitung und -Nachbereitung\n2. Aktiviere Slack AI für automatische Antworten\n3. Verwende Teams AI für Terminplanung\n4. Überwache und steuere automatische Kommunikation"
        });
      }
      
      // Physical Tasks with Automation Potential
      // Physical tasks - only show for complex industrial processes
      if ((taskText.includes('schneiden') || taskText.includes('packen') || taskText.includes('sortieren') ||
          taskText.includes('bearbeiten') || taskText.includes('verarbeiten') || taskText.includes('kontrollieren') ||
          taskText.includes('transportieren') || taskText.includes('liefern') || taskText.includes('versenden') ||
          taskText.includes('verpacken') || taskText.includes('etikettieren') || taskText.includes('montieren') ||
          taskText.includes('produzieren') || taskText.includes('fertigen') || taskText.includes('reparieren') ||
          taskText.includes('installieren') || taskText.includes('testen')) &&
          (taskText.includes('industriell') || taskText.includes('groß') || taskText.includes('masse') ||
           taskText.includes('industrial') || taskText.includes('large') || taskText.includes('mass'))) {
        agents.push({
          name: "Industrielle Automatisierungs-Agent",
          technology: "Robotics + IoT + Computer Vision",
          implementation: "1. Analysiere Automatisierungspotenzial mit Computer Vision\n2. Implementiere Roboter-gestützte Prozesse\n3. Nutze IoT-Sensoren für Qualitätskontrolle\n4. Überwache und optimiere automatisierte Abläufe",
          difficulty: "Schwer",
          setupTime: "Wochen bis Monate"
        });
      }
      
      // General AI Assistant for any task
      if (agents.length === 0) {
        agents.push({
          name: "Allzweck-AI-Assistent",
          technology: "ChatGPT + Claude + Grok",
          implementation: "1. Erstelle spezifische Prompts für deine Aufgabe\n2. Nutze ChatGPT für allgemeine Unterstützung\n3. Verwende Claude für detaillierte Analysen\n4. Überprüfe und validiere AI-Empfehlungen"
        });
      }
    }
    
    return agents;
  };

  const getWorkflowsForTask = (task: Task) => {
    const workflows = [];
    const taskText = (task.name || task.text || '').toLowerCase();
    
    if (task.category === 'automatisierbar') {
      // Software Development Workflows
      if (taskText.includes('entwicklung') || taskText.includes('programmierung') || taskText.includes('coding') || 
          taskText.includes('react') || taskText.includes('node.js') || taskText.includes('api') || 
          taskText.includes('debugging') || taskText.includes('testing')) {
        workflows.push({
          name: "AI-gestützter Entwicklungs-Workflow",
          technology: "GitHub Actions + ChatGPT API",
          implementation: "1. Erstelle GitHub Actions Workflow\n2. Integriere ChatGPT API für Code-Reviews\n3. Überprüfe AI-generierte Tests vor Deployment\n4. Setze manuelle Freigabe für kritische Änderungen"
        });
      }
      
      // Data Processing Workflows
      if (taskText.includes('daten') || taskText.includes('data') || taskText.includes('excel') || 
          taskText.includes('auswertung') || taskText.includes('statistik') || taskText.includes('reporting')) {
        workflows.push({
          name: "Datenanalyse-Automatisierung",
          technology: "Apache Airflow + ChatGPT API",
          implementation: "1. Installiere Apache Airflow mit Docker\n2. Integriere ChatGPT API für Datenanalyse\n3. Erstelle automatisierte Reporting-Pipeline\n4. Setze tägliche Ausführung"
        });
      }
      
      // Documentation Workflows
      if (taskText.includes('dokumentation') || taskText.includes('protokoll') || taskText.includes('kommunikation') ||
          taskText.includes('email') || taskText.includes('bericht')) {
        workflows.push({
          name: "Dokumentations-Automatisierung",
          technology: "n8n + ChatGPT API",
          implementation: "1. Installiere n8n: npm install n8n\n2. Integriere ChatGPT API für automatische Dokumentation\n3. Erstelle Trigger für neue Dokumente\n4. Automatisiere Qualitätskontrolle"
        });
      }
      
      // System Integration Workflows
      if (taskText.includes('integration') || taskText.includes('system') || taskText.includes('crm') || 
          taskText.includes('erp') || taskText.includes('datenbank')) {
        workflows.push({
          name: "System-Integrations-Pipeline",
          technology: "Zapier + n8n + ChatGPT API",
          implementation: "1. Erstelle Zapier-Konto für einfache Verbindungen\n2. Nutze n8n für komplexe Automatisierungen\n3. Integriere ChatGPT API für intelligente Entscheidungen\n4. Automatisiere Datenübertragungen"
        });
      }
      
      // Collaboration Workflows
      if (taskText.includes('zusammenarbeit') || taskText.includes('team') || taskText.includes('agil') ||
          taskText.includes('meeting') || taskText.includes('koordination')) {
        workflows.push({
          name: "Team-Kollaborations-Automatisierung",
          technology: "Slack + Microsoft Teams + ChatGPT API",
          implementation: "1. Aktiviere Slack/Teams Integrationen\n2. Integriere ChatGPT API für Meeting-Vorbereitung\n3. Überwache automatische Status-Updates\n4. Erstelle intelligente Benachrichtigungen mit manueller Kontrolle"
        });
      }
      
      // General AI-Powered Workflow
      if (workflows.length === 0) {
        workflows.push({
          name: "AI-gestützter Automatisierungs-Workflow",
          technology: "ChatGPT API + Zapier + n8n",
          implementation: "1. Erstelle ChatGPT API-Konto\n2. Nutze Zapier für einfache Automatisierungen\n3. Verwende n8n für komplexe Workflows\n4. Integriere AI für intelligente Entscheidungen"
        });
      }
    }
    
    return workflows;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">
        {t(lang, "analysis_identified_tasks")}
      </h3>
      
      <div className="space-y-3">
        {tasks.map((task, index) => {
          const taskId = task.id || `task-${index}`;
          const isExpanded = expandedTasks.has(taskId);
          const taskName = task.name || task.text;
          const taskCategory = task.label === 'Automatisierbar' ? 'automatisierbar' : 
                              task.label === 'Mensch' ? 'mensch' : 
                              task.category || 'mensch';
          const aiAgents = getAIAgentsForTask({ ...task, category: taskCategory });
          const workflows = getWorkflowsForTask({ ...task, category: taskCategory });
          
          return (
            <Card 
              key={task.id} 
              className="hover:shadow-md transition-shadow duration-200"
              style={{ 
                animation: `fade-in 0.5s ease-out forwards`,
                animationDelay: `${index * 0.1}s`,
                opacity: 0
              }}
            >
              <CardContent className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleTask(taskId)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Icon based on category */}
                    <div className={`p-2 rounded-full ${
                      taskCategory === 'automatisierbar' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {taskCategory === 'automatisierbar' ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    
                    {/* Task info */}
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{taskName}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Complexity badge */}
                    {task.complexity && (
                      <Badge className={`text-xs ${getComplexityColor(task.complexity)}`}>
                        {getComplexityText(task.complexity)}
                      </Badge>
                    )}
                    
                    {/* Trend indicator */}
                    {task.automationTrend && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        {getTrendIcon(task.automationTrend)}
                        <span>{getTrendText(task.automationTrend)}</span>
                      </div>
                    )}
                    
                    {/* Score and Ratios */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">{task.score}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                      {task.humanRatio !== undefined && task.automationRatio !== undefined && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{task.humanRatio}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{task.automationRatio}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Category badge */}
                    <Badge 
                      variant={taskCategory === 'automatisierbar' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {taskCategory}
                    </Badge>
                    
                    {/* Expand/collapse icon */}
                    <div className="ml-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expandable content */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="border-t pt-4 space-y-4">
                    {/* AI Agents Section */}
                    {taskCategory === 'automatisierbar' && aiAgents.length > 0 && (
                      <div>
                        <h5 className="font-medium text-foreground mb-2 flex items-center">
                          <Zap className="w-4 h-4 mr-2 text-primary" />
                          Empfohlene AI-Agents
                        </h5>
                        <div className="space-y-2">
                                                     {aiAgents.map((agent, idx) => (
                             <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                               <div className="font-medium text-sm mb-2">{agent.name}</div>
                               <div className="text-xs text-muted-foreground mb-2">
                                 <strong>Technologie:</strong> {agent.technology}
                               </div>
                               <div className="text-xs text-muted-foreground mb-2">
                                 <strong>Schwierigkeit:</strong> {agent.difficulty || "Mittel"} • <strong>Setup-Zeit:</strong> {agent.setupTime || "2-4 Stunden"}
                               </div>
                               <div className="text-xs text-muted-foreground">
                                 <strong>Schritte zur Umsetzung:</strong>
                                 <ol className="mt-1 ml-4 space-y-1 list-decimal">
                                   {agent.implementation.split('\n').map((step, stepIdx) => (
                                     <li key={stepIdx} className="pl-1">
                                       {step}
                                     </li>
                                   ))}
                                 </ol>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Workflows Section */}
                    {taskCategory === 'automatisierbar' && workflows.length > 0 && (
                      <div>
                        <h5 className="font-medium text-foreground mb-2 flex items-center">
                          <Workflow className="w-4 h-4 mr-2 text-primary" />
                          Empfohlene Workflows
                        </h5>
                        <div className="space-y-2">
                                                     {workflows.map((workflow, idx) => (
                             <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                               <div className="font-medium text-sm mb-2">{workflow.name}</div>
                               <div className="text-xs text-muted-foreground mb-2">
                                 <strong>Technologie:</strong> {workflow.technology}
                               </div>
                               <div className="text-xs text-muted-foreground">
                                 <strong>Schritte zur Umsetzung:</strong>
                                 <ol className="mt-1 ml-4 space-y-1 list-decimal">
                                   {workflow.implementation.split('\n').map((step, stepIdx) => (
                                     <li key={stepIdx} className="pl-1">
                                       {step}
                                     </li>
                                   ))}
                                 </ol>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Task Ratio Breakdown */}
                    {task.humanRatio !== undefined && task.automationRatio !== undefined && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">{t(lang, "analysis_task_distribution")}</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{t(lang, "analysis_human_work")}:</span>
                            <span className="text-sm font-medium text-blue-600">{task.humanRatio}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{t(lang, "analysis_automation")}:</span>
                            <span className="text-sm font-medium text-green-600">{task.automationRatio}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${task.automationRatio}%`,
                                background: `linear-gradient(to right, #3b82f6 ${task.humanRatio}%, #10b981 ${task.humanRatio}%)`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Human tasks info */}
                    {taskCategory === 'mensch' && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-1">{t(lang, "analysis_human_expertise_required")}</h5>
                        <p className="text-sm text-blue-700">
                          {t(lang, "analysis_human_expertise_desc")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TaskList;