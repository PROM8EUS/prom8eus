import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { callAnalyzeInput } from "@/lib/supabase";
import { extractJobTextFromUrl } from "@/lib/extractJobText";
import LoadingPage from "./LoadingPage";
import AnalysisHistory from "./AnalysisHistory";
import { DebugModal } from "./DebugModal";
import { AlertTriangle, Bug } from "lucide-react";
import { t } from "@/lib/i18n/i18n";

interface MainContentProps {
  buttonText: string;
  headline: string;
  subtitle: string;
  lang: "de" | "en";
}

const MainContent = ({ buttonText, headline, subtitle, lang }: MainContentProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugData, setDebugData] = useState<{
    rawText: string;
    url: string;
    textLength: number;
    wasRendered?: boolean;
    fromCache?: boolean;
    cacheDate?: string;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(45, Math.min(textarea.scrollHeight, 400));
      textarea.style.height = newHeight + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // URL validation regex
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  const isUrl = urlRegex.test(input.trim());
  const hasInput = input.trim() !== "";

  const handleAnalyze = async () => {
    if (!hasInput) return;
    
    setIsLoading(true);
    setAnalysisError(null);
    setDebugData(null);
    
    try {
      console.log('Starting analysis for input:', input.substring(0, 100));
      
      let analysisInput = input.trim();
      let extractedJobText = null;
      
      // If it's a URL, try to extract job text first
      if (isUrl) {
        try {
          console.log('Extracting job text from URL...');
          extractedJobText = await extractJobTextFromUrl(input.trim());
          const composedText = extractedJobText.composeJobText();
          
          // Store debug data
          setDebugData({
            rawText: composedText,
            url: input.trim(),
            textLength: composedText.length,
            wasRendered: false, // This would come from the scraper response
            fromCache: extractedJobText.fromCache,
            cacheDate: extractedJobText.cacheDate
          });
          
          // Check if extracted text is sufficient
          if (composedText.length < 500) {
            setAnalysisError(
              `${t(lang, "page_not_readable")} (nur ${composedText.length} Zeichen extrahiert). ` +
              t(lang, "paste_manually")
            );
            setIsLoading(false);
            return;
          }
          
          analysisInput = composedText;
          console.log(`Job text extracted successfully: ${composedText.length} characters`);
        } catch (extractError) {
          console.error('Job text extraction failed:', extractError);
          setAnalysisError(
            `${t(lang, "page_not_readable")}. ${t(lang, "paste_manually")}`
          );
          setIsLoading(false);
          return;
        }
      }
      
      const result = await callAnalyzeInput(
        isUrl && extractedJobText
          ? { rawText: analysisInput }
          : isUrl 
            ? { url: input.trim() }
            : { rawText: analysisInput }
      );
      
      if (result.success && result.data) {
        console.log('Analysis successful, navigating to results');
        console.log('Analysis result structure:', result.data);
        
        // Handle both old and new data structures
        let analysisData;
        const data = result.data as any; // Type assertion to handle both formats
        
        if (data.totalScore !== undefined) {
          // New enhanced structure
          analysisData = {
            totalScore: data.totalScore,
            ratio: data.ratio,
            tasks: data.tasks,
            summary: data.summary,
            recommendations: data.recommendations,
            automationTrends: data.automationTrends,
            originalText: data.originalText
          };
        } else {
          // Old structure - transform to new format
          const automationScore = data.automationScore || 0;
          const automatedTasks = data.automatedTasks || [];
          const manualTasks = data.manualTasks || [];
          
          // Convert old task arrays to new task objects
          const tasks = [
            ...automatedTasks.map((task: string, index: number) => ({
              text: task,
              score: Math.min(100, automationScore + Math.random() * 20),
              label: "Automatisierbar" as const,
              category: "automatisierbar",
              confidence: 80,
              complexity: "medium" as const,
              automationTrend: "increasing" as const
            })),
            ...manualTasks.map((task: string, index: number) => ({
              text: task,
              score: Math.max(0, 50 - Math.random() * 30),
              label: "Mensch" as const,
              category: "mensch", 
              confidence: 70,
              complexity: "medium" as const,
              automationTrend: "stable" as const
            }))
          ];
          
          analysisData = {
            totalScore: automationScore,
            ratio: {
              automatisierbar: Math.round((automatedTasks.length / (automatedTasks.length + manualTasks.length)) * 100),
              mensch: Math.round((manualTasks.length / (automatedTasks.length + manualTasks.length)) * 100)
            },
            tasks: tasks,
            summary: data.summary || `Analyse mit ${automationScore}% Automatisierungspotenzial`,
            recommendations: data.recommendations || [],
            automationTrends: {
              highPotential: automatedTasks.slice(0, 3),
              mediumPotential: [],
              lowPotential: manualTasks.slice(0, 3)
            },
            originalText: data.originalText
          };
        }
        
        // Store the normalized data structure
        sessionStorage.setItem('analysisResult', JSON.stringify(analysisData));
        
        // Save to history
        saveToHistory(analysisData, analysisInput);
        
        if (debugData) {
          sessionStorage.setItem('debugData', JSON.stringify(debugData));
        }
        // Navigate to results and scroll to top
        navigate('/results');
        // The scroll to top will be handled in the Results component
      } else {
        console.error('Analysis failed:', result.error);
        setAnalysisError(result.error || t(lang, "analysis_error"));
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      setAnalysisError(t(lang, "connection_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = (analysisData: any, originalInput: string) => {
    try {
      const historyId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract job title
      let jobTitle = "Analyse";
      if (analysisData.originalText) {
        const lines = analysisData.originalText.split('\n');
        const firstLine = lines[0]?.trim();
        if (firstLine && firstLine.length > 5 && firstLine.length < 60 && !firstLine.includes('http')) {
          jobTitle = firstLine;
        }
      } else if (originalInput.length > 0 && originalInput.length < 60 && !originalInput.includes('http')) {
        jobTitle = originalInput;
      }

      // Create history item
      const historyItem = {
        id: historyId,
        timestamp: Date.now(),
        score: analysisData.totalScore,
        jobTitle: jobTitle,
        taskCount: analysisData.tasks?.length || 0,
        summary: analysisData.summary
      };

      // Save full analysis data
      localStorage.setItem(historyId, JSON.stringify(analysisData));

      // Update history list
      const existingHistory = localStorage.getItem('analysisHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.unshift(historyItem); // Add to beginning
      
      // Keep only last 10 analyses
      const trimmedHistory = history.slice(0, 10);
      localStorage.setItem('analysisHistory', JSON.stringify(trimmedHistory));

    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const getExampleJobs = (lang: "de" | "en") => {
    if (lang === 'de') {
      return [
        {
          title: "Marketing Manager",
          preview: "Entwicklung von Marketingstrategien...",
          content: `Marketing Manager

AUFGABEN:
• Entwicklung und Umsetzung von Marketingstrategien
• Koordination von Werbekampagnen
• Analyse von Markttrends und Kundenverhalten
• Budgetplanung und -kontrolle
• Betreuung von Social Media Kanälen
• Organisation von Events und Messen
• Zusammenarbeit mit externen Agenturen
• Erstellung von Präsentationen und Reports

ANFORDERUNGEN:
• Abgeschlossenes Studium im Bereich Marketing oder BWL
• 3-5 Jahre Berufserfahrung im Marketing
• Kreativität und analytisches Denken
• Sehr gute Kommunikationsfähigkeiten
• Sicherer Umgang mit MS Office und Marketing-Tools`
        },
        {
          title: "Software Entwickler",
          preview: "Programmierung von Webanwendungen...",
          content: `Software Entwickler (m/w/d)

AUFGABEN:
• Entwicklung von Webanwendungen mit React und Node.js
• Code-Reviews und Testing
• Datenbankdesign und -optimierung
• API-Entwicklung und Integration
• Debugging und Fehlerbehebung
• Dokumentation von Software-Komponenten
• Zusammenarbeit im agilen Entwicklungsteam
• Pflege bestehender Systeme

ANFORDERUNGEN:
• Studium der Informatik oder vergleichbare Qualifikation
• Erfahrung mit JavaScript, React, Node.js
• Kenntnisse in SQL und NoSQL Datenbanken
• Git-Versionskontrolle
• Problemlösungsorientiertes Denken`
        },
        {
          title: "Kundenservice",
          preview: "Bearbeitung von Kundenanfragen...",
          content: `Kundenservice Mitarbeiter

AUFGABEN:
• Telefonische Beratung von Kunden
• Bearbeitung von E-Mail-Anfragen
• Reklamationsbearbeitung
• Auftragserfassung im System
• Produktberatung und Verkauf
• Terminvereinbarung für Außendienst
• Dokumentation von Kundenkontakten
• Unterstützung bei Messen und Events

ANFORDERUNGEN:
• Kaufmännische Ausbildung oder Studium
• Freundliches und professionelles Auftreten
• Kommunikationsstärke am Telefon
• Geduld im Umgang mit Kunden
• PC-Kenntnisse und CRM-Erfahrung`
        },
        {
          title: "Buchhalter",
          preview: "Führung der Finanzbuchhaltung...",
          content: `Buchhalter (m/w/d)

AUFGABEN:
• Führung der Finanzbuchhaltung
• Erstellung von Monats- und Jahresabschlüssen
• Kontierung von Belegen
• Umsatzsteuervoranmeldungen
• Mahnwesen und Zahlungsverkehr
• Abstimmung von Konten
• Zusammenarbeit mit Steuerberatern
• Budgetplanung und Controlling

ANFORDERUNGEN:
• Ausbildung als Steuerfachangestellte/r oder Buchhalter/in
• Mehrjährige Berufserfahrung in der Buchhaltung
• Kenntnisse in DATEV oder vergleichbarer Software
• Genauigkeit und Zuverlässigkeit
• Steuerrechtliche Kenntnisse`
        },
        {
          title: "HR Manager",
          preview: "Personalplanung und Recruiting...",
          content: `HR Manager (m/w/d)

AUFGABEN:
• Personalplanung und -entwicklung
• Recruiting und Bewerbermanagement
• Führung von Mitarbeitergesprächen
• Erstellung von Arbeitsverträgen
• Gehaltsabrechnung und Benefits-Management
• Konfliktlösung und Mediation
• Schulungsplanung und Weiterbildung
• Compliance und Arbeitsrecht

ANFORDERUNGEN:
• Studium der Betriebswirtschaft oder Psychologie
• Erfahrung im Personalwesen
• Sehr gute Menschenkenntnis
• Empathie und Kommunikationsstärke
• Kenntnisse im Arbeitsrecht`
        },
        {
          title: "Data Scientist",
          preview: "Datenanalyse und Machine Learning...",
          content: `Data Scientist (m/w/d)

AUFGABEN:
• Datensammlung und -aufbereitung
• Statistische Analysen und Modellierung
• Entwicklung von Machine Learning Algorithmen
• Erstellung von Dashboards und Berichten
• Datenvisualisierung und Präsentation
• A/B Testing und Experimente
• Automatisierung von Analyseprozessen
• Zusammenarbeit mit Fachbereichen

ANFORDERUNGEN:
• Studium in Mathematik, Statistik oder Informatik
• Erfahrung mit Python, R und SQL
• Kenntnisse in Machine Learning
• Analytisches Denken
• Präsentationsfähigkeiten`
        }
      ];
    } else {
      return [
        {
          title: "Marketing Manager",
          preview: "Develop marketing strategies...",
          content: `Marketing Manager

RESPONSIBILITIES:
• Develop and implement marketing strategies
• Coordinate advertising campaigns
• Analyze market trends and customer behavior
• Budget planning and control
• Manage social media channels
• Organize events and trade shows
• Collaborate with external agencies
• Create presentations and reports

QUALIFICATIONS:
• Bachelor's degree in Marketing or Business Administration
• 3-5 years of marketing experience
• Creativity and analytical thinking
• Excellent communication skills
• Proficiency in MS Office and marketing tools`
        },
        {
          title: "Software Developer",
          preview: "Develop web applications...",
          content: `Software Developer

RESPONSIBILITIES:
• Develop web applications using React and Node.js
• Code reviews and testing
• Database design and optimization
• API development and integration
• Debugging and troubleshooting
• Document software components
• Work in agile development teams
• Maintain existing systems

QUALIFICATIONS:
• Computer Science degree or equivalent
• Experience with JavaScript, React, Node.js
• Knowledge of SQL and NoSQL databases
• Git version control
• Problem-solving mindset`
        },
        {
          title: "Customer Service",
          preview: "Handle customer inquiries...",
          content: `Customer Service Representative

RESPONSIBILITIES:
• Phone customer consultation
• Handle email inquiries
• Process complaints
• Order entry in system
• Product consulting and sales
• Schedule appointments for field service
• Document customer interactions
• Support at trade shows and events

QUALIFICATIONS:
• Commercial training or degree
• Friendly and professional demeanor
• Strong phone communication skills
• Patience in customer interactions
• PC skills and CRM experience`
        },
        {
          title: "Accountant",
          preview: "Maintain financial records...",
          content: `Accountant

RESPONSIBILITIES:
• Maintain financial accounting records
• Prepare monthly and annual financial statements
• Account for receipts and invoices
• VAT returns
• Accounts receivable and payment processing
• Reconcile accounts
• Collaborate with tax consultants
• Budget planning and controlling

QUALIFICATIONS:
• Training as tax specialist or accountant
• Several years of accounting experience
• Knowledge of accounting software
• Accuracy and reliability
• Tax law knowledge`
        },
        {
          title: "HR Manager",
          preview: "Manage human resources...",
          content: `HR Manager

RESPONSIBILITIES:
• Human resource planning and development
• Recruiting and applicant management
• Conduct employee interviews
• Create employment contracts
• Payroll processing and benefits management
• Conflict resolution and mediation
• Training planning and continuing education
• Compliance and labor law

QUALIFICATIONS:
• Business Administration or Psychology degree
• Human resources experience
• Excellent people skills
• Empathy and communication skills
• Knowledge of labor law`
        },
        {
          title: "Data Scientist",
          preview: "Analyze data and build models...",
          content: `Data Scientist

RESPONSIBILITIES:
• Data collection and preparation
• Statistical analysis and modeling
• Develop machine learning algorithms
• Create dashboards and reports
• Data visualization and presentation
• A/B testing and experiments
• Automate analysis processes
• Collaborate with business units

QUALIFICATIONS:
• Degree in Mathematics, Statistics or Computer Science
• Experience with Python, R and SQL
• Machine learning knowledge
• Analytical thinking
• Presentation skills`
        }
      ];
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (hasInput && !isLoading) {
        handleAnalyze();
      }
    }
  };

  const showDebugModal = () => {
    if (debugData) {
      setDebugModalOpen(true);
    }
  };

  // Show loading page when analyzing
  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <main className="min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="w-full max-w-4xl mx-auto text-center space-y-16">
          {/* Title and Subtitle */}
          <div className="space-y-12">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight break-words hyphens-auto">
              {headline}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-8">
            {/* Combined Input Field */}
            <div className="relative max-w-2xl mx-auto">
              <Textarea
                ref={textareaRef}
                placeholder={t(lang, "placeholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[45px] text-lg resize-none focus:ring-2 focus:ring-primary/20 border-2 hover:border-primary/30 transition-colors overflow-hidden"
                rows={1}
                autoFocus
              />
              {isUrl && hasInput && !analysisError && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                    {t(lang, "url_detected")}
                  </span>
                </div>
              )}
            </div>

            {/* Example Job Positions */}
            {!hasInput && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {lang === 'de' ? 'Oder wähle ein Beispiel:' : 'Or choose an example:'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
                  {getExampleJobs(lang).map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-auto p-3 text-left justify-start hover:border-primary/50 transition-colors"
                      onClick={() => setInput(example.content)}
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{example.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{example.preview}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {analysisError && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-left">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p>{analysisError}</p>
                    {debugData && (
                      <Button 
                        onClick={showDebugModal} 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                      >
                        <Bug className="h-4 w-4 mr-2" />
                        {t(lang, "show_debug")}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  <p><strong>{t(lang, "tip")}</strong> {t(lang, "paste_text_tip")}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!hasInput}
              size="lg"
              className="px-16 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200 disabled:hover:scale-100 shadow-lg"
            >
              {buttonText}
            </Button>

            {/* Debug button for successful extractions */}
            {debugData && !analysisError && (
              <Button 
                onClick={showDebugModal} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <Bug className="h-4 w-4 mr-2" />
                {t(lang, "show_debug")}
              </Button>
            )}
          </div>

          {/* Features hint */}
          <div className="text-sm text-muted-foreground max-w-lg mx-auto">
            {isUrl && hasInput && !analysisError ? 
              t(lang, "url_detected_hint") : 
              t(lang, "ai_hint")
            }
          </div>
        </div>
      </main>

      <DebugModal
        isOpen={debugModalOpen}
        onClose={() => setDebugModalOpen(false)}
        rawText={debugData?.rawText || ''}
        url={debugData?.url || ''}
        textLength={debugData?.textLength || 0}
        wasRendered={debugData?.wasRendered}
        fromCache={debugData?.fromCache}
        cacheDate={debugData?.cacheDate}
      />

      {/* Analysis History */}
      <AnalysisHistory lang={lang} />
    </>
  );
};

export default MainContent;