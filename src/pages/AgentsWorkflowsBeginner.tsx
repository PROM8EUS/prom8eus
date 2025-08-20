import React, { useState } from "react";
import Header from "@/components/Header";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useSearchParams } from "react-router-dom";
import { resolveLang, t } from "@/lib/i18n/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Clock, Zap, Target, Lightbulb } from "lucide-react";

const AgentsWorkflowsBeginner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams);

  const content = {
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
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t(lang, 'title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t(lang, 'subtitle')}
          </p>
        </div>

        {/* What are AI Agents */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'whatAreAgents.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {t(lang, 'whatAreAgents.description')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {t(lang, 'whatAreAgents.examples').map((example: any, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <example.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{example.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{example.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What are Workflows */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'whatAreWorkflows.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {t(lang, 'whatAreWorkflows.description')}
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {t(lang, 'whatAreWorkflows.examples').map((example: any, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <example.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{example.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{example.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {t(lang, 'benefits.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {t(lang, 'benefits.items').map((item: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-1 bg-green-100 rounded-full mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <p className="text-muted-foreground">{item}</p>
              </div>
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

export default AgentsWorkflowsBeginner;
