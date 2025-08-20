import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Zap, 
  Users, 
  Brain, 
  Cpu, 
  Workflow, 
  ArrowRight, 
  Play, 
  Settings, 
  Code,
  Database,
  MessageSquare,
  FileText,
  BarChart3,
  Shield,
  Clock,
  Sparkles,
  GitBranch,
  TestTube,
  Activity,
  AlertTriangle,
  CheckCircle,
  Layers,
  Target,
  Lightbulb
} from "lucide-react";
import Header from "@/components/Header";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CodeHighlight from "@/components/CodeHighlight";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { resolveLang, t } from "@/lib/i18n/i18n";

const AgentsWorkflows = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  const beginnerContent = {
    de: {
      title: "KI-Agenten & Workflows für Anfänger",
      subtitle: "Lernen Sie, wie Automatisierung Ihren Arbeitsalltag erleichtern kann",
      whatAreAgents: {
        title: "Was sind KI-Agenten?",
        description: "KI-Agenten sind wie digitale Kollegen, die Ihnen bei bestimmten Aufgaben helfen. Sie können zum Beispiel E-Mails beantworten, während Sie sich auf wichtigere Dinge konzentrieren. Keine Sorge - sie ersetzen Sie nicht, sondern unterstützen Sie dabei, produktiver zu werden.",
        examples: [
          {
            icon: Users,
            title: "E-Mail-Assistent",
            description: "Sortiert Ihre E-Mails automatisch und beantwortet Standardanfragen, während Sie sich auf komplexe Kundenanliegen konzentrieren"
          },
          {
            icon: Clock,
            title: "Termin-Manager",
            description: "Plant Meetings, sendet Erinnerungen und passt Termine automatisch an, wenn sich etwas ändert"
          },
          {
            icon: Zap,
            title: "Daten-Analyst",
            description: "Durchsucht große Datenmengen und erstellt automatisch Berichte mit den wichtigsten Erkenntnissen"
          }
        ]
      },
      whatAreWorkflows: {
        title: "Was sind Workflows?",
        description: "Workflows sind wie Kochrezepte für Ihren Computer. Statt jeden Tag die gleichen Schritte manuell zu machen, macht der Computer das automatisch. Zum Beispiel: Wenn Sie jeden Montagmorgen 50 E-Mails sortieren und in verschiedene Ordner einordnen müssen.",
        examples: [
          {
            icon: Target,
            title: "E-Mail-Workflow",
            description: "E-Mail erhalten → Automatisch kategorisieren → In richtigen Ordner verschieben → Wichtige E-Mails markieren"
          },
          {
            icon: Lightbulb,
            title: "Bericht-Workflow",
            description: "Daten sammeln → Automatisch analysieren → Grafiken erstellen → PDF-Bericht generieren → Per E-Mail versenden"
          }
        ]
      },
      benefits: {
        title: "Was bringt Ihnen das?",
        items: [
          "Mehr Zeit für das, was wirklich wichtig ist - statt stundenlang E-Mails zu sortieren",
          "Weniger Fehler durch automatisierte Prozesse",
          "Bessere Work-Life-Balance durch weniger repetitive Aufgaben",
          "Höhere Produktivität und Effizienz im Team"
        ]
      }
    },
    en: {
      title: "AI Agents & Workflows for Beginners",
      subtitle: "Learn how automation can make your workday easier",
      whatAreAgents: {
        title: "What are AI Agents?",
        description: "AI agents are like digital colleagues who help you with specific tasks. For example, they can answer emails while you focus on more important things. Don't worry - they don't replace you, but help you become more productive.",
        examples: [
          {
            icon: Users,
            title: "Email Assistant",
            description: "Automatically sorts your emails and answers standard inquiries while you focus on complex customer concerns"
          },
          {
            icon: Clock,
            title: "Appointment Manager",
            description: "Schedules meetings, sends reminders and automatically adjusts appointments when something changes"
          },
          {
            icon: Zap,
            title: "Data Analyst",
            description: "Searches through large amounts of data and automatically creates reports with the most important insights"
          }
        ]
      },
      whatAreWorkflows: {
        title: "What are Workflows?",
        description: "Workflows are like recipes for your computer. Instead of manually doing the same steps every day, the computer does it automatically. For example: When you have to sort 50 emails and organize them into different folders every Monday morning.",
        examples: [
          {
            icon: Target,
            title: "Email Workflow",
            description: "Receive email → Automatically categorize → Move to correct folder → Mark important emails"
          },
          {
            icon: Lightbulb,
            title: "Report Workflow",
            description: "Collect data → Automatically analyze → Create graphics → Generate PDF report → Send via email"
          }
        ]
      },
      benefits: {
        title: "What's in it for you?",
        items: [
          "More time for what really matters - instead of sorting emails for hours",
          "Fewer errors through automated processes",
          "Better work-life balance through less repetitive tasks",
          "Higher productivity and efficiency in the team"
        ]
      }
    }
  };

  const advancedContent = {
    de: {
      title: "KI-Agenten & Workflows für Technik-Enthusiasten",
      subtitle: "Praktische Implementierung, Tools und Strategien für den produktiven Einsatz",
      agentArchitecture: {
        title: "Wie funktionieren KI-Agenten?",
        description: "KI-Agenten sind intelligente Systeme, die aus mehreren Komponenten bestehen und Aufgaben selbstständig ausführen können.",
        components: [
          {
            icon: Code,
            title: "Intelligente Verarbeitung",
            description: "Versteht und analysiert Ihre Anfragen",
            details: "Verwendet GPT-4/Claude für natürliche Kommunikation"
          },
          {
            icon: Database,
            title: "Gedächtnis & Erfahrung",
            description: "Merkt sich Kontext und lernt aus Interaktionen",
            details: "Speichert wichtige Informationen für bessere Antworten"
          },
          {
            icon: Shield,
            title: "Sicherheit & Kontrolle",
            description: "Schützt vor unerwünschten Aktionen",
            details: "Prüft alle Ausgaben auf Sicherheit und Relevanz"
          }
        ]
      },
      workflowPatterns: {
        title: "Workflow-Arten",
        description: "Verschiedene Arten von Workflows für unterschiedliche Anwendungsfälle und Komplexitätsgrade.",
        patterns: [
          {
            icon: GitBranch,
            title: "Ereignisgesteuerte Workflows",
            description: "Reagieren automatisch auf bestimmte Ereignisse",
            details: "Z.B. E-Mail erhalten → Automatisch kategorisieren"
          },
          {
            icon: Activity,
            title: "Integration mit bestehenden Tools",
            description: "Verbinden verschiedene Anwendungen und Dienste",
            details: "Z.B. Slack + Google Calendar + Trello"
          },
          {
            icon: Layers,
            title: "Geplante Automatisierungen",
            description: "Führen Aufgaben zu bestimmten Zeiten aus",
            details: "Z.B. Tägliche Berichte, wöchentliche Analysen"
          }
        ]
      },
      implementation: {
        title: "Erfolgreiche Einführung",
        description: "Schritt-für-Schritt Anleitung für die erfolgreiche Implementierung von KI-Agenten in Ihrem Arbeitsalltag.",
        strategy: [
          "Start mit einfachen Aufgaben: E-Mail-Sortierung, Terminplanung",
          "Integration in bestehende Tools: Slack, Teams, Google Workspace",
          "Monitoring und Feedback: Überwachen Sie die Ergebnisse",
          "Schrittweise Erweiterung: Komplexere Aufgaben hinzufügen"
        ]
      },
      technicalConsiderations: {
        title: "Herausforderungen & Lösungen",
        challenges: [
          {
            icon: AlertTriangle,
            title: "Geschwindigkeit",
            description: "Manchmal dauert die Verarbeitung zu lange",
            solution: "Intelligente Caching-Systeme und lokale Verarbeitung"
          },
          {
            icon: Activity,
            title: "Skalierbarkeit",
            description: "Bei hoher Nutzung kann es eng werden",
            solution: "Cloud-basierte Lösungen mit automatischer Skalierung"
          },
          {
            icon: Shield,
            title: "Datenschutz",
            description: "Sensible Daten müssen geschützt werden",
            solution: "Verschlüsselung und lokale Verarbeitung wo möglich"
          },
          {
            icon: CheckCircle,
            title: "Kostenkontrolle",
            description: "KI-Services können teuer werden",
            solution: "Intelligente Nutzung und kostenoptimierte Anbieter"
          }
        ]
      },
      codeExamples: {
        title: "Praktische Beispiele",
        examples: [
          {
            icon: Code,
            title: "E-Mail-Automatisierung",
            description: "Automatische E-Mail-Kategorisierung und Antworten",
            language: "python" as const,
            code: `# Beispiel: E-Mail automatisch kategorisieren
def categorize_email(email_content):
    # KI analysiert den Inhalt
    category = ai_analyze(email_content)
    
    if category == "Support":
        auto_reply = generate_support_response(email_content)
        send_auto_reply(email, auto_reply)
    elif category == "Sales":
        forward_to_sales_team(email)
    else:
        mark_for_human_review(email)`
          },
          {
            icon: Database,
            title: "Datenanalyse & Berichte",
            description: "Automatische Berichtserstellung aus verschiedenen Quellen",
            language: "python" as const,
            code: `# Beispiel: Wöchentlichen Bericht erstellen
def generate_weekly_report():
    # Daten aus verschiedenen Quellen sammeln
    sales_data = get_sales_data()
    customer_feedback = get_feedback_data()
    
    # KI analysiert und erstellt Bericht
    report = ai_analyze_and_summarize(sales_data, customer_feedback)
    
    # Bericht automatisch versenden
    send_report_to_team(report)
    schedule_next_report()`
          },
          {
            icon: Shield,
            title: "Sicherheitsprüfung",
            description: "Automatische Überprüfung von Inhalten und Aktionen",
            language: "python" as const,
            code: `# Beispiel: Sicherheitsprüfung für Aktionen
def check_action_safety(action):
    # Prüft ob die Aktion sicher ist
    safety_score = ai_safety_check(action)
    
    if safety_score > 0.8:
        execute_action(action)
    elif safety_score > 0.5:
        ask_for_confirmation(action)
    else:
        block_action(action, "Sicherheitsrisiko")`
          }
        ]
      },
      bestPractices: {
        title: "Best Practices & Tipps",
        practices: [
          {
            icon: CheckCircle,
            title: "Erfolgreiche Einführung",
            items: ["Start mit einfachen Aufgaben", "Regelmäßige Überprüfung", "Schrittweise Erweiterung"]
          },
          {
            icon: AlertTriangle,
            title: "Häufige Fehler",
            items: ["Zu komplexe Anfangsaufgaben", "Fehlende Überwachung", "Keine Rückmeldungen"]
          },
          {
            icon: Activity,
            title: "Optimale Nutzung",
            items: ["Klare Anweisungen geben", "Ergebnisse überprüfen", "Feedback einbauen"]
          }
        ]
      },
      technologyStack: {
        title: "Vollständiger Technologie-Stack",
        categories: [
          {
            icon: GitBranch,
            title: "CI/CD & Deployment",
            tools: ["GitHub Actions", "Docker", "Kubernetes", "Helm"]
          },
          {
            icon: TestTube,
            title: "Testing & Quality",
            tools: ["Jest", "Cypress", "k6", "SonarQube"]
          },
          {
            icon: Activity,
            title: "Monitoring & Alerting",
            tools: ["Prometheus", "Grafana", "PagerDuty", "ELK Stack"]
          },
          {
            icon: Layers,
            title: "Infrastructure",
            tools: ["Terraform", "AWS/GCP/Azure", "Vault", "Consul"]
          }
        ]
      }
    },
    en: {
      title: "AI Agents & Workflows for Tech Enthusiasts",
      subtitle: "Practical implementation, tools and strategies for productive use",
      agentArchitecture: {
        title: "How do AI Agents work?",
        description: "AI agents are intelligent systems that consist of multiple components and can perform tasks autonomously.",
        components: [
          {
            icon: Code,
            title: "Intelligent Processing",
            description: "Understands and analyzes your requests",
            details: "Uses GPT-4/Claude for natural communication"
          },
          {
            icon: Database,
            title: "Memory & Experience",
            description: "Remembers context and learns from interactions",
            details: "Stores important information for better responses"
          },
          {
            icon: Shield,
            title: "Safety & Control",
            description: "Protects against unwanted actions",
            details: "Checks all outputs for safety and relevance"
          }
        ]
      },
      workflowPatterns: {
        title: "Types of Workflows",
        description: "Different types of workflows for various use cases and complexity levels.",
        patterns: [
          {
            icon: GitBranch,
            title: "Event-Driven Workflows",
            description: "Automatically react to specific events",
            details: "E.g. Email received → Automatically categorize"
          },
          {
            icon: Activity,
            title: "Integration with Existing Tools",
            description: "Connect different applications and services",
            details: "E.g. Slack + Google Calendar + Trello"
          },
          {
            icon: Layers,
            title: "Scheduled Automations",
            description: "Execute tasks at specific times",
            details: "E.g. Daily reports, weekly analyses"
          }
        ]
      },
      implementation: {
        title: "Successful Implementation",
        description: "Step-by-step guide for successfully implementing AI agents in your daily work.",
        strategy: [
          "Start with simple tasks: Email sorting, appointment scheduling",
          "Integration with existing tools: Slack, Teams, Google Workspace",
          "Monitoring and feedback: Monitor the results",
          "Gradual expansion: Add more complex tasks"
        ]
      },
      technicalConsiderations: {
        title: "Challenges & Solutions",
        challenges: [
          {
            icon: AlertTriangle,
            title: "Speed",
            description: "Sometimes processing takes too long",
            solution: "Intelligent caching systems and local processing"
          },
          {
            icon: Activity,
            title: "Scalability",
            description: "Can get tight with high usage",
            solution: "Cloud-based solutions with automatic scaling"
          },
          {
            icon: Shield,
            title: "Data Protection",
            description: "Sensitive data must be protected",
            solution: "Encryption and local processing where possible"
          },
          {
            icon: CheckCircle,
            title: "Cost Control",
            description: "AI services can become expensive",
            solution: "Intelligent usage and cost-optimized providers"
          }
        ]
      },
      codeExamples: {
        title: "Practical Examples",
        examples: [
          {
            icon: Code,
            title: "Email Automation",
            description: "Automatic email categorization and responses",
            language: "python" as const,
            code: `# Example: Automatically categorize emails
def categorize_email(email_content):
    # AI analyzes the content
    category = ai_analyze(email_content)
    
    if category == "Support":
        auto_reply = generate_support_response(email_content)
        send_auto_reply(email, auto_reply)
    elif category == "Sales":
        forward_to_sales_team(email)
    else:
        mark_for_human_review(email)`
          },
          {
            icon: Database,
            title: "Data Analysis & Reports",
            description: "Automatic report generation from various sources",
            language: "python" as const,
            code: `# Example: Generate weekly report
def generate_weekly_report():
    # Collect data from various sources
    sales_data = get_sales_data()
    customer_feedback = get_feedback_data()
    
    # AI analyzes and creates report
    report = ai_analyze_and_summarize(sales_data, customer_feedback)
    
    # Automatically send report
    send_report_to_team(report)
    schedule_next_report()`
          },
          {
            icon: Shield,
            title: "Safety Check",
            description: "Automatic verification of content and actions",
            language: "python" as const,
            code: `# Example: Safety check for actions
def check_action_safety(action):
    # Checks if the action is safe
    safety_score = ai_safety_check(action)
    
    if safety_score > 0.8:
        execute_action(action)
    elif safety_score > 0.5:
        ask_for_confirmation(action)
    else:
        block_action(action, "Safety risk")`
          }
        ]
      },
      bestPractices: {
        title: "Best Practices & Tips",
        practices: [
          {
            icon: CheckCircle,
            title: "Successful Implementation",
            items: ["Start with simple tasks", "Regular monitoring", "Gradual expansion"]
          },
          {
            icon: AlertTriangle,
            title: "Common Mistakes",
            items: ["Too complex initial tasks", "Missing oversight", "No feedback loops"]
          },
          {
            icon: Activity,
            title: "Optimal Usage",
            items: ["Give clear instructions", "Review results", "Build in feedback"]
          }
        ]
      },
      technologyStack: {
        title: "Complete Technology Stack",
        categories: [
          {
            icon: GitBranch,
            title: "CI/CD & Deployment",
            tools: ["GitHub Actions", "Docker", "Kubernetes", "Helm"]
          },
          {
            icon: TestTube,
            title: "Testing & Quality",
            tools: ["Jest", "Cypress", "k6", "SonarQube"]
          },
          {
            icon: Activity,
            title: "Monitoring & Alerting",
            tools: ["Prometheus", "Grafana", "PagerDuty", "ELK Stack"]
          },
          {
            icon: Layers,
            title: "Infrastructure",
            tools: ["Terraform", "AWS/GCP/Azure", "Vault", "Consul"]
          }
        ]
      }
    }
  };

  const content = lang === 'de' ? beginnerContent.de : beginnerContent.en;
  const advancedContentData = lang === 'de' ? advancedContent.de : advancedContent.en;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 px-6 py-12 pt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              {lang === 'de' ? 'Mehr über Agenten & Workflows' : 'More about Agents & Workflows'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {lang === 'de' 
                ? 'Entdecken Sie die Welt der KI-Automatisierung und lernen Sie, wie Agenten und Workflows Ihr Unternehmen transformieren können.'
                : 'Discover the world of AI automation and learn how agents and workflows can transform your business.'
              }
            </p>
            <LanguageSwitcher current={lang} />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="beginner" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="beginner" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {lang === 'de' ? 'Anfänger' : 'Beginner'}
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                {lang === 'de' ? 'Fortgeschritten' : 'Advanced'}
              </TabsTrigger>
            </TabsList>

            {/* Beginner Content */}
            <TabsContent value="beginner" className="space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">{content.title}</h2>
                <p className="text-muted-foreground">{content.subtitle}</p>
              </div>

              {/* What are AI Agents */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{content.whatAreAgents.title}</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">{content.whatAreAgents.description}</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {content.whatAreAgents.examples.map((example, index) => (
                    <Card key={index} className="text-center">
                      <CardHeader>
                        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                          <example.icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{example.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{example.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* What are Workflows */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{content.whatAreWorkflows.title}</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">{content.whatAreWorkflows.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {content.whatAreWorkflows.examples.map((example, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <example.icon className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle>{example.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{example.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Benefits */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{content.benefits.title}</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {content.benefits.items.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-sm">{benefit}</p>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>

            {/* Advanced Content */}
            <TabsContent value="advanced" className="space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">{advancedContentData.title}</h2>
                <p className="text-muted-foreground">{advancedContentData.subtitle}</p>
              </div>

              {/* Agent Architecture */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{advancedContentData.agentArchitecture.title}</h3>
                  <p className="text-muted-foreground max-w-3xl mx-auto">{advancedContentData.agentArchitecture.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {advancedContentData.agentArchitecture.components.map((component, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <component.icon className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{component.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{component.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Workflow Patterns */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{advancedContentData.workflowPatterns.title}</h3>
                  <p className="text-muted-foreground max-w-3xl mx-auto">{advancedContentData.workflowPatterns.description}</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {advancedContentData.workflowPatterns.patterns.map((pattern, index) => (
                    <Card key={index} className="text-center">
                      <CardHeader>
                        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                          <pattern.icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{pattern.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Implementation */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{advancedContentData.implementation.title}</h3>
                  <p className="text-muted-foreground max-w-3xl mx-auto">{advancedContentData.implementation.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {advancedContentData.implementation.strategy.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Settings className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Technical Considerations */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{advancedContentData.technicalConsiderations.title}</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {advancedContentData.technicalConsiderations.challenges.map((challenge, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <challenge.icon className="w-6 h-6 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-2">{challenge.description}</p>
                        <p className="text-sm text-primary font-medium">{challenge.solution}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Code Examples */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{advancedContentData.codeExamples.title}</h3>
                </div>
                
                <div className="grid md:grid-cols-1 gap-6">
                  {advancedContentData.codeExamples.examples.map((example, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <example.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{example.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{example.description}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CodeHighlight 
                          code={example.code} 
                          language={example.language} 
                          className="mt-4"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Best Practices */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{advancedContentData.bestPractices.title}</h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {advancedContentData.bestPractices.practices.map((practice, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <practice.icon className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{practice.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {practice.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Technology Stack */}
              <section className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">{advancedContentData.technologyStack.title}</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {advancedContentData.technologyStack.categories.map((category, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <category.icon className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{category.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {category.tools.map((tool, toolIndex) => (
                            <span key={toolIndex} className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <div className="text-center py-20 px-8 md:px-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl mt-20">
            <div className="space-y-8 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground">
                {lang === 'de' ? 'Bereit für den nächsten Schritt?' : 'Ready for the next step?'}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {lang === 'de' 
                  ? 'Analysieren Sie Ihre Aufgaben und entdecken Sie, welche Agenten und Workflows für Ihr Unternehmen geeignet sind.'
                  : 'Analyze your tasks and discover which agents and workflows are suitable for your business.'
                }
              </p>
              <Button
                onClick={() => navigate('/')}
                size="lg"
                className="px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200"
              >
                {lang === 'de' ? 'Jetzt analysieren' : 'Analyze now'}
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
};

export default AgentsWorkflows;
