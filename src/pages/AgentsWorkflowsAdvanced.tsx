import React from "react";
import Header from "@/components/Header";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CodeHighlight from "@/components/CodeHighlight";
import { useSearchParams } from "react-router-dom";
import { resolveLang, t } from "@/lib/i18n/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Sparkles, 
  Code, 
  Database, 
  Shield, 
  GitBranch, 
  TestTube, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Layers 
} from "lucide-react";

const AgentsWorkflowsAdvanced: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams);

  const content = {
    de: {
      title: "KI-Agenten & Workflows für Entwickler & Architekten",
      subtitle: "Technische Implementierung, Architektur-Patterns und Best Practices",
      agentArchitecture: {
        title: "Agent-Architektur",
        description: "Moderne KI-Agenten basieren auf einer mehrschichtigen Architektur mit Reasoning Engine, Memory System und Safety Layer.",
        components: [
          {
            icon: Code,
            title: "Reasoning Engine",
            description: "LLM + RAG für intelligente Entscheidungen",
            details: "GPT-4/Claude + Vector DB für Kontextverständnis"
          },
          {
            icon: Database,
            title: "Memory System",
            description: "Langzeitgedächtnis und Erfahrungsspeicher",
            details: "Pinecone/Weaviate + Redis für Session-Management"
          },
          {
            icon: Shield,
            title: "Safety Layer",
            description: "Guardrails und Validierung",
            details: "Pydantic + Custom Rules für Sicherheit"
          }
        ]
      },
      workflowPatterns: {
        title: "Workflow-Patterns",
        description: "Enterprise-Workflows folgen bewährten Architektur-Patterns für Skalierbarkeit und Wartbarkeit.",
        patterns: [
          {
            icon: GitBranch,
            title: "Event-Driven Architecture",
            description: "Lose Kopplung durch Event-Bus",
            details: "Apache Kafka + Event Sourcing"
          },
          {
            icon: Activity,
            title: "Microservices Integration",
            description: "API-First Ansatz mit Service Mesh",
            details: "Docker/Kubernetes + Istio"
          },
          {
            icon: Layers,
            title: "Scheduled Orchestration",
            description: "Komplexe Workflows mit Airflow",
            details: "Apache Airflow + DAGs"
          }
        ]
      },
      implementation: {
        title: "Implementierungsstrategie",
        description: "Systematischer Ansatz für erfolgreiche Agent-Implementierung mit messbarem ROI.",
        strategy: [
          "ROI: 300-500% nach 6 Monaten",
          "API-First: REST/GraphQL Interfaces",
          "Observability: Prometheus + Grafana",
          "Testing: Jest + Cypress + k6"
        ]
      },
      technicalConsiderations: {
        title: "Technische Herausforderungen & Lösungen",
        challenges: [
          {
            icon: AlertTriangle,
            title: "Latency",
            description: "LLM-Response-Zeiten optimieren",
            solution: "Edge Computing + Caching"
          },
          {
            icon: Activity,
            title: "Scalability",
            description: "Hohe Last bewältigen",
            solution: "Database Sharding + Load Balancing"
          },
          {
            icon: Shield,
            title: "Security",
            description: "Daten und APIs schützen",
            solution: "Zero-Trust Architecture + OAuth2"
          },
          {
            icon: CheckCircle,
            title: "Cost Optimization",
            description: "Infrastructure-Kosten minimieren",
            solution: "Serverless Functions + Spot Instances"
          }
        ]
      },
      codeExamples: {
        title: "Code-Beispiele & Implementierung",
        examples: [
          {
            icon: Code,
            title: "Agent Setup (Python)",
            description: "Grundlegende Agent-Implementierung mit LangChain und OpenAI",
            language: "python" as const,
            code: `from langchain.agents import initialize_agent
from langchain.llms import OpenAI
from langchain.tools import Tool

# Agent mit Tools initialisieren
agent = initialize_agent(
    tools=[email_tool, calendar_tool],
    llm=OpenAI(temperature=0),
    agent="zero-shot-react-description",
    verbose=True
)`
          },
          {
            icon: Database,
            title: "Vector DB Integration",
            description: "Pinecone Integration für Langzeitgedächtnis",
            language: "python" as const,
            code: `import pinecone
from sentence_transformers import SentenceTransformer

# Pinecone Setup
pinecone.init(api_key="your-key", environment="us-west1-gcp")
index = pinecone.Index("agent-memory")

# Embedding und Speicherung
encoder = SentenceTransformer('all-MiniLM-L6-v2')
vector = encoder.encode("User query").tolist()
index.upsert([("id", vector, {"text": "User query"})])`
          },
          {
            icon: Shield,
            title: "Safety Guardrails",
            description: "Input/Output Validation mit Pydantic",
            language: "python" as const,
            code: `from pydantic import BaseModel, validator
from typing import List

class AgentResponse(BaseModel):
    content: str
    confidence: float
    safety_score: float
    
    @validator('content')
    def check_content_safety(cls, v):
        if any(word in v.lower() for word in ['hack', 'exploit']):
            raise ValueError('Potentially unsafe content')
        return v`
          }
        ]
      },
      bestPractices: {
        title: "Best Practices & Anti-Patterns",
        practices: [
          {
            icon: CheckCircle,
            title: "Performance Optimization",
            items: ["Connection Pooling", "Async/Await Patterns", "Caching Strategy"]
          },
          {
            icon: AlertTriangle,
            title: "Common Anti-Patterns",
            items: ["Monolithic Agents", "Hard-coded Prompts", "No Error Handling"]
          },
          {
            icon: Activity,
            title: "Monitoring & Observability",
            items: ["Distributed Tracing", "Custom Metrics", "Alert Rules"]
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
      title: "AI Agents & Workflows for Developers & Architects",
      subtitle: "Technical implementation, architecture patterns and best practices",
      agentArchitecture: {
        title: "Agent Architecture",
        description: "Modern AI agents are based on a multi-layered architecture with reasoning engine, memory system and safety layer.",
        components: [
          {
            icon: Code,
            title: "Reasoning Engine",
            description: "LLM + RAG for intelligent decisions",
            details: "GPT-4/Claude + Vector DB for context understanding"
          },
          {
            icon: Database,
            title: "Memory System",
            description: "Long-term memory and experience storage",
            details: "Pinecone/Weaviate + Redis for session management"
          },
          {
            icon: Shield,
            title: "Safety Layer",
            description: "Guardrails and validation",
            details: "Pydantic + Custom Rules for security"
          }
        ]
      },
      workflowPatterns: {
        title: "Workflow Patterns",
        description: "Enterprise workflows follow proven architecture patterns for scalability and maintainability.",
        patterns: [
          {
            icon: GitBranch,
            title: "Event-Driven Architecture",
            description: "Loose coupling through event bus",
            details: "Apache Kafka + Event Sourcing"
          },
          {
            icon: Activity,
            title: "Microservices Integration",
            description: "API-First approach with service mesh",
            details: "Docker/Kubernetes + Istio"
          },
          {
            icon: Layers,
            title: "Scheduled Orchestration",
            description: "Complex workflows with Airflow",
            details: "Apache Airflow + DAGs"
          }
        ]
      },
      implementation: {
        title: "Implementation Strategy",
        description: "Systematic approach for successful agent implementation with measurable ROI.",
        strategy: [
          "ROI: 300-500% after 6 months",
          "API-First: REST/GraphQL Interfaces",
          "Observability: Prometheus + Grafana",
          "Testing: Jest + Cypress + k6"
        ]
      },
      technicalConsiderations: {
        title: "Technical Challenges & Solutions",
        challenges: [
          {
            icon: AlertTriangle,
            title: "Latency",
            description: "Optimize LLM response times",
            solution: "Edge Computing + Caching"
          },
          {
            icon: Activity,
            title: "Scalability",
            description: "Handle high load",
            solution: "Database Sharding + Load Balancing"
          },
          {
            icon: Shield,
            title: "Security",
            description: "Protect data and APIs",
            solution: "Zero-Trust Architecture + OAuth2"
          },
          {
            icon: CheckCircle,
            title: "Cost Optimization",
            description: "Minimize infrastructure costs",
            solution: "Serverless Functions + Spot Instances"
          }
        ]
      },
      codeExamples: {
        title: "Code Examples & Implementation",
        examples: [
          {
            icon: Code,
            title: "Agent Setup (Python)",
            description: "Basic agent implementation with LangChain and OpenAI",
            language: "python" as const,
            code: `from langchain.agents import initialize_agent
from langchain.llms import OpenAI
from langchain.tools import Tool

# Initialize agent with tools
agent = initialize_agent(
    tools=[email_tool, calendar_tool],
    llm=OpenAI(temperature=0),
    agent="zero-shot-react-description",
    verbose=True
)`
          },
          {
            icon: Database,
            title: "Vector DB Integration",
            description: "Pinecone integration for long-term memory",
            language: "python" as const,
            code: `import pinecone
from sentence_transformers import SentenceTransformer

# Pinecone setup
pinecone.init(api_key="your-key", environment="us-west1-gcp")
index = pinecone.Index("agent-memory")

# Embedding and storage
encoder = SentenceTransformer('all-MiniLM-L6-v2')
vector = encoder.encode("User query").tolist()
index.upsert([("id", vector, {"text": "User query"})])`
          },
          {
            icon: Shield,
            title: "Safety Guardrails",
            description: "Input/Output validation with Pydantic",
            language: "python" as const,
            code: `from pydantic import BaseModel, validator
from typing import List

class AgentResponse(BaseModel):
    content: str
    confidence: float
    safety_score: float
    
    @validator('content')
    def check_content_safety(cls, v):
        if any(word in v.lower() for word in ['hack', 'exploit']):
            raise ValueError('Potentially unsafe content')
        return v`
          }
        ]
      },
      bestPractices: {
        title: "Best Practices & Anti-Patterns",
        practices: [
          {
            icon: CheckCircle,
            title: "Performance Optimization",
            items: ["Connection Pooling", "Async/Await Patterns", "Caching Strategy"]
          },
          {
            icon: AlertTriangle,
            title: "Common Anti-Patterns",
            items: ["Monolithic Agents", "Hard-coded Prompts", "No Error Handling"]
          },
          {
            icon: Activity,
            title: "Monitoring & Observability",
            items: ["Distributed Tracing", "Custom Metrics", "Alert Rules"]
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

  const t = (lang: string, key: string) => {
    const keys = key.split('.');
    let value: any = content[lang as keyof typeof content];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <LanguageSwitcher current={lang} />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t(lang, 'title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t(lang, 'subtitle')}
          </p>
        </div>

        {/* Agent Architecture */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'agentArchitecture.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {t(lang, 'agentArchitecture.description')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {t(lang, 'agentArchitecture.components').map((component: any, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <component.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{component.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">{component.description}</p>
                  <p className="text-sm text-primary font-medium">{component.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Workflow Patterns */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'workflowPatterns.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {t(lang, 'workflowPatterns.description')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {t(lang, 'workflowPatterns.patterns').map((pattern: any, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <pattern.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{pattern.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">{pattern.description}</p>
                  <p className="text-sm text-primary font-medium">{pattern.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Implementation Strategy */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'implementation.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {t(lang, 'implementation.description')}
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {t(lang, 'implementation.strategy').map((item: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p className="text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Considerations */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'technicalConsiderations.title')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {t(lang, 'technicalConsiderations.challenges').map((challenge: any, index: number) => (
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
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'codeExamples.title')}
          </h2>
          
          <div className="grid md:grid-cols-1 gap-6">
            {t(lang, 'codeExamples.examples').map((example: any, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <example.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{example.title}</CardTitle>
                  </div>
                  <p className="text-muted-foreground">{example.description}</p>
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
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'bestPractices.title')}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {t(lang, 'bestPractices.practices').map((practice: any, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <practice.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{practice.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {practice.items.map((item: string, itemIndex: number) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'technologyStack.title')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {t(lang, 'technologyStack.categories').map((category: any, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {category.tools.map((tool: string, toolIndex: number) => (
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

        {/* CTA */}
        <div className="text-center py-20 px-8 md:px-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl mt-20">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {lang === 'de' ? 'Bereit für den nächsten Schritt?' : 'Ready for the next step?'}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            {lang === 'de' 
              ? 'Analysieren Sie Ihre Aufgaben und entdecken Sie Automatisierungspotenziale.' 
              : 'Analyze your tasks and discover automation potential.'}
          </p>
          <Button 
            size="lg" 
            className="hover:scale-105 transition-transform"
            onClick={() => window.location.href = '/'}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {lang === 'de' ? 'Jetzt analysieren' : 'Analyze now'}
          </Button>
        </div>
      </main>

      <PageFooter />
    </div>
  );
};

export default AgentsWorkflowsAdvanced;
