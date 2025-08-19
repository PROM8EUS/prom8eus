import { Button } from "@/components/ui/button";
import { Bot, User, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import LandingScoreCircle from "@/components/LandingScoreCircle";
import InfoCard from "@/components/InfoCard";
import TaskList from "@/components/TaskList";
import BarChart from "@/components/BarChart";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang, t } from "@/lib/i18n/i18n";

interface AnalysisResult {
  totalScore: number;
  ratio: {
    automatisierbar: number;
    mensch: number;
  };
  tasks: Array<{
    text: string;
    score: number;
    label: "Automatisierbar" | "Mensch";
    category: string;
    confidence: number;
  }>;
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
}

const Landing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    // Try to load real analysis results from sessionStorage
    try {
      const storedResult = sessionStorage.getItem('analysisResult');
      if (storedResult) {
        const parsedResult: AnalysisResult = JSON.parse(storedResult);
        setAnalysisData(parsedResult);
      }
    } catch (error) {
      console.error('Error loading analysis results for landing page:', error);
    }
  }, []);

  const handleStartAnalysis = () => {
    navigate('/');
  };

  // Get job title from analysis or use default
  const getJobTitle = () => {
    if (!analysisData?.originalText) return "Marketing Manager";
    
    // Simple extraction of job title from original text
    const text = analysisData.originalText;
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim();
    
    // If first line looks like a job title (reasonable length)
    if (firstLine && firstLine.length > 5 && firstLine.length < 60 && !firstLine.includes('http')) {
      return firstLine;
    }
    
    return "Ihre Position";
  };

  // Get display tasks for TaskList component
  const getDisplayTasks = (): TaskForDisplay[] => {
    if (!analysisData?.tasks || analysisData.tasks.length === 0) {
      // Return demo tasks if no real data
      return [
        {
          id: '1',
          name: 'Datenerfassung und -eingabe',
          score: 95,
          category: 'automatisierbar',
          description: 'Strukturierte Dateneingabe in Systeme'
        },
        {
          id: '2',
          name: 'Berichtserstellung', 
          score: 88,
          category: 'automatisierbar',
          description: 'Automatische Generierung von Standardberichten'
        },
        {
          id: '3',
          name: 'Kundenberatung',
          score: 35,
          category: 'mensch',
          description: 'Persönliche Beratung und Problemlösung'
        }
      ];
    }

    return analysisData.tasks.map((task, index) => ({
      id: String(index + 1),
      name: task.text.length > 60 ? task.text.substring(0, 60) + '...' : task.text,
      score: Math.round(task.score),
      category: task.label === 'Automatisierbar' ? 'automatisierbar' : 'mensch',
      description: `${task.category} (Confidence: ${Math.round(task.confidence)}%)`
    }));
  };

  // Use real data or fallback to demo values
  const displayScore = analysisData?.totalScore || 80;
  const displayAutomatable = analysisData?.ratio.automatisierbar || 65;
  const displayHuman = analysisData?.ratio.mensch || 35;
  const displayJobTitle = getJobTitle();
  const displayTasks = getDisplayTasks();
  const automatizableTasks = displayTasks.filter(task => task.category === 'automatisierbar').length;
  const humanTasks = displayTasks.filter(task => task.category === 'mensch').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section with Score */}
          <section className="animate-fade-in">
            <LandingScoreCircle 
              score={displayScore} 
              maxScore={100} 
              jobTitle={displayJobTitle}
            />
          </section>

          {/* Info Cards */}
          <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <InfoCard
                title={t(lang, "landing_automatable")}
                value={`${displayAutomatable}%`}
                description={t(lang, "landing_automatable_desc")}
                icon={Bot}
                variant="primary"
              />
              
              <InfoCard
                title={t(lang, "landing_human")}
                value={`${displayHuman}%`}
                description={t(lang, "landing_human_desc")}
                icon={User}
                variant="destructive"
              />
            </div>
          </section>

          {/* Task Analysis Breakdown - Only show if we have real analysis data */}
          {analysisData && analysisData.tasks && analysisData.tasks.length > 0 && (
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
                <TaskList tasks={displayTasks} />
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

      {/* Footer */}
      <PageFooter />
      
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>
  );
};

export default Landing;