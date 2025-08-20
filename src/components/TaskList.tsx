import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, User, ChevronDown, ChevronUp, Zap, Workflow, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { t, translateCategory } from "@/lib/i18n/i18n";
import { AppIcon } from './AppIcon';
import { AITool, getToolById, getToolDescription, getToolFeatures } from '../lib/catalog/aiTools';

interface Task {
  id?: string;
  text: string;
  name?: string;
  score: number;
  label?: 'Automatisierbar' | 'Teilweise Automatisierbar' | 'Mensch';
  category?: 'automatisierbar' | 'teilweise' | 'mensch' | string;
  description?: string;
  complexity?: 'low' | 'medium' | 'high';
  automationTrend?: 'increasing' | 'stable' | 'decreasing';
  humanRatio?: number;
  automationRatio?: number;
  confidence?: number;
  aiTools?: string[];
  industry?: string;
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

// Circular Pie Chart Component
const CircularPieChart = ({ automationRatio, humanRatio, size = 60 }: { 
  automationRatio: number; 
  humanRatio: number; 
  size?: number;
}) => {
  const radius = size / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dasharray for automation (green)
  const automationStrokeDasharray = (automationRatio / 100) * circumference;
  const humanStrokeDasharray = (humanRatio / 100) * circumference;
  
  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 3}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="4"
        />
        {/* Automation segment (brand color) */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 3}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeDasharray={`${automationStrokeDasharray - 3} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        {/* Human segment (red) - starts after automation with gap */}
        {humanRatio > 0 && (
          <circle
            cx={radius}
            cy={radius}
            r={radius - 3}
            fill="none"
            stroke="hsl(var(--destructive))"
            strokeWidth="4"
            strokeDasharray={`${humanStrokeDasharray - 3} ${circumference}`}
            strokeDashoffset={-automationStrokeDasharray + 3}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs font-bold text-gray-800">{automationRatio}%</div>
        </div>
      </div>
    </div>
  );
};

const TaskList = ({ tasks, lang = "de" }: TaskListProps) => {

  
  // Get language from URL as fallback
  const getCurrentLang = () => {
    if (lang) return lang;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('lang') === 'en' ? 'en' : 'de';
    }
    return 'de';
  };
  
  const currentLang = getCurrentLang();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const openToolModal = (tool: AITool) => {
    setSelectedTool(tool);
    setIsToolModalOpen(true);
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
      case 'low': return currentLang === 'de' ? 'Niedrige Komplexität' : 'Low Complexity';
      case 'medium': return currentLang === 'de' ? 'Mittlere Komplexität' : 'Medium Complexity';
      case 'high': return currentLang === 'de' ? 'Hohe Komplexität' : 'High Complexity';
      default: return currentLang === 'de' ? 'Unbekannte Komplexität' : 'Unknown Complexity';
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'automatisierbar': return 'bg-green-100 text-green-800';
      case 'teilweise': return 'bg-yellow-100 text-yellow-800';
      case 'mensch': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'automatisierbar': return lang === 'de' ? 'Automatisierbar' : 'Automated';
      case 'teilweise': return lang === 'de' ? 'Teilweise Automatisierbar' : 'Partially Automated';
      case 'mensch': return lang === 'de' ? 'Menschlich' : 'Human';
      default: return lang === 'de' ? 'Unbekannt' : 'Unknown';
    }
  };

  const getAIAgentsForTask = (task: Task) => {
    const agents = [];
    const taskText = (task.name || task.text || '').toLowerCase();
    
    // Check if task has automation potential (score > 0 or automationRatio > 0)
    const hasAutomationPotential = (task.score && task.score > 0) || (task.automationRatio && task.automationRatio > 0);
    
    if (hasAutomationPotential) {
      // Software Development with AI assistance
      if (taskText.includes('entwicklung') || taskText.includes('programmierung') || taskText.includes('coding') || 
          taskText.includes('react') || taskText.includes('node.js') || taskText.includes('api') || 
          taskText.includes('debugging') || taskText.includes('testing') || taskText.includes('code review')) {
        agents.push({
          name: currentLang === 'en' ? "AI Development Assistant" : "AI-Entwicklungs-Assistent",
          technology: "ChatGPT + GitHub Copilot + Claude",
                      implementation: currentLang === 'en' 
              ? "Install GitHub Copilot in your IDE\nCreate ChatGPT prompts for code reviews\nUse Claude for debugging help\nReview and validate AI-generated solutions"
              : "Installiere GitHub Copilot in deiner IDE\nErstelle ChatGPT-Prompts für Code-Reviews\nNutze Claude für Debugging-Hilfe\nÜberprüfe und validiere AI-generierte Lösungen",
            difficulty: currentLang === 'en' ? "Medium" : "Mittel",
            setupTime: currentLang === 'en' ? "2-4 hours" : "2-4 Stunden"
        });
      }
      
      // Finance and Accounting Tasks
      if (taskText.includes('buchhaltung') || taskText.includes('finanz') || taskText.includes('abschluss') ||
          taskText.includes('steuer') || taskText.includes('abrechnung') || taskText.includes('kontierung') ||
          taskText.includes('umsatzsteuer') || taskText.includes('mahnwesen') || taskText.includes('zahlungsverkehr') ||
          taskText.includes('abstimmung') || taskText.includes('steuerberater') || taskText.includes('budget') ||
          taskText.includes('controlling') || taskText.includes('accounting') || taskText.includes('finance') ||
          taskText.includes('reconciliation') || taskText.includes('tax') || taskText.includes('variance') ||
          taskText.includes('financial statements') || taskText.includes('bookkeeping')) {
        agents.push({
          name: currentLang === 'en' ? "Financial Automation Agent" : "Finanz-Automatisierungs-Agent",
          technology: "ChatGPT + Claude + Excel AI + Power BI AI",
          implementation: currentLang === 'en'
            ? "1. Use ChatGPT for financial analysis strategies\n2. Use Claude for complex accounting calculations\n3. Enable Excel AI for automatic formulas and data entry\n4. Use Power BI AI for financial dashboards and reporting\n5. Automate monthly and annual financial statements\n6. Set up automated reconciliation processes"
            : "1. Nutze ChatGPT für Finanzanalyse-Strategien\n2. Verwende Claude für komplexe Buchhaltungsberechnungen\n3. Aktiviere Excel AI für automatische Formeln und Dateneingabe\n4. Nutze Power BI AI für Finanzdashboards und Berichte\n5. Automatisiere Monats- und Jahresabschlüsse\n6. Richte automatisierte Abstimmungsprozesse ein",
          difficulty: currentLang === 'en' ? "Medium" : "Mittel",
          setupTime: currentLang === 'en' ? "1-2 weeks" : "1-2 Wochen"
        });
      }
      
      // Data Analysis and Processing
      if (taskText.includes('daten') || taskText.includes('data') || taskText.includes('excel') || 
          taskText.includes('auswertung') || taskText.includes('statistik') || taskText.includes('reporting')) {
        agents.push({
          name: currentLang === 'en' ? "Data Analysis Agent" : "Datenanalyse-Agent",
          technology: "ChatGPT + Claude + Excel AI",
          implementation: currentLang === 'en'
            ? "Use ChatGPT for data analysis strategies\nUse Claude for complex calculations\nEnable Excel AI for automatic formulas\nCreate automated reports with AI"
            : "Nutze ChatGPT für Datenanalyse-Strategien\nVerwende Claude für komplexe Berechnungen\nAktiviere Excel AI für automatische Formeln\nErstelle automatisierte Reports mit AI"
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
          name: currentLang === 'en' ? "All-Purpose AI Assistant" : "Allzweck-AI-Assistent",
          technology: "ChatGPT + Claude + Gemini + Grok + Pi",
          implementation: currentLang === 'en'
            ? "Create specific prompts for your task\nUse ChatGPT for general support\nUse Claude for detailed analyses\nUse Gemini for multimodal tasks\nUse Grok for creative tasks\nUse Pi for conversational tasks\nReview and validate AI recommendations"
            : "Erstelle spezifische Prompts für deine Aufgabe\nNutze ChatGPT für allgemeine Unterstützung\nVerwende Claude für detaillierte Analysen\nNutze Gemini für multimodale Aufgaben\nVerwende Grok für kreative Aufgaben\nNutze Pi für Gesprächsaufgaben\nÜberprüfe und validiere AI-Empfehlungen",
          difficulty: currentLang === 'en' ? "Medium" : "Mittel",
          setupTime: currentLang === 'en' ? "2-4 hours" : "2-4 Stunden"
        });
      }
    }
    
    return agents;
  };

  const getWorkflowsForTask = (task: Task) => {
    const workflows = [];
    const taskText = (task.name || task.text || '').toLowerCase();
    
    // Check if task has automation potential (score > 0 or automationRatio > 0)
    const hasAutomationPotential = (task.score && task.score > 0) || (task.automationRatio && task.automationRatio > 0);
    
    if (hasAutomationPotential) {
      // Software Development Workflows
      if (taskText.includes('entwicklung') || taskText.includes('programmierung') || taskText.includes('coding') || 
          taskText.includes('react') || taskText.includes('node.js') || taskText.includes('api') || 
          taskText.includes('debugging') || taskText.includes('testing')) {
        workflows.push({
          name: currentLang === 'en' ? "AI-Supported Development Workflow" : "AI-gestützter Entwicklungs-Workflow",
          technology: "GitHub Actions + ChatGPT API",
          implementation: currentLang === 'en'
            ? "Create GitHub Actions Workflow\nIntegrate ChatGPT API for Code Reviews\nReview AI-generated tests before deployment\nSet manual approval for critical changes"
            : "Erstelle GitHub Actions Workflow\nIntegriere ChatGPT API für Code-Reviews\nÜberprüfe AI-generierte Tests vor Deployment\nSetze manuelle Freigabe für kritische Änderungen"
        });
      }
      
      // Finance and Accounting Workflows
      if (taskText.includes('buchhaltung') || taskText.includes('finanz') || taskText.includes('abschluss') ||
          taskText.includes('steuer') || taskText.includes('abrechnung') || taskText.includes('kontierung') ||
          taskText.includes('umsatzsteuer') || taskText.includes('mahnwesen') || taskText.includes('zahlungsverkehr') ||
          taskText.includes('abstimmung') || taskText.includes('steuerberater') || taskText.includes('budget') ||
          taskText.includes('controlling') || taskText.includes('accounting') || taskText.includes('finance') ||
          taskText.includes('reconciliation') || taskText.includes('tax') || taskText.includes('variance') ||
          taskText.includes('financial statements') || taskText.includes('bookkeeping')) {
        workflows.push({
          name: currentLang === 'en' ? "Financial Automation Pipeline" : "Finanz-Automatisierungs-Pipeline",
          technology: "Apache Airflow + Excel AI + Power BI AI + ChatGPT API",
          implementation: currentLang === 'en'
            ? "1. Install Apache Airflow with Docker\n2. Integrate Excel AI for automatic data processing\n3. Use Power BI AI for financial dashboards\n4. Connect ChatGPT API for intelligent analysis\n5. Set up automated monthly financial statements\n6. Create automated reconciliation workflows"
            : "1. Installiere Apache Airflow mit Docker\n2. Integriere Excel AI für automatische Datenverarbeitung\n3. Nutze Power BI AI für Finanzdashboards\n4. Verbinde ChatGPT API für intelligente Analysen\n5. Richte automatisierte Monatsabschlüsse ein\n6. Erstelle automatisierte Abstimmungs-Workflows",
          difficulty: currentLang === 'en' ? "Medium" : "Mittel",
          setupTime: currentLang === 'en' ? "2-3 weeks" : "2-3 Wochen"
        });
      }
      
      // Data Processing Workflows
      if (taskText.includes('daten') || taskText.includes('data') || taskText.includes('excel') || 
          taskText.includes('auswertung') || taskText.includes('statistik') || taskText.includes('reporting')) {
        workflows.push({
          name: "Datenanalyse-Automatisierung",
          technology: "Apache Airflow + ChatGPT API",
          implementation: "Installiere Apache Airflow mit Docker\nIntegriere ChatGPT API für Datenanalyse\nErstelle automatisierte Reporting-Pipeline\nSetze tägliche Ausführung"
        });
      }
      
      // Documentation Workflows
      if (taskText.includes('dokumentation') || taskText.includes('protokoll') || taskText.includes('kommunikation') ||
          taskText.includes('email') || taskText.includes('bericht')) {
        workflows.push({
          name: "Dokumentations-Automatisierung",
          technology: "n8n + ChatGPT API",
          implementation: "Installiere n8n: npm install n8n\nIntegriere ChatGPT API für automatische Dokumentation\nErstelle Trigger für neue Dokumente\nAutomatisiere Qualitätskontrolle"
        });
      }
      
      // System Integration Workflows
      if (taskText.includes('integration') || taskText.includes('system') || taskText.includes('crm') || 
          taskText.includes('erp') || taskText.includes('datenbank')) {
        workflows.push({
          name: "System-Integrations-Pipeline",
          technology: "Zapier + n8n + ChatGPT API",
          implementation: "Erstelle Zapier-Konto für einfache Verbindungen\nNutze n8n für komplexe Automatisierungen\nIntegriere ChatGPT API für intelligente Entscheidungen\nAutomatisiere Datenübertragungen"
        });
      }
      
      // Collaboration Workflows
      if (taskText.includes('zusammenarbeit') || taskText.includes('team') || taskText.includes('agil') ||
          taskText.includes('meeting') || taskText.includes('koordination')) {
        workflows.push({
          name: "Team-Kollaborations-Automatisierung",
          technology: "Slack + Microsoft Teams + ChatGPT API",
          implementation: "Aktiviere Slack/Teams Integrationen\nIntegriere ChatGPT API für Meeting-Vorbereitung\nÜberwache automatische Status-Updates\nErstelle intelligente Benachrichtigungen mit manueller Kontrolle"
        });
      }
      
      // General AI-Powered Workflow
      if (workflows.length === 0) {
        workflows.push({
          name: currentLang === 'en' ? "AI-Supported Automation Workflow" : "AI-gestützter Automatisierungs-Workflow",
          technology: "ChatGPT API + Zapier + n8n",
          implementation: currentLang === 'en'
            ? "Create ChatGPT API account\nUse Zapier for simple automations\nUse n8n for complex workflows\nIntegrate AI for intelligent decisions"
            : "Erstelle ChatGPT API-Konto\nNutze Zapier für einfache Automatisierungen\nVerwende n8n für komplexe Workflows\nIntegriere AI für intelligente Entscheidungen"
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
          const automationCategory = task.label === 'Automatisierbar' ? 'automatisierbar' : 
                                   task.label === 'Teilweise Automatisierbar' ? 'teilweise' :
                                   task.label === 'Mensch' ? 'mensch' : 
                                   'mensch';
          const aiAgents = getAIAgentsForTask({ ...task, category: automationCategory });
          const workflows = getWorkflowsForTask({ ...task, category: automationCategory });
          
          return (
            <Card 
              key={task.id} 
              className={`transition-shadow duration-200 ${
                isExpanded ? 'shadow-lg' : 'hover:shadow-md'
              }`}
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
                    {/* Icon based on category - replaced with pie chart for human tasks */}
                    {automationCategory === 'mensch' ? (
                      <div className="flex items-center justify-end">
                        {(() => {
                          let automationRatio = task.automationRatio;
                          let humanRatio = task.humanRatio;
                          
                          // Fallback: Berechne Ratios basierend auf Score wenn nicht vorhanden
                          if (automationRatio === undefined || humanRatio === undefined) {
                            automationRatio = task.score || 50;
                            humanRatio = 100 - automationRatio;
                          }
                          
                          return (
                            <CircularPieChart automationRatio={automationRatio} humanRatio={humanRatio} size={50} />
                          );
                        })()}
                      </div>
                    ) : (
                      <div className={`p-2 rounded-full ${
                        automationCategory === 'automatisierbar' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {automationCategory === 'automatisierbar' ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </div>
                    )}
                    
                    {/* Task info */}
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{taskName}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {task.description || (() => {
                            // Simple category translation
                            let categoryText = 'General';
                            if (task.category === 'administrative') categoryText = 'Administrative';
                            else if (task.category === 'communication') categoryText = 'Communication';
                            else if (task.category === 'technical') categoryText = 'Technical';
                            else if (task.category === 'analytical') categoryText = 'Analytical';
                            else if (task.category === 'creative') categoryText = 'Creative';
                            else if (task.category === 'management') categoryText = 'Management';
                            else if (task.category === 'physical') categoryText = 'Physical';
                            else if (task.category === 'routine') categoryText = 'Routine';
                            
                            // Check if we're in English mode
                            const isEnglish = window.location.search.includes('lang=en');
                            
                            // Return the text
                            if (isEnglish) {
                              return `${categoryText} (Confidence: ${task.confidence || task.score}%)`;
                            } else {
                              // German translations
                              if (task.category === 'administrative') categoryText = 'Administrativ';
                              else if (task.category === 'communication') categoryText = 'Kommunikation';
                              else if (task.category === 'technical') categoryText = 'Technisch';
                              else if (task.category === 'analytical') categoryText = 'Analytisch';
                              else if (task.category === 'creative') categoryText = 'Kreativ';
                              else if (task.category === 'management') categoryText = 'Management';
                              else if (task.category === 'physical') categoryText = 'Physisch';
                              else if (task.category === 'routine') categoryText = 'Routine';
                              else categoryText = 'Allgemein';
                              
                              return `${categoryText} (${t(lang, 'task_confidence')}: ${task.confidence || task.score}%)`;
                            }
                          })()}
                        </span>
                      </div>

                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Combined Trend, Complexity and Circle */}
                    <div className="flex items-center space-x-3 ml-auto">
                      {/* Trend with text */}
                      {task.automationTrend && (
                        <div className={`flex items-center space-x-1 text-xs ${
                          task.automationTrend === 'increasing' ? 'text-primary' :
                          task.automationTrend === 'decreasing' ? 'text-destructive' :
                          'text-muted-foreground'
                        }`}>
                          {task.automationTrend === 'increasing' ? <TrendingUp className="w-3 h-3" /> :
                           task.automationTrend === 'decreasing' ? <TrendingDown className="w-3 h-3" /> :
                           <Minus className="w-3 h-3" />}
                          <span>
                            {task.automationTrend === 'increasing' ? (currentLang === 'de' ? 'Steigender Trend' : 'Increasing Trend') :
                             task.automationTrend === 'decreasing' ? (currentLang === 'de' ? 'Fallender Trend' : 'Decreasing Trend') : 
                             (currentLang === 'de' ? 'Stabiler Trend' : 'Stable Trend')}
                          </span>
                        </div>
                      )}
                      
                                            {/* Complexity tag */}
                      {task.complexity && (
                        <Badge className={`text-xs ${getComplexityColor(task.complexity)} pointer-events-none`}>
                          {getComplexityText(task.complexity)}
                        </Badge>
                      )}
                      

                    </div>
                    
                    {/* Category badge - REMOVED */}
                    
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
                    {/* AI Agents and Workflows Section - Side by Side */}
                    {(automationCategory === 'automatisierbar' && (aiAgents.length > 0 || workflows.length > 0)) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* AI Agents Section - Left */}
                        {aiAgents.length > 0 && (
                          <div>
                            <h5 className="font-medium text-foreground mb-2 flex items-center">
                              <Zap className="w-4 h-4 mr-2 text-primary" />
                              {t(lang, "recommended_ai_agents")}
                            </h5>
                            <div className="space-y-2">
                              {aiAgents.map((agent, idx) => (
                                 <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                                   <div className="font-medium text-sm mb-2">{agent.name}</div>
                                   <div className="text-xs text-muted-foreground mb-2">
                                     <strong>{t(lang, "technology")}:</strong> {agent.technology}
                                   </div>
                                   <div className="text-xs text-muted-foreground mb-2">
                                     <strong>{t(lang, "difficulty")}:</strong> {agent.difficulty || t(lang, "medium")} • <strong>{t(lang, "setup_time")}:</strong> {agent.setupTime || t(lang, "2_4_hours")}
                                   </div>
                                   <div className="text-xs text-muted-foreground">
                                     <strong>{t(lang, "implementation_steps")}:</strong>
                                     <ol className="mt-1 ml-4 space-y-1 list-decimal">
                                       {agent.implementation.split('\n').map((step, stepIdx) => (
                                         <li key={stepIdx} className="pl-1">
                                           {step.replace(/^\d+\.\s*/, '')}
                                         </li>
                                       ))}
                                     </ol>
                                   </div>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Workflows Section - Right */}
                        {workflows.length > 0 && (
                          <div>
                            <h5 className="font-medium text-foreground mb-2 flex items-center">
                              <Workflow className="w-4 h-4 mr-2 text-primary" />
                              {t(lang, "recommended_workflows")}
                            </h5>
                            <div className="space-y-2">
                              {workflows.map((workflow, idx) => (
                                 <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                                   <div className="font-medium text-sm mb-2">{workflow.name}</div>
                                   <div className="text-xs text-muted-foreground mb-2">
                                     <strong>{t(lang, "technology")}:</strong> {workflow.technology}
                                   </div>
                                   <div className="text-xs text-muted-foreground">
                                     <strong>{t(lang, "implementation_steps")}:</strong>
                                     <ol className="mt-1 ml-4 space-y-1 list-decimal">
                                       {workflow.implementation.split('\n').map((step, stepIdx) => (
                                         <li key={stepIdx} className="pl-1">
                                           {step.replace(/^\d+\.\s*/, '')}
                                         </li>
                                       ))}
                                     </ol>
                                   </div>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* AI Agents & Workflows Section */}
                    {(() => {
                      const agents = getAIAgentsForTask(task);
                      const workflows = getWorkflowsForTask(task);
                      const hasAutomation = (task.automationRatio && task.automationRatio > 0) || (task.score && task.score > 0);
                      
                      return hasAutomation && (agents.length > 0 || workflows.length > 0) ? (
                        <div className="flex gap-4">
                          {/* AI Agents */}
                          {agents.length > 0 && (
                            <div className="flex-1">
                              <h5 className="font-medium text-foreground mb-2 flex items-center">
                                <Zap className="w-4 h-4 mr-2 text-primary" />
                                {lang === 'de' ? 'AI Agenten' : 'AI Agents'}
                              </h5>
                              <div className="space-y-2">
                                {agents.map((agent, index) => (
                                  <div key={index} className="bg-muted/50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">{agent.name}</span>
                                      {agent.difficulty && (
                                        <Badge variant="outline" className="text-xs">
                                          {agent.difficulty}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      <strong>{lang === 'de' ? 'Tech:' : 'Tech:'}</strong> {agent.technology}
                                    </div>
                                    <div className="text-xs text-muted-foreground whitespace-pre-line">
                                      {agent.implementation}
                                    </div>
                                    {agent.setupTime && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        <strong>{lang === 'de' ? 'Setup:' : 'Setup:'}</strong> {agent.setupTime}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Workflows */}
                          {workflows.length > 0 && (
                            <div className="flex-1">
                              <h5 className="font-medium text-foreground mb-2 flex items-center">
                                <Workflow className="w-4 h-4 mr-2 text-primary" />
                                {lang === 'de' ? 'Workflows' : 'Workflows'}
                              </h5>
                              <div className="space-y-2">
                                {workflows.map((workflow, index) => (
                                  <div key={index} className="bg-muted/50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">{workflow.name}</span>
                                      {workflow.difficulty && (
                                        <Badge variant="outline" className="text-xs">
                                          {workflow.difficulty}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      <strong>{lang === 'de' ? 'Tech:' : 'Tech:'}</strong> {workflow.technology}
                                    </div>
                                    <div className="text-xs text-muted-foreground whitespace-pre-line">
                                      {workflow.implementation}
                                    </div>
                                    {workflow.setupTime && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        <strong>{lang === 'de' ? 'Setup:' : 'Setup:'}</strong> {workflow.setupTime}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}

                    {/* AI Tools Section - MOVED AFTER AI AGENTS & WORKFLOWS */}
                    {task.aiTools && task.aiTools.length > 0 && (
                      <div>
                        <h5 className="font-medium text-foreground mb-2 flex items-center">
                          <Bot className="w-4 h-4 mr-2 text-primary" />
                          {t(lang, "recommended_ai_tools")} ({task.aiTools.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {task.aiTools.map((toolId) => {
                            const tool = getToolById(toolId);
                            if (!tool) {
                              return (
                                <div key={toolId} className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                                  <span className="text-sm font-medium text-red-500">{toolId} (nicht gefunden)</span>
                                </div>
                              );
                            }
                            return (
                              <div 
                                key={toolId} 
                                className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                                onClick={() => openToolModal(tool)}
                              >
                                <AppIcon tool={tool} size="sm" />
                                <span className="text-sm font-medium">{tool.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Human tasks info - MOVED TO END */}
                    {automationCategory === 'mensch' && (
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <h5 className="font-medium text-slate-800 mb-1">{t(lang, "analysis_human_expertise_required")}</h5>
                        <p className="text-sm text-slate-600">
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

      {/* AI Tool Detail Modal */}
      <Dialog open={isToolModalOpen} onOpenChange={setIsToolModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedTool && <AppIcon tool={selectedTool} size="md" />}
              <span>{selectedTool?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTool && (
            <div className="space-y-4">
              {/* Description */}
              <div>
                <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Beschreibung' : 'Description'}</h4>
                <p className="text-sm text-muted-foreground">{getToolDescription(selectedTool, lang || 'de')}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Kategorie' : 'Category'}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTool.category}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Branchen' : 'Industries'}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTool.industry.join(', ')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Preismodell' : 'Pricing'}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTool.pricing}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Automatisierungspotenzial' : 'Automation Potential'}</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${selectedTool.automationPotential}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{selectedTool.automationPotential}%</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Features' : 'Features'}</h4>
                <div className="flex flex-wrap gap-2">
                  {getToolFeatures(selectedTool, lang || 'de').map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Website Link */}
              <div className="flex justify-end">
                <a 
                  href={selectedTool.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <span>{lang === 'de' ? 'Website besuchen' : 'Visit Website'}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskList;