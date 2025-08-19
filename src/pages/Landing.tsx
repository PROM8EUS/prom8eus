import { Button } from "@/components/ui/button";
import { Bot, User, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import LandingScoreCircle from "@/components/LandingScoreCircle";
import InfoCard from "@/components/InfoCard";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang } from "@/lib/i18n/i18n";

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

  // Use real data or fallback to demo values
  const displayScore = analysisData?.totalScore || 80;
  const displayAutomatable = analysisData?.ratio.automatisierbar || 65;
  const displayHuman = analysisData?.ratio.mensch || 35;
  const displayJobTitle = getJobTitle();

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
                title="Automatisierbar"
                value={`${displayAutomatable}%`}
                description="Aufgaben können durch KI und Automatisierung übernommen werden"
                icon={Bot}
                variant="primary"
              />
              
              <InfoCard
                title="Mensch notwendig"
                value={`${displayHuman}%`}
                description="Aufgaben erfordern menschliche Kreativität und Entscheidungsfindung"
                icon={User}
                variant="destructive"
              />
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">KI-gestützte Analyse</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Entdecken Sie das Automatisierungspotenzial Ihrer Position
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Lassen Sie unsere KI Ihre Stellenbeschreibung oder Aufgabenliste analysieren 
                und erfahren Sie, welche Tätigkeiten automatisiert werden können.
              </p>
              
              <Button
                onClick={handleStartAnalysis}
                size="lg"
                className="px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200"
              >
                Eigene Analyse starten
              </Button>
            </div>
          </section>

          {/* Additional Benefits */}
          <section className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <div className="bg-muted/20 rounded-2xl p-8 md:p-12 text-center">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
                Warum eine Automatisierungs-Analyse?
              </h3>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="space-y-2">
                  <div className="text-3xl">🎯</div>
                  <h4 className="font-semibold text-foreground">Präzise Einschätzung</h4>
                  <p className="text-sm text-muted-foreground">
                    Erhalten Sie eine detaillierte Bewertung Ihrer Aufgaben
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">⚡</div>
                  <h4 className="font-semibold text-foreground">Effizienz steigern</h4>
                  <p className="text-sm text-muted-foreground">
                    Identifizieren Sie Potenziale für Prozessoptimierung
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">🚀</div>
                  <h4 className="font-semibold text-foreground">Zukunft gestalten</h4>
                  <p className="text-sm text-muted-foreground">
                    Bereiten Sie sich auf die Arbeitswelt von morgen vor
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