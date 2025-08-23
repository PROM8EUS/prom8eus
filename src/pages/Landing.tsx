import { Button } from "@/components/ui/button";
import { Zap, User, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import LandingScoreCircle from "@/components/LandingScoreCircle";
import InfoCard from "@/components/InfoCard";
import TaskList from "@/components/TaskList";
import BarChart from "@/components/BarChart";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang, t, translateCategory } from "@/lib/i18n/i18n";
import { runAnalysis } from "@/lib/runAnalysis";
import { SharedAnalysisService } from "@/lib/sharedAnalysis";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AnalysisResult {
  totalScore: number;
  ratio: {
    automatisierbar: number;
    mensch: number;
  };
  tasks: Array<{
    text: string;
    score: number;
    label: "Automatisierbar" | "Teilweise Automatisierbar" | "Mensch";
    category: string;
    confidence: number;
    subtasks?: Array<{
      id: string;
      title: string;
      description: string;
      automationPotential: number;
      estimatedTime: number;
      priority: 'low' | 'medium' | 'high' | 'critical';
      complexity: 'low' | 'medium' | 'high';
      systems: string[];
      risks: string[];
      opportunities: string[];
      dependencies: string[];
    }>;
  }>;
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
  subtasks?: Array<{
    id: string;
    title: string;
    description: string;
    automationPotential: number;
    estimatedTime: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'low' | 'medium' | 'high';
    systems: string[];
    risks: string[];
    opportunities: string[];
    dependencies: string[];
  }>;
}

