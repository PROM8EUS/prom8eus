import { Button } from "@/components/ui/button";
import { Share2, BookOpen, Bot, User, Target, Zap, Rocket, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ScoreCircle from "@/components/ScoreCircle";
import InfoCard from "@/components/InfoCard";
import TaskList from "@/components/TaskList";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Header from "@/components/Header";

import ShareModal from "@/components/ShareModal";
import PageFooter from "@/components/PageFooter";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { resolveLang, t, translateCategory } from "@/lib/i18n/i18n";

interface AnalysisTask {
  text: string;
  score: number;
  label: "Automatisierbar" | "Mensch";
  category: string;
  confidence: number;
}

interface AnalysisResult {
  totalScore: number;
  ratio: {
    automatisierbar: number;
    mensch: number;
  };
  tasks: AnalysisTask[];
  summary: string;
  recommendations: string[];
  originalText?: string;
}

interface TaskForDisplay {
  id: string;
  name: string;
  score: number;
  category: 'automatisierbar' | 'mensch';
  description: string;
  complexity?: 'low' | 'medium' | 'high';
  automationTrend?: 'increasing' | 'stable' | 'decreasing';
}

// Fallback mock data
const mockTasks: TaskForDisplay[] = [
  {
    id: '1',
    name: 'Datenerfassung und -eingabe',
    score: 95,
    category: 'automatisierbar' as const,
    description: 'Strukturierte Dateneingabe in Systeme'
  },
  {
    id: '2',
    name: 'Berichtserstellung',
    score: 88,
    category: 'automatisierbar' as const,
    description: 'Automatische Generierung von Standardberichten'
  },
  {
    id: '3',
    name: 'Terminplanung',
    score: 82,
    category: 'automatisierbar' as const,
    description: 'Koordination und Verwaltung von Terminen'
  },
  {
    id: '4',
    name: 'Kundenberatung',
    score: 35,
    category: 'mensch' as const,
    description: 'Persönliche Beratung und Problemlösung'
  }
];

const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [displayTasks, setDisplayTasks] = useState<TaskForDisplay[]>(mockTasks);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isSharedView, setIsSharedView] = useState(false);
  const [jobTitle, setJobTitle] = useState("");

  // Generate unique share URL for this analysis
  const generateShareUrl = (data: AnalysisResult) => {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store analysis data in localStorage with the unique ID
    localStorage.setItem(analysisId, JSON.stringify(data));
    
    // Generate shareable URL with current page
    const baseUrl = window.location.origin;
    return `${baseUrl}/results?share=${analysisId}&lang=${lang}`;
  };

  useEffect(() => {
    // Smooth scroll to top when component mounts (only on initial load)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Check if this is a shared view
    const shareId = searchParams.get("share");
    if (shareId) {
      setIsSharedView(true);
      
      // Try to load shared analysis from localStorage
      try {
        const sharedData = localStorage.getItem(shareId);
        if (sharedData) {
          const parsedResult: AnalysisResult = JSON.parse(sharedData);
          setAnalysisData(parsedResult);
          
          // Extract job title from original text
          if (parsedResult.originalText) {
            const lines = parsedResult.originalText.split('\n');
            const firstLine = lines[0].trim();
            setJobTitle(firstLine);
          }
          
          // Transform tasks
          if (parsedResult.tasks && parsedResult.tasks.length > 0) {
            const transformedTasks: TaskForDisplay[] = parsedResult.tasks.map((task, index) => ({
              id: String(index + 1),
              name: task.text.length > 60 ? task.text.substring(0, 60) + '...' : task.text,
              score: Math.round(task.score),
              category: task.label === 'Automatisierbar' ? 'automatisierbar' : 'mensch',
              description: `${translateCategory(lang, task.category)} (${t(lang, 'task_confidence')}: ${Math.round(task.confidence)}%)`,
              complexity: task.complexity,
              automationTrend: task.automationTrend
            }));
            setDisplayTasks(transformedTasks);
          }
        }
      } catch (error) {
        console.error('Error loading shared analysis:', error);
      }
    } else {
      // Try to load real analysis results from sessionStorage
      try {
        const storedResult = sessionStorage.getItem('analysisResult');
        console.log('Stored analysis result:', storedResult);
        
        if (storedResult) {
          const parsedResult: AnalysisResult = JSON.parse(storedResult);
          console.log('Parsed analysis result:', parsedResult);
          setAnalysisData(parsedResult);

          // Extract job title from original text
          if (parsedResult.originalText) {
            const lines = parsedResult.originalText.split('\n');
            const firstLine = lines[0].trim();
            setJobTitle(firstLine);
          }

          // Transform backend tasks to display format
          if (parsedResult.tasks && parsedResult.tasks.length > 0) {
            const transformedTasks: TaskForDisplay[] = parsedResult.tasks.map((task, index) => ({
              id: String(index + 1),
              name: task.text.length > 60 ? task.text.substring(0, 60) + '...' : task.text,
              score: Math.round(task.score),
              category: task.label === 'Automatisierbar' ? 'automatisierbar' : 'mensch',
              description: `${translateCategory(lang, task.category)} (${t(lang, 'task_confidence')}: ${Math.round(task.confidence)}%)`,
              complexity: task.complexity,
              automationTrend: task.automationTrend
            }));
            
            console.log('Transformed tasks:', transformedTasks);
            setDisplayTasks(transformedTasks);
            
            // Generate share URL
            setShareUrl(generateShareUrl(parsedResult));
            
            // Smooth scroll to top after data is loaded (only on initial load)
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
          }
        } else {
          console.log('No stored analysis result found, using mock data');
        }
      } catch (error) {
        console.error('Error loading analysis results:', error);
        // Keep using mock data as fallback
      }
    }
  }, [searchParams]); // Add searchParams dependency to detect share links
  
  // Additional effect to ensure smooth scroll after component is fully rendered (only on initial load)
  useEffect(() => {
    if (analysisData) {
      // Small delay to ensure all content is rendered
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, []); // Only run once on mount, not when analysisData changes
  
  // Update task descriptions when language changes (without scrolling)
  useEffect(() => {
    if (analysisData && analysisData.tasks) {
      const transformedTasks: TaskForDisplay[] = analysisData.tasks.map((task, index) => ({
        id: String(index + 1),
        name: task.text.length > 60 ? task.text.substring(0, 60) + '...' : task.text,
        score: Math.round(task.score),
        category: task.label === 'Automatisierbar' ? 'automatisierbar' : 'mensch',
        description: `${translateCategory(lang, task.category)} (${t(lang, 'task_confidence')}: ${Math.round(task.confidence)}%)`,
        complexity: task.complexity,
        automationTrend: task.automationTrend
      }));
      
      setDisplayTasks(transformedTasks);
    }
  }, [lang, analysisData]); // Update when language changes, but don't scroll
  
  // Use the actual ratio percentages from analysis data, not task counts
  const automatizableTasks = analysisData?.ratio.automatisierbar || 0;
  const humanTasks = analysisData?.ratio.mensch || 0;
  const totalScore = analysisData?.totalScore || 72;

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleLearnMore = () => {
    console.log('Learn more about workflows...');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header showBack={!isSharedView} />

      {/* Main Content */}
      <main className="flex-1 px-6 py-12 pt-24">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Title */}
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {jobTitle 
                ? `${t(lang, "analysis_result_for")} ${jobTitle}`
                : t(lang, "your_analysis")
              }
            </h1>
          </div>

          {/* Analysis Summary Subheadline */}
          {analysisData && (
            <div className="text-center mb-12">
              <p className="text-xl text-foreground max-w-4xl mx-auto leading-relaxed">
                {lang === 'en' 
                  ? analysisData.summary
                      .replace(/hoch/, 'high')
                      .replace(/mittel/, 'medium')
                      .replace(/niedrig/, 'low')
                      .replace(/Analyse von (\d+) identifizierten Aufgaben ergab ein (\w+)es Automatisierungspotenzial von ([\d.]+)%\. (\d+)% der Aufgaben sind potentiell automatisierbar, (\d+)% erfordern menschliche Fähigkeiten\./,
                        'Analysis of $1 identified tasks revealed $2 automation potential of $3%. $4% of tasks are potentially automatable, $5% require human capabilities.')
                  : analysisData.summary
                }
              </p>
            </div>
          )}

          {/* Score Section */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ScoreCircle 
              score={totalScore} 
              maxScore={100} 
              label="Automatisierungspotenzial" 
            />
          </div>

          {/* Info Cards */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <InfoCard
                title={t(lang, "landing_automatable")}
                value={`${automatizableTasks}%`}
                description={t(lang, "landing_automatable_desc")}
                icon={Bot}
                variant="primary"
              />
              
              <InfoCard
                title={t(lang, "landing_human")}
                value={`${humanTasks}%`}
                description={t(lang, "landing_human_desc")}
                icon={User}
                variant="destructive"
              />
            </div>
          </div>

          {/* Task List */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <TaskList tasks={displayTasks} lang={lang} />
          </div>

          {/* Landing Page Elements for Shared Views */}
          {isSharedView && (
            <>
              {/* Call to Action */}
              <section className="text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">{t(lang, "landing_ai_analysis")}</span>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {t(lang, "landing_discover")}
                  </h2>
                  
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t(lang, "landing_desc")}
                  </p>
                  
                  <Button
                    onClick={() => navigate('/')}
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200"
                  >
                    {t(lang, "landing_start")}
                  </Button>
                </div>
              </section>

              {/* Additional Benefits */}
              <section className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
                <div className="bg-muted/40 rounded-2xl p-8 md:p-12 text-center">
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
                    {t(lang, "landing_why_title")}
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6 mt-8">
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground">{t(lang, "landing_precise")}</h4>
                      <p className="text-sm text-muted-foreground">{t(lang, "landing_precise_desc")}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground">{t(lang, "landing_efficiency")}</h4>
                      <p className="text-sm text-muted-foreground">{t(lang, "landing_efficiency_desc")}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground">{t(lang, "landing_future")}</h4>
                      <p className="text-sm text-muted-foreground">{t(lang, "landing_future_desc")}</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}



          {/* Action Buttons - Only show for non-shared views */}
          {!isSharedView && (
            <TooltipProvider>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <Button 
                  onClick={handleShare}
                  size="lg"
                  className="flex items-center space-x-2 px-8"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{t(lang, "share_landing")}</span>
                </Button>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button 
                        variant="secondary"
                        disabled
                        size="lg"
                        className="flex items-center space-x-2 px-8"
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>{t(lang, "learn_workflows")}</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t(lang, "coming_soon")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )}
        </div>
      </main>

      {/* Footer */}
      <PageFooter />
      
      {/* Language Switcher */}
      <LanguageSwitcher current={lang} />
      
      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={shareUrl}
      />
    </div>
  );
};

export default Results;