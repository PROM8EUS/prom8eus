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
      if (taskText.includes('daten') || taskText.includes('data') || taskText.includes('excel') || taskText.includes('tabelle')) {
        agents.push({
          name: t(lang, "agent_excel_name"),
          technology: t(lang, "agent_excel_tech"),
          implementation: `${t(lang, "agent_excel_step1")}\n${t(lang, "agent_excel_step2")}\n${t(lang, "agent_excel_step3")}\n${t(lang, "agent_excel_step4")}`
        });
      }
      if (taskText.includes('email') || taskText.includes('mail') || taskText.includes('kommunikation')) {
        agents.push({
          name: t(lang, "agent_email_name"),
          technology: t(lang, "agent_email_tech"),
          implementation: `${t(lang, "agent_email_step1")}\n${t(lang, "agent_email_step2")}\n${t(lang, "agent_email_step3")}\n${t(lang, "agent_email_step4")}`
        });
      }
      if (taskText.includes('report') || taskText.includes('bericht') || taskText.includes('auswertung')) {
        agents.push({
          name: t(lang, "agent_report_name"),
          technology: t(lang, "agent_report_tech"),
          implementation: `${t(lang, "agent_report_step1")}\n${t(lang, "agent_report_step2")}\n${t(lang, "agent_report_step3")}\n${t(lang, "agent_report_step4")}`
        });
      }
      if (taskText.includes('buchhaltung') || taskText.includes('rechnung') || taskText.includes('finanz')) {
        agents.push({
          name: t(lang, "agent_accounting_name"),
          technology: t(lang, "agent_accounting_tech"),
          implementation: `${t(lang, "agent_accounting_step1")}\n${t(lang, "agent_accounting_step2")}\n${t(lang, "agent_accounting_step3")}\n${t(lang, "agent_accounting_step4")}`
        });
      }
      if (taskText.includes('system') || taskText.includes('crm') || taskText.includes('erp')) {
        agents.push({
          name: t(lang, "agent_system_name"),
          technology: t(lang, "agent_system_tech"),
          implementation: `${t(lang, "agent_system_step1")}\n${t(lang, "agent_system_step2")}\n${t(lang, "agent_system_step3")}\n${t(lang, "agent_system_step4")}`
        });
      }
      if (taskText.includes('termin') || taskText.includes('kalender') || taskText.includes('planung')) {
        agents.push({
          name: t(lang, "agent_calendar_name"),
          technology: t(lang, "agent_calendar_tech"),
          implementation: `${t(lang, "agent_calendar_step1")}\n${t(lang, "agent_calendar_step2")}\n${t(lang, "agent_calendar_step3")}\n${t(lang, "agent_calendar_step4")}`
        });
      }
    }
    
    // Default agent if none specific
    if (agents.length === 0 && task.category === 'automatisierbar') {
      agents.push({
        name: t(lang, "agent_general_name"),
        technology: t(lang, "agent_general_tech"),
        implementation: `${t(lang, "agent_general_step1")}\n${t(lang, "agent_general_step2")}\n${t(lang, "agent_general_step3")}\n${t(lang, "agent_general_step4")}`
      });
    }
    
    return agents;
  };

  const getWorkflowsForTask = (task: Task) => {
    const workflows = [];
    const taskText = (task.name || task.text || '').toLowerCase();
    
    if (task.category === 'automatisierbar') {
      if (taskText.includes('daten') || taskText.includes('data') || taskText.includes('excel') || taskText.includes('tabelle')) {
        workflows.push({
          name: "Datenverarbeitungs-Pipeline",
          technology: "Apache Airflow (kostenlos)",
          implementation: "Installiere Docker Desktop\nFühre aus: docker run apache/airflow\nErstelle DAG für Datenverarbeitung\nKonfiguriere tägliche Ausführung"
        });
      }
      if (taskText.includes('email') || taskText.includes('mail') || taskText.includes('kommunikation')) {
        workflows.push({
          name: "Email-Management-Workflow",
          technology: "n8n (kostenlos, self-hosted)",
          implementation: "Lade n8n herunter: npm install n8n\nStarte n8n: npx n8n\nErstelle Email-Trigger und Aktionen\nAktiviere Workflow"
        });
      }
      if (taskText.includes('report') || taskText.includes('bericht') || taskText.includes('auswertung')) {
        workflows.push({
          name: "Berichtsautomatisierung",
          technology: "Power Automate + SharePoint",
          implementation: "Erstelle Power Automate-Konto\nVerbinde SharePoint als Datenquelle\nErstelle Workflow für Berichtserstellung\nSetze Zeitplan für automatische Ausführung"
        });
      }
      if (taskText.includes('buchhaltung') || taskText.includes('rechnung') || taskText.includes('finanz')) {
        workflows.push({
          name: "Buchhaltungs-Workflow",
          technology: "Datev + Power Automate",
          implementation: "Aktiviere Datev-API in Ihrem System\nErstelle Power Automate Workflow\nKonfiguriere automatische Belegverarbeitung\nSetze Regeln für Kontierung und Buchung"
        });
      }
      if (taskText.includes('system') || taskText.includes('crm') || taskText.includes('erp')) {
        workflows.push({
          name: "System-Integrations-Workflow",
          technology: "Microsoft Power Automate",
          implementation: "Erstelle Power Automate-Konto\nVerbinde Quell- und Zielsysteme über Connectors\nErstelle Workflow für Datenübertragung\nTeste und aktiviere automatische Ausführung"
        });
      }
      if (taskText.includes('termin') || taskText.includes('kalender') || taskText.includes('planung')) {
        workflows.push({
          name: "Terminplanungs-Workflow",
          technology: "Zapier + Google Calendar",
          implementation: "Erstelle kostenloses Zapier-Konto\nVerbinde Google Calendar\nErstelle Workflow für automatische Terminplanung\nKonfiguriere Verfügbarkeitszeiten und Regeln"
        });
      }
    }
    
    // Default workflow if none specific
    if (workflows.length === 0 && task.category === 'automatisierbar') {
      workflows.push({
        name: "Standard-Automatisierungs-Workflow",
        technology: "Zapier (kostenlos bis 100 Tasks/Monat)",
                  implementation: "Erstelle kostenloses Zapier-Konto\nWähle Trigger-App (z.B. Gmail, Google Sheets)\nWähle Action-App (z.B. Slack, Trello)\nTeste und aktiviere Workflow"
      });
    }
    
    return workflows;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">
        Identifizierte Aufgaben
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
                    
                    {/* Score */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">{task.score}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
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
                    
                    {/* Human tasks info */}
                    {taskCategory === 'mensch' && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-1">Menschliche Expertise erforderlich</h5>
                        <p className="text-sm text-blue-700">
                          Diese Aufgabe erfordert menschliche Fähigkeiten wie Kreativität, 
                          emotionale Intelligenz oder komplexe Entscheidungsfindung.
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