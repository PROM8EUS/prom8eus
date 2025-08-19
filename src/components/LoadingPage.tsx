import { Loader2 } from "lucide-react";

const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Animated Spinner */}
        <div className="relative">
          <div className="w-16 h-16 mx-auto">
            <Loader2 className="w-16 h-16 text-primary animate-spin-slow" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-80 max-w-full mx-auto">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-progress-bar"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Ihre Analyse wird erstellt
          </h2>
          <div className="flex items-center justify-center space-x-1">
            <span className="text-muted-foreground">Bitte warten</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse-dot"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>

        {/* Subtle hint */}
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Unsere KI analysiert Ihren Text und erstellt eine detaillierte Auswertung
        </p>
      </div>
    </div>
  );
};

export default LoadingPage;