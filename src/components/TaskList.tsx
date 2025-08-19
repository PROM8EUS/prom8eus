import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, User, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight, Zap, Brain, Cog, Database, FileText, MessageSquare, BarChart3 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  name: string;
  score: number;
  category: 'automatisierbar' | 'mensch';
  description?: string;
  complexity?: 'low' | 'medium' | 'high';
  automationTrend?: 'increasing' | 'stable' | 'decreasing';
}

interface TaskListProps {
  tasks: Task[];
}

const TaskList = ({ tasks }: TaskListProps) => {
  const [openTasks, setOpenTasks] = useState<Set<string>>(new Set());
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set());
  const contentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Get language from URL or default to German
  const getLang = (): "de" | "en" => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const langParam = searchParams.get('lang');
      return langParam === "en" ? "en" : "de";
    }
    return "de";
  };
  
  const lang = getLang();
  
  // Simple translation function
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      de: {
        recommended_ai_agents: "Empfohlene AI-Agents",
        recommended_workflows: "Empfohlene Workflows",
        human_task_message: "Diese Aufgabe erfordert menschliche Fähigkeiten und kann nicht vollständig automatisiert werden.",
        human_task_subtitle: "Fokus auf menschliche Stärken und unterstützende Automatisierung.",
        automation_level: "Level",
        time: "Zeit",
        confidence: "Zuverlässigkeit"
      },
      en: {
        recommended_ai_agents: "Recommended AI Agents",
        recommended_workflows: "Recommended Workflows",
        human_task_message: "This task requires human skills and cannot be fully automated.",
        human_task_subtitle: "Focus on human strengths and supportive automation.",
        automation_level: "Level",
        time: "Time",
        confidence: "Confidence"
      }
    };
    return translations[lang]?.[key] || key;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'decreasing': return <TrendingDown className="w-3 h-3 text-red-600" />;
      case 'stable': return <Minus className="w-3 h-3 text-gray-600" />;
      default: return null;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'Steigend';
      case 'decreasing': return 'Fallend';
      case 'stable': return 'Stabil';
      default: return '';
    }
  };

  const getAIAgentsForTask = (task: Task) => {
    const lowerTask = task.name.toLowerCase();
    const agents = [];

    // AI/ML Agents
    if (lowerTask.includes('ai') || lowerTask.includes('machine learning') || lowerTask.includes('automatisier')) {
      agents.push({
        name: 'OpenAI GPT-4 Agent',
        description: 'KI-gestützte Entscheidungsfindung und Textverarbeitung',
        technology: 'OpenAI GPT-4 API, LangChain, Python',
        implementation: 'API-Integration mit Prompt-Engineering für spezifische Aufgaben',
        icon: <Brain className="w-4 h-4" />,
        category: 'ai-ml',
        confidence: 95
      });
    }

    // Data Processing Agents
    if (lowerTask.includes('daten') || lowerTask.includes('data') || lowerTask.includes('verarbeitung') || lowerTask.includes('processing')) {
      agents.push({
        name: 'Apache Airflow Agent',
        description: 'Automatisierte Datenpipelines und ETL-Prozesse',
        technology: 'Apache Airflow, Python, Pandas, SQL',
        implementation: 'Scheduled DAGs für Datenverarbeitung, Transformation und Loading',
        icon: <Database className="w-4 h-4" />,
        category: 'data',
        confidence: 90
      });
    }

    // Reporting Agents
    if (lowerTask.includes('bericht') || lowerTask.includes('report') || lowerTask.includes('auswertung') || lowerTask.includes('analytics')) {
      agents.push({
        name: 'Power BI / Tableau Agent',
        description: 'Automatische Berichtserstellung und Dashboard-Generierung',
        technology: 'Power BI, Tableau, Python (matplotlib, seaborn), SQL',
        implementation: 'Scheduled Reports mit automatischer Datenaktualisierung und E-Mail-Versand',
        icon: <BarChart3 className="w-4 h-4" />,
        category: 'reporting',
        confidence: 85
      });
    }

    // Communication Agents
    if (lowerTask.includes('kommunikation') || lowerTask.includes('email') || lowerTask.includes('nachricht') || lowerTask.includes('message')) {
      agents.push({
        name: 'Microsoft Power Automate Agent',
        description: 'Automatisierte E-Mail-Verwaltung und Kommunikation',
        technology: 'Microsoft Power Automate, Outlook API, Teams API',
        implementation: 'Workflow-Automatisierung für E-Mail-Klassifizierung, Antworten und Weiterleitung',
        icon: <MessageSquare className="w-4 h-4" />,
        category: 'communication',
        confidence: 80
      });
    }

    // Documentation Agents
    if (lowerTask.includes('dokumentation') || lowerTask.includes('documentation') || lowerTask.includes('protokoll')) {
      agents.push({
        name: 'Notion AI / Confluence Agent',
        description: 'Automatische Dokumentenerstellung und -verwaltung',
        technology: 'Notion API, Confluence API, Python, Markdown',
        implementation: 'Template-basierte Dokumentenerstellung mit automatischer Inhaltsgenerierung',
        icon: <FileText className="w-4 h-4" />,
        category: 'documentation',
        confidence: 75
      });
    }

    // System Integration Agents
    if (lowerTask.includes('integration') || lowerTask.includes('api') || lowerTask.includes('system')) {
      agents.push({
        name: 'Zapier / Make.com Agent',
        description: 'API-Integration zwischen verschiedenen Systemen',
        technology: 'Zapier, Make.com (Integromat), REST APIs, Webhooks',
        implementation: 'No-Code/Low-Code Integration mit vorgefertigten Connectors',
        icon: <Cog className="w-4 h-4" />,
        category: 'integration',
        confidence: 85
      });
    }

    // RPA Agents for routine tasks
    if (task.complexity === 'low' || lowerTask.includes('routine') || lowerTask.includes('standard')) {
      agents.push({
        name: 'UiPath / Blue Prism Agent',
        description: 'Robotic Process Automation für wiederkehrende Aufgaben',
        technology: 'UiPath Studio, Blue Prism, Python (Selenium, PyAutoGUI)',
        implementation: 'Screen-Recording und Workflow-Design für Desktop-Automatisierung',
        icon: <Zap className="w-4 h-4" />,
        category: 'rpa',
        confidence: 90
      });
    }

    // OCR and Document Processing
    if (lowerTask.includes('dokument') || lowerTask.includes('scan') || lowerTask.includes('formular')) {
      agents.push({
        name: 'Azure Form Recognizer Agent',
        description: 'Automatische Dokumentenverarbeitung und OCR',
        technology: 'Azure Form Recognizer, AWS Textract, Python (Tesseract)',
        implementation: 'Intelligente Dokumentenklassifizierung und Datenextraktion',
        icon: <FileText className="w-4 h-4" />,
        category: 'ocr',
        confidence: 88
      });
    }

    // Customer Service Automation
    if (lowerTask.includes('kunde') || lowerTask.includes('support') || lowerTask.includes('service')) {
      agents.push({
        name: 'Intercom / Zendesk Bot Agent',
        description: 'Automatisierte Kundenbetreuung und Support',
        technology: 'Intercom, Zendesk, Dialogflow, Rasa',
        implementation: 'Chatbot-Integration mit FAQ-Automatisierung und Ticket-Routing',
        icon: <MessageSquare className="w-4 h-4" />,
        category: 'customer-service',
        confidence: 82
      });
    }

    return agents;
  };

  const getWorkflowsForTask = (task: Task) => {
    const lowerTask = task.name.toLowerCase();
    const workflows = [];

    // High automation potential workflows
    if (task.score >= 70) {
      workflows.push({
        name: 'Vollautomatisierter Workflow',
        description: 'Komplett automatisierte Ausführung ohne menschliches Eingreifen',
        technology: 'Apache Airflow, Kubernetes, Docker',
        implementation: 'Containerisierte Microservices mit automatischem Scaling und Monitoring',
        automationLevel: 'Vollautomatisiert',
        estimatedTime: 'Sofort',
        confidence: 95
      });
    }

    // Medium automation potential workflows
    if (task.score >= 40 && task.score < 70) {
      workflows.push({
        name: 'Hybrid Workflow',
        description: 'Automatisierte Ausführung mit menschlicher Überprüfung',
        technology: 'Microsoft Power Automate, Zapier, Slack/Teams Integration',
        implementation: 'Approval-Workflows mit automatischen Benachrichtigungen und Escalation',
        automationLevel: 'Teilautomatisiert',
        estimatedTime: 'Wenige Minuten',
        confidence: 80
      });
    }

    // Low automation potential workflows
    if (task.score < 40) {
      workflows.push({
        name: 'Assistierter Workflow',
        description: 'Menschliche Ausführung mit automatischer Unterstützung',
        technology: 'Browser Extensions, Excel Macros, Google Apps Script',
        implementation: 'Tool-Integration für Datenvorbereitung und Template-Generierung',
        automationLevel: 'Assistiert',
        estimatedTime: 'Reduziert um 30-50%',
        confidence: 60
      });
    }

    // Specific workflow types based on task content
    if (lowerTask.includes('daten') || lowerTask.includes('data')) {
      workflows.push({
        name: 'ETL Data Pipeline Workflow',
        description: 'Automatisierte Datenverarbeitung und -analyse',
        technology: 'Apache Airflow, Apache Spark, PostgreSQL, Redis',
        implementation: 'Scheduled DAGs mit Data Quality Checks und Error Handling',
        automationLevel: 'Vollautomatisiert',
        estimatedTime: 'Sofort',
        confidence: 90
      });
    }

    if (lowerTask.includes('bericht') || lowerTask.includes('report')) {
      workflows.push({
        name: 'Automated Reporting Workflow',
        description: 'Automatische Berichtserstellung und -verteilung',
        technology: 'Power BI, Python (pandas, matplotlib), SMTP, Slack API',
        implementation: 'Scheduled Reports mit automatischem E-Mail-Versand und Dashboard-Updates',
        automationLevel: 'Vollautomatisiert',
        estimatedTime: 'Sofort',
        confidence: 85
      });
    }

    if (lowerTask.includes('email') || lowerTask.includes('kommunikation')) {
      workflows.push({
        name: 'Email Automation Workflow',
        description: 'Automatisierte E-Mail-Verwaltung und -antworten',
        technology: 'Microsoft Graph API, Gmail API, Python (smtplib), NLP',
        implementation: 'Intelligente E-Mail-Klassifizierung mit Template-basierten Antworten',
        automationLevel: 'Teilautomatisiert',
        estimatedTime: 'Wenige Sekunden',
        confidence: 88
      });
    }

    if (lowerTask.includes('dokument') || lowerTask.includes('formular')) {
      workflows.push({
        name: 'Document Processing Workflow',
        description: 'Automatische Dokumentenverarbeitung und -klassifizierung',
        technology: 'Azure Form Recognizer, AWS Textract, Python (OpenCV, Tesseract)',
        implementation: 'OCR-Pipeline mit intelligenter Datenextraktion und Validierung',
        automationLevel: 'Vollautomatisiert',
        estimatedTime: 'Sofort',
        confidence: 92
      });
    }

    if (lowerTask.includes('kunde') || lowerTask.includes('support')) {
      workflows.push({
        name: 'Customer Service Automation Workflow',
        description: 'Automatisierte Kundenbetreuung und Ticket-Management',
        technology: 'Intercom, Zendesk API, Dialogflow, Rasa',
        implementation: 'Chatbot-Integration mit FAQ-Automatisierung und Human-Handoff',
        automationLevel: 'Hybrid',
        estimatedTime: 'Sofort',
        confidence: 85
      });
    }

    if (lowerTask.includes('integration') || lowerTask.includes('api')) {
      workflows.push({
        name: 'API Integration Workflow',
        description: 'Automatisierte Systemintegration und Daten-Synchronisation',
        technology: 'Zapier, Make.com, AWS Lambda, Azure Functions',
        implementation: 'Event-driven Architecture mit Webhook-Integration und Error Recovery',
        automationLevel: 'Vollautomatisiert',
        estimatedTime: 'Sofort',
        confidence: 90
      });
    }

    return workflows;
  };

  const toggleTask = (taskId: string) => {
    const newOpenTasks = new Set(openTasks);
    const newAnimatingTasks = new Set(animatingTasks);
    
    if (newOpenTasks.has(taskId)) {
      // Closing
      newAnimatingTasks.add(taskId);
      setAnimatingTasks(newAnimatingTasks);
      
      setTimeout(() => {
        newOpenTasks.delete(taskId);
        setOpenTasks(newOpenTasks);
        setAnimatingTasks(prev => {
          const updated = new Set(prev);
          updated.delete(taskId);
          return updated;
        });
      }, 300);
    } else {
      // Opening
      newOpenTasks.add(taskId);
      newAnimatingTasks.add(taskId);
      setOpenTasks(newOpenTasks);
      setAnimatingTasks(newAnimatingTasks);
      
      setTimeout(() => {
        setAnimatingTasks(prev => {
          const updated = new Set(prev);
          updated.delete(taskId);
          return updated;
        });
      }, 300);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">
        Identifizierte Aufgaben
      </h3>
      
      <div className="space-y-3">
        {tasks.map((task, index) => {
          const isOpen = openTasks.has(task.id);
          const isAnimating = animatingTasks.has(task.id);
          const aiAgents = getAIAgentsForTask(task);
          const workflows = getWorkflowsForTask(task);
          
          return (
            <Card 
              key={task.id} 
              className={cn(
                "hover:shadow-md transition-all duration-300 ease-in-out",
                isOpen && "shadow-lg"
              )}
              style={{ 
                animation: `fade-in 0.5s ease-out forwards`,
                animationDelay: `${index * 0.1}s`,
                opacity: 0
              }}
            >
              <CardContent className="p-4">
                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Icon based on category */}
                      <div className={`p-2 rounded-full ${
                        task.category === 'automatisierbar' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {task.category === 'automatisierbar' ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      
                      {/* Task info */}
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{task.name}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        
                        {/* Complexity and Trend indicators */}
                        <div className="flex items-center space-x-2 mt-2">
                          {task.complexity && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getComplexityColor(task.complexity)}`}
                            >
                              {task.complexity === 'low' ? 'Niedrige' : 
                               task.complexity === 'medium' ? 'Mittlere' : 'Hohe'} Komplexität
                            </Badge>
                          )}
                          
                          {task.automationTrend && (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              {getTrendIcon(task.automationTrend)}
                              <span>{getTrendText(task.automationTrend)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Score */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">{task.score}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      
                      {/* Category badge */}
                      <Badge 
                        variant={task.category === 'automatisierbar' ? 'default' : 'destructive'}
                        className="capitalize"
                      >
                        {task.category}
                      </Badge>

                      {/* Expand/Collapse button */}
                      <Button variant="ghost" size="sm" className="p-1">
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform duration-300 ease-in-out",
                          isOpen ? "rotate-0" : "-rotate-90"
                        )} />
                      </Button>
                    </div>
                  </div>

                  {/* Animated Content */}
                  <div 
                    ref={(el) => contentRefs.current[task.id] = el}
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isOpen ? "max-h-[2000px] opacity-100 mt-4" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="space-y-4">
                      {/* AI Agents Section */}
                      {aiAgents.length > 0 && (
                        <div className="border-t pt-4">
                          <h5 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                            <Bot className="w-4 h-4" />
                            <span>{t('recommended_ai_agents')}</span>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {aiAgents.map((agent, agentIndex) => (
                              <div key={agentIndex} className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  {agent.icon}
                                  <span className="font-medium text-sm">{agent.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {agent.confidence}%
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{agent.description}</p>
                                <div className="space-y-1">
                                  <div className="text-xs">
                                    <span className="font-medium text-foreground">Technologie:</span>
                                    <span className="text-muted-foreground ml-1">{agent.technology}</span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-medium text-foreground">Implementierung:</span>
                                    <span className="text-muted-foreground ml-1">{agent.implementation}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Workflows Section */}
                      {workflows.length > 0 && (
                        <div className="border-t pt-4">
                          <h5 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>{t('recommended_workflows')}</span>
                          </h5>
                          <div className="space-y-3">
                            {workflows.map((workflow, workflowIndex) => (
                              <div key={workflowIndex} className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">{workflow.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {workflow.confidence}%
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{workflow.description}</p>
                                <div className="space-y-1 mb-2">
                                  <div className="text-xs">
                                    <span className="font-medium text-foreground">Technologie:</span>
                                    <span className="text-muted-foreground ml-1">{workflow.technology}</span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-medium text-foreground">Implementierung:</span>
                                    <span className="text-muted-foreground ml-1">{workflow.implementation}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4 text-xs">
                                  <span className="text-muted-foreground">
                                    <strong>{t('automation_level')}:</strong> {workflow.automationLevel}
                                  </span>
                                  <span className="text-muted-foreground">
                                    <strong>{t('time')}:</strong> {workflow.estimatedTime}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No automation suggestions for human tasks */}
                      {task.category === 'mensch' && aiAgents.length === 0 && (
                        <div className="border-t pt-4">
                          <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <User className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm text-blue-800">
                              {t('human_task_message')}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {t('human_task_subtitle')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
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