const Landing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    // Clear old sessionStorage to force new analysis
    sessionStorage.removeItem('analysisResult');
    
    const shareId = searchParams.get('share');
  
    if (shareId) {
      // Load shared analysis data from server first, then fallback to localStorage
      const loadSharedAnalysis = async () => {
        try {
          // Try server first
          const serverResult = await SharedAnalysisService.getAnalysis(shareId);
          if (serverResult.success && serverResult.data) {
            console.log('Loaded shared analysis from server:', shareId);
            // Use the original text to regenerate the analysis
            const originalText = serverResult.data.originalText;
            if (originalText) {
              // Run new analysis with the original text
              const { runAnalysis } = await import('@/lib/runAnalysis');
              const newAnalysis = await runAnalysis(originalText, lang);
              setAnalysisData(newAnalysis);
              return;
            }
          }
          
          // If server fails, try localStorage as fallback
          console.log('Server analysis not found, trying localStorage fallback');
          const localData = localStorage.getItem(`analysis_${shareId}`);
          if (localData) {
            try {
              const parsedData = JSON.parse(localData);
              console.log('Loaded shared analysis from localStorage:', shareId);
              setAnalysisData(parsedData);
              return;
            } catch (parseError) {
              console.error('Error parsing localStorage data:', parseError);
            }
          }
          
          // If both server and localStorage fail, show error message
          console.log('Shared analysis not found or expired');
          setAnalysisData(null);
          
          // Show user-friendly error message
          const errorMessage = lang === 'de' 
            ? 'Die geteilte Analyse ist nicht mehr verfügbar oder abgelaufen. Bitte führen Sie eine neue Analyse durch.'
            : 'The shared analysis is no longer available or has expired. Please perform a new analysis.';
          
          // Show error message to user
          alert(errorMessage);
          
        } catch (error) {
          console.error('Error loading shared analysis:', error);
          setAnalysisData(null);
        }
      };
      
      loadSharedAnalysis();
    } else {
      console.log('No shareId parameter found in URL');
    }
  }, [searchParams, lang]);

  const handleStartAnalysis = () => {
    navigate('/');
  };

  // Function to perform new analysis with pattern engine
  const performNewAnalysis = async (jobText: string) => {
    try {
      console.log('🔄 Performing new analysis with pattern engine for:', jobText.substring(0, 50) + '...');
      const result = await runAnalysis(jobText, lang);
      console.log('✅ New analysis completed:', {
        tasks: result.tasks.length,
        subtasks: result.tasks.reduce((sum, task) => sum + (task.subtasks?.length || 0), 0)
      });
      setAnalysisData(result);
      // Store in sessionStorage for consistency
      sessionStorage.setItem('analysisResult', JSON.stringify(result));
    } catch (error) {
      console.error('Error performing new analysis:', error);
    }
  };

  // Get job title from analysis or use default
  const getJobTitle = () => {
    console.log('Getting job title from analysisData:', analysisData);
    
    if (!analysisData?.originalText) {
      console.log('No originalText found, using default');
      return "Marketing Manager";
    }
    
    // Simple extraction of job title from original text
    const text = analysisData.originalText;
    console.log('Original text for job title extraction:', text);
    
    // Extract the actual task/job from formats like "Aufgabe: baseball" or "Position: Marketing Manager"
    if (text.includes('Aufgabe:')) {
      const taskText = text.replace('Aufgabe:', '').trim();
      if (taskText.length > 0 && taskText.length < 80) {
        console.log('Extracted job title from Aufgabe:', taskText);
        return taskText;
      }
    }
    
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim();
    
    // If first line looks like a job title (reasonable length)
    if (firstLine && firstLine.length > 5 && firstLine.length < 60 && !firstLine.includes('http')) {
      console.log('Using first line as job title:', firstLine);
      return firstLine;
    }
    
    console.log('No suitable job title found, using fallback');
    return "Ihre Position";
  };

  // Get display tasks for TaskList component
  const getDisplayTasks = (): TaskForDisplay[] => {
    if (!analysisData?.tasks || analysisData.tasks.length === 0) {
      // Return empty array if no real data - no more mock data
      return [];
    }

    return analysisData.tasks.map((task, index) => ({
      id: String(index + 1),
      name: task.text.length > 60 ? task.text.substring(0, 60) + '...' : task.text,
      score: Math.round(task.score),
      category: task.label,
      description: `${translateCategory(lang, task.category)} (${t(lang, 'task_confidence')}: ${Math.round(task.confidence || 70)}%)`,
      subtasks: task.subtasks // Pass through subtasks from pattern engine
    }));
  };

  // Check if we have real analysis data
  const hasRealData = analysisData && analysisData.tasks && analysisData.tasks.length > 0;
  
  // Use real data only - no more fallback to demo values
  const displayScore = analysisData?.totalScore || 0;
  const displayAutomatable = analysisData?.ratio?.automatisierbar || 0;
  const displayHuman = analysisData?.ratio?.mensch || 0;
  const displayJobTitle = getJobTitle();
  const displayTasks = getDisplayTasks();
  const automatizableTasks = displayTasks.filter(task => task.category === 'automatisierbar').length;
  const humanTasks = displayTasks.filter(task => task.category === 'mensch').length;

  return (
    <div className="bg-background">
      <Header />
      <div className="min-h-screen">
        <main className="px-6 py-12 pt-24">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section with Score */}
          <section className="animate-fade-in">
            {hasRealData ? (
              <LandingScoreCircle 
                score={displayScore} 
                maxScore={100} 
                jobTitle={displayJobTitle}
              />
            ) : (
              <div className="text-center space-y-6">
                <div className="max-w-2xl mx-auto">
                  <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                    {t(lang, "landing_headline")}
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    {t(lang, "landing_subtitle")}
                  </p>
                  <Button 
                    onClick={handleStartAnalysis}
                    size="lg"
                    className="px-16 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200 shadow-lg"
                  >
                    {t(lang, "start_analysis")}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Info Cards */}
          {hasRealData && (
            <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <InfoCard
                  title={t(lang, "landing_automatable")}
                  value={`${displayAutomatable}%`}
                  description={t(lang, "landing_automatable_desc")}
                  icon={Zap}
                  variant="primary"
                />
                
                <InfoCard
                  title={t(lang, "landing_human")}
                  value={`${displayHuman}%`}
                  description={t(lang, "landing_human_desc")}
                  icon={User}
                  variant="human"
                />
              </div>
            </section>
          )}

          {/* Task Analysis Breakdown - Only show if we have real analysis data */}
          {hasRealData && (
            <>
              {/* Bar Chart */}
              <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <BarChart 
                  automatizable={automatizableTasks} 
                  humanRequired={humanTasks} 
                />
              </section>

              {/* Task List */}
              <section className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <TaskList tasks={displayTasks} lang={lang} />
              </section>
            </>
          )}

          {/* Call to Action */}
          <section className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
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
                onClick={handleStartAnalysis}
                size="lg"
                className="px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200"
              >
                {t(lang, "landing_start")}
              </Button>
            </div>
          </section>

          {/* Additional Benefits */}
          <section className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <div className="bg-muted/20 rounded-2xl p-8 md:p-12 text-center">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
                {t(lang, "landing_why_title")}
              </h3>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="space-y-2">
                  <div className="text-3xl">🎯</div>
                  <h4 className="font-semibold text-foreground">{t(lang, "landing_precise")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t(lang, "landing_precise_desc")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">⚡</div>
                  <h4 className="font-semibold text-foreground">{t(lang, "landing_efficiency")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t(lang, "landing_efficiency_desc")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">🚀</div>
                  <h4 className="font-semibold text-foreground">{t(lang, "landing_future")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t(lang, "landing_future_desc")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
        </main>
      </div>
      <PageFooter />
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>
  );
};

export default Landing;