import React from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { resolveLang, t } from "@/lib/i18n/i18n";

const LoadingPage = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Animated Spinner */}
        <div className="relative">
          <div className="w-16 h-16 mx-auto">
            <Loader2 className="w-16 h-16 text-primary animate-spin-slow" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {t(lang, "analysis_creating")}
          </h2>
          {/* Dynamic step indicator */}
          <AnalysisSteps lang={lang} />
        </div>

        {/* Subtle hint */}
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t(lang, "ai_analyzing")}
        </p>
      </div>
    </div>
  );
};

export default LoadingPage;

// shows current backend step instead of static "please wait"
function AnalysisSteps({ lang }: { lang: 'de' | 'en' }) {
  // These mirror the async pipeline in runAnalysis
  const steps = lang === 'de'
    ? [
        'Extrahiere Text …',
        'Erzeuge Teilaufgaben …',
        'Bewerte Automatisierungspotenzial …',
        'Suche passende Workflows …',
        'Reranke und personalisiere …',
      ]
    : [
        'Extracting text …',
        'Generating subtasks …',
        'Scoring automation potential …',
        'Finding matching workflows …',
        'Reranking and personalizing …',
      ];

  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % steps.length);
    }, 1200);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="flex items-center justify-center space-x-2">
      <span className="text-muted-foreground">{steps[index]}</span>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse-dot"></div>
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
}