import { Button } from "@/components/ui/button";
import { Share2, BookOpen, Zap, User, Target, Rocket, Sparkles, Lightbulb, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ScoreCircle from "@/components/ScoreCircle";
import InfoCard from "@/components/InfoCard";
import TaskList from "@/components/TaskList";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Header from "@/components/Header";
import { AIToolRecommendations } from "@/components/AIToolRecommendations";

import ShareModal from "@/components/ShareModal";
import PageFooter from "@/components/PageFooter";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { resolveLang, t, translateCategory } from "@/lib/i18n/i18n";
import { generateSummary } from "@/lib/runAnalysis";
import { detectIndustry } from "@/lib/runAnalysis";
import { SharedAnalysisService } from "@/lib/sharedAnalysis";

// Animated Letter Component
const AnimatedLetter = ({ letter, index, isVisible }: { letter: string; index: number; isVisible: boolean }) => {
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsHighlighted(true); // Highlight with brand color
        const restoreTimer = setTimeout(() => {
          setIsHighlighted(false); // Back to normal
        }, 150);
        return () => clearTimeout(restoreTimer);
      }, index * 40); // Faster overlapping animation
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, index]);

  return (
    <span
      className={`inline-block transition-colors duration-150 ease-in-out ${
        isHighlighted ? 'text-primary' : 'text-foreground'
      }`}
    >
      {letter}
    </span>
  );
};

// Animated Word Component
const AnimatedWord = ({ word, isVisible }: { word: string; isVisible: boolean }) => {
  return (
    <span>
      {word.split('').map((char, index) => (
        <AnimatedLetter
          key={index}
          letter={char === ' ' ? '\u00A0' : char} // Use non-breaking space for better animation
          index={index}
          isVisible={isVisible}
        />
      ))}
    </span>
  );
};

interface AnalysisTask {
  text: string;
  score: number;
  label: "Automatisierbar" | "Teilweise Automatisierbar" | "Mensch";
  category: string;
  confidence: number;
  aiTools?: string[];
  complexity?: 'low' | 'medium' | 'high';
  automationTrend?: 'increasing' | 'stable' | 'decreasing';
  automationRatio?: number;
  humanRatio?: number;
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
  category: 'automatisierbar' | 'teilweise' | 'mensch';
  description: string;
  complexity?: 'low' | 'medium' | 'high';
  automationTrend?: 'increasing' | 'stable' | 'decreasing';
  aiTools?: string[];
  automationRatio?: number;
  humanRatio?: number;
}

// Fallback mock data
const mockTasks: TaskForDisplay[] = [
  {
    id: '1',
    name: 'Datenerfassung und -eingabe',
    score: 95,
    category: 'automatisierbar' as const,
    description: 'Strukturierte Dateneingabe in Systeme',
    automationRatio: 85,
    humanRatio: 15
  },
  {
    id: '2',
    name: 'Berichtserstellung',
    score: 88,
    category: 'automatisierbar' as const,
    description: 'Automatische Generierung von Standardberichten',
    automationRatio: 80,
    humanRatio: 20
  },
  {
    id: '3',
    name: 'Terminplanung',
    score: 82,
    category: 'teilweise' as const,
    description: 'Koordination und Verwaltung von Terminen',
    automationRatio: 60,
    humanRatio: 40
  },
  {
    id: '4',
    name: 'Kundenberatung',
    score: 35,
    category: 'mensch' as const,
    description: 'Persönliche Beratung und Problemlösung',
    automationRatio: 15,
    humanRatio: 85
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
  const [isJobTitleVisible, setIsJobTitleVisible] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Generate unique share URL for this analysis
  const generateShareUrl = async (data: AnalysisResult): Promise<string> => {
    const shareId = SharedAnalysisService.generateShareId();
    
    try {
      // Extract job title from original text
      let jobTitle = "";
      if (data.originalText) {
        const lines = data.originalText.split('\n');
        const firstLine = lines[0]?.trim();
        if (firstLine && firstLine.length > 5 && firstLine.length < 60 && !firstLine.includes('http')) {
          jobTitle = firstLine;
        }
      }

      // Store analysis data on server
      const result = await SharedAnalysisService.storeAnalysis({
        shareId,
        analysisData: data,
        originalText: data.originalText || '',
        jobTitle: jobTitle || undefined,
        totalScore: data.totalScore,
        taskCount: data.tasks?.length || 0
      });

      if (result.success) {
        console.log('Successfully stored shared analysis:', shareId);
        return SharedAnalysisService.createShareUrl(shareId, lang);
      } else {
        console.warn('Failed to store analysis on server, using localStorage fallback:', result.error);
        // Fallback to localStorage
        return generateLocalShareUrl(data);
      }
    } catch (error) {
      console.warn('Error storing analysis on server, using localStorage fallback:', error);
      // Fallback to localStorage
      return generateLocalShareUrl(data);
    }
  };

  // Fallback function for localStorage sharing
  const generateLocalShareUrl = (data: AnalysisResult): string => {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Clean up old analysis data first
      cleanupOldAnalysisData();
      
      // Check if data is too large for localStorage (limit is typically 5-10MB)
      const dataSize = JSON.stringify(data).length;
      const maxSize = 4 * 1024 * 1024; // 4MB limit to be safe
      
      if (dataSize > maxSize) {
        console.warn(`Analysis data too large (${dataSize} bytes), using session-based sharing`);
        // Fallback: use sessionStorage instead
        sessionStorage.setItem('sharedAnalysis', JSON.stringify(data));
        const baseUrl = window.location.origin;
        return `${baseUrl}/results?session=${analysisId}&lang=${lang}`;
      }
      
      // Store analysis data in localStorage with the unique ID
      localStorage.setItem(analysisId, JSON.stringify(data));
      
      // Generate shareable URL with current page
      const baseUrl = window.location.origin;
      return `${baseUrl}/results?share=${analysisId}&lang=${lang}`;
    } catch (error) {
      console.warn('Failed to store analysis data, using session-based sharing:', error);
      // Fallback: use sessionStorage instead
      sessionStorage.setItem('sharedAnalysis', JSON.stringify(data));
      const baseUrl = window.location.origin;
      return `${baseUrl}/results?session=${analysisId}&lang=${lang}`;
    }
  };

  // Clean up old analysis data to prevent quota exceeded
  const cleanupOldAnalysisData = () => {
    try {
      const keys = Object.keys(localStorage);
      const analysisKeys = keys.filter(key => key.startsWith('analysis_'));
      
      // Keep only the 5 most recent analysis entries
      if (analysisKeys.length > 5) {
        // Sort by timestamp (newest first)
        analysisKeys.sort((a, b) => {
          const timestampA = parseInt(a.split('_')[1]);
          const timestampB = parseInt(b.split('_')[1]);
          return timestampB - timestampA;
        });
        
        // Remove oldest entries
        const keysToRemove = analysisKeys.slice(5);
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to cleanup old analysis data:', error);
    }
  };

  useEffect(() => {
    // Check if this is a shared view
    const shareId = searchParams.get("share");
    const sessionId = searchParams.get("session");
    
    if (shareId || sessionId) {
      setIsSharedView(true);
      
      // Try to load shared analysis from server first, then fallback to localStorage/sessionStorage
      const loadSharedAnalysis = async () => {
        try {
          let sharedData = null;
          let parsedResult: AnalysisResult | null = null;

          if (shareId) {
            // Try server first
            const serverResult = await SharedAnalysisService.getAnalysis(shareId);
            if (serverResult.success && serverResult.data) {
              console.log('Loaded shared analysis from server:', shareId);
              parsedResult = serverResult.data.analysisData;
              setJobTitle(serverResult.data.jobTitle || '');
            } else {
              // Fallback to localStorage
              console.log('Server analysis not found, trying localStorage:', shareId);
              const localData = localStorage.getItem(shareId);
              if (localData) {
                parsedResult = JSON.parse(localData);
              }
            }
          } else if (sessionId) {
            // Session-based sharing (localStorage fallback)
            const localData = sessionStorage.getItem('sharedAnalysis');
            if (localData) {
              parsedResult = JSON.parse(localData);
            }
          }

          if (parsedResult) {
            setAnalysisData(parsedResult);
            
            // Extract job title from original text if not already set
            if (!jobTitle && parsedResult.originalText) {
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
                category: task.label === 'Automatisierbar' ? 'automatisierbar' : 
                          task.label === 'Teilweise Automatisierbar' ? 'teilweise' : 'mensch',
                description: `${task.category ? translateCategory(lang, task.category) : 'Allgemein'} (${t(lang, 'task_confidence')}: ${Math.round(task.confidence || task.score)}%)`,
                complexity: task.complexity,
                automationTrend: task.automationTrend,
                automationRatio: task.automationRatio,
                humanRatio: task.humanRatio
              }));
              setDisplayTasks(transformedTasks);
            }
          } else {
            // Shared data not found - show error message and redirect to home
            console.error('Shared analysis data not found for ID:', shareId || sessionId);
            setAnalysisError('Die geteilte Analyse konnte nicht gefunden werden. Möglicherweise wurde sie gelöscht oder ist abgelaufen.');
            // Redirect to home page after 3 seconds
            setTimeout(() => {
              navigate('/');
            }, 3000);
          }
        } catch (error) {
          console.error('Error loading shared analysis:', error);
          setAnalysisError('Fehler beim Laden der geteilten Analyse.');
        }
      };

      loadSharedAnalysis();
    } else {
      // Try to load real analysis results from sessionStorage
      try {
        const storedResult = sessionStorage.getItem('analysisResult');

        
        if (storedResult) {
          const parsedResult: AnalysisResult = JSON.parse(storedResult);

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
              category: task.label === 'Automatisierbar' ? 'automatisierbar' : 
                        task.label === 'Teilweise Automatisierbar' ? 'teilweise' : 'mensch',
              description: `${task.category ? translateCategory(lang, task.category) : 'Allgemein'} (${t(lang, 'task_confidence')}: ${Math.round(task.confidence || task.score)}%)`,
              complexity: task.complexity,
              automationTrend: task.automationTrend,
              automationRatio: task.automationRatio,
              humanRatio: task.humanRatio,
              aiTools: task.aiTools
            }));
            

            setDisplayTasks(transformedTasks);
            
            // Generate share URL
            generateShareUrl(parsedResult).then(url => setShareUrl(url));
            
            // Note: Scroll to top is handled by the separate useEffect for initial mount
          }
        } else {
          // Handle case when no analysis data is found
          console.log('No analysis data found in URL parameters');
        }
      } catch (error) {
        console.error('Error loading analysis results:', error);
        // Keep using mock data as fallback
      }
    }
  }, [searchParams]); // Add searchParams dependency to detect share links
  
  // Additional effect to ensure smooth scroll after component is fully rendered (only on initial load)
  useEffect(() => {
    // Only scroll on initial mount, not when data changes
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
    
    return () => clearTimeout(timer);
  }, []); // Only run once on mount, not when analysisData changes
  
  // Update task descriptions and regenerate summary when language changes (without scrolling)
  useEffect(() => {
    if (analysisData && analysisData.tasks) {
      const transformedTasks: TaskForDisplay[] = analysisData.tasks.map((task, index) => ({
        id: String(index + 1),
        name: task.text.length > 60 ? task.text.substring(0, 60) + '...' : task.text,
        score: Math.round(task.score),
        category: task.label === 'Automatisierbar' ? 'automatisierbar' : 
                  task.label === 'Teilweise Automatisierbar' ? 'teilweise' : 'mensch',
        description: `${task.category ? translateCategory(lang, task.category) : 'Allgemein'} (${t(lang, 'task_confidence')}: ${Math.round(task.confidence || task.score)}%)`,
        complexity: task.complexity,
        automationTrend: task.automationTrend,
        aiTools: task.aiTools
      }));
      
      setDisplayTasks(transformedTasks);
      
      // Regenerate summary in the correct language
      const taskCount = analysisData.tasks.length;
      const ratio = analysisData.ratio;
      const totalScore = analysisData.totalScore;
      
      // Generate new summary in the correct language
      const newSummary = generateSummary(totalScore, ratio, taskCount, lang);
      
      // Update the analysis data with the new summary only if it's different
      setAnalysisData(prev => {
        if (!prev) return null;
        if (prev.summary === newSummary) return prev; // Avoid unnecessary updates
        return {
          ...prev,
          summary: newSummary
        };
      });
    }
  }, [lang, analysisData?.tasks, analysisData?.ratio, analysisData?.totalScore]); // More specific dependencies
  
  // Trigger job title animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsJobTitleVisible(true); // Start animation
    }, 500); // Start animation after 500ms

    return () => clearTimeout(timer);
  }, [jobTitle]); // Trigger when jobTitle changes
  
  // Use the actual ratio percentages from analysis data, not task counts
  const automatizableTasks = analysisData?.ratio?.automatisierbar ?? 0;
  const humanTasks = analysisData?.ratio?.mensch ?? 0;
  const totalScore = analysisData?.totalScore ?? 72;

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleLearnMore = () => {
    navigate('/agents-workflows');
  };

  return (
    <div className="bg-background">
      <Header />
      <div className="min-h-screen">
        <main className="px-6 py-12 pt-24">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {jobTitle 
                ? (
                  <>
                    {t(lang, "analysis_result_for")}
                    <br />
                    <AnimatedWord word={jobTitle} isVisible={isJobTitleVisible} />
                  </>
                )
                : t(lang, "your_analysis")
              }
            </h1>
          </div>

          {/* Error Display */}
          {analysisError && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-left">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p>{analysisError}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(lang, "redirecting_to_home")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Check if tasks were found */}
          {analysisData && analysisData.tasks && analysisData.tasks.length > 0 ? (
            <>
              {/* Analysis Summary Subheadline */}
              <div className="text-center mb-12">
                <p className="text-xl text-foreground max-w-4xl mx-auto leading-relaxed">
                  {analysisData.summary}
                </p>
              </div>

              {/* Score Section */}
              <div className="flex justify-center">
                <ScoreCircle 
                  score={totalScore} 
                  maxScore={100} 
                  label={t(lang, "score_label")} 
                />
              </div>

              {/* Info Cards */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <InfoCard
                    title={t(lang, "landing_automatable")}
                    value={`${automatizableTasks}%`}
                    description={t(lang, "landing_automatable_desc")}
                    icon={Zap}
                    variant="primary"
                  />
                  
                  <InfoCard
                    title={t(lang, "landing_human")}
                    value={`${humanTasks}%`}
                    description={t(lang, "landing_human_desc")}
                    icon={User}
                    variant="human"
                  />
                </div>
              </div>

              {/* Task List */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <TaskList tasks={displayTasks} lang={lang} />
              </div>
            </>
          ) : (
            /* No tasks found - show helpful message */
            <div className="text-center space-y-8">
              <div className="bg-muted/20 rounded-2xl p-8 md:p-12">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {t(lang, "no_tasks_found_title")}
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t(lang, "no_tasks_found_desc")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      size="lg"
                    >
                      {t(lang, "try_again")}
                    </Button>
                    <Button
                      onClick={() => navigate('/about')}
                      size="lg"
                    >
                      {t(lang, "learn_more")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Landing Page Elements for Shared Views */}
          {isSharedView && (
            <>
              {/* Call to Action */}
              <section className="text-center">
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
              <section>
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



          {/* AI Tool Recommendations */}
          {!isSharedView && (
            <section className="mt-12">
              <AIToolRecommendations
                industry={detectIndustry(analysisData?.originalText || '')}
                tasks={analysisData?.tasks || []}
                className="max-w-6xl mx-auto"
                lang={lang}
              />
            </section>
          )}



          {/* Action Buttons - Only show for non-shared views */}
          {!isSharedView && (
            <TooltipProvider>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button 
                  onClick={handleShare}
                  size="lg"
                  className="flex items-center space-x-2 px-8"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{t(lang, "share_landing")}</span>
                </Button>
                
                <Button 
                  onClick={handleLearnMore}
                  variant="secondary"
                  size="lg"
                  className="flex items-center space-x-2 px-8"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>{t(lang, "learn_workflows")}</span>
                </Button>
              </div>
            </TooltipProvider>
          )}
        </div>
        </main>
      </div>
      <PageFooter />
      
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
      
